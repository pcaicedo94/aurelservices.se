-- The offer-acceptance system: requests, offers, acceptances, withdrawals and
-- the travel-fee zones.
--
-- Run in Supabase -> SQL Editor -> New query -> Run.
-- Safe to run more than once.
--
--
-- WHY THESE TABLES LOOK LIKE THIS
--
-- 1. The database write IS the event.
--    php/lib/BookingStore.php carries the lesson the hard way: the JavaScript
--    booking path wrote the Google Calendar event first and the database row
--    second, and only logged a failed insert. Every booking between March 2026
--    and the fix therefore succeeded while silently losing its record (see
--    scripts/supabase-bookings-migration.sql). Nothing in this file may be
--    treated as "best effort". An acceptance that does not land in
--    offer_acceptances did not happen, and the customer must be told so.
--
-- 2. The snapshot is frozen, never recomputed.
--    offers.snapshot holds exactly what the customer was shown: every price
--    line, every label, every legal paragraph, in the language they read. When
--    config/prices.json changes next month, an offer sent last month must still
--    render the figures it was sent with. Swedish law requires the price to be
--    exact and binding before acceptance (prisinformationslagen 2004:347 10 §,
--    distansavtalslagen 2005:59 2 kap. 7 §), so a recomputed price is not a
--    cosmetic bug: an undisclosed amount cannot be charged at all.
--
-- 3. The link is a selector plus a hashed verifier.
--    token_selector is what the lookup uses. token_verifier_hash is a SHA-256
--    of the half that only ever exists in the customer's email. A dump of this
--    table therefore does not let anyone accept an offer. php/api/calendar.php
--    already uses hash_equals for its single shared token; this is the same
--    idea sized for one secret per customer.
--
-- 4. The link outlives the offer.
--    distansavtalslagen 2 kap. 10 a §, in force since 19 June 2026, requires an
--    online withdrawal function to stay "lattillgangligt i onlinegranssnittet
--    under hela angerfristen" -- reachable for the whole 14-day period, counted
--    from the day the contract was made (2 kap. 12 §). So offers.expires_at
--    governs whether the offer can still be ACCEPTED, and
--    offers.link_valid_until governs whether the page still RESPONDS. They are
--    different dates on purpose and link_valid_until is always the later one.
--
-- 5. Which checkboxes appear is a server decision.
--    requires_start_consent and requires_discount_consent are written when the
--    offer is created, from the service date and the offer contents. The screen
--    renders what the row says. A browser cannot talk the server out of a
--    required declaration by not submitting its field.
--
-- 6. Row level security on, no policies.
--    These tables hold names, addresses, phones, emails and the proof of a
--    contract. Nothing in the site reads them from the browser: only the
--    server, with the service role key, which bypasses RLS. Enabling RLS
--    changes nothing for the app and stops the public anon key from ever
--    reading any of it. Same decision as public.bookings.


-- ---------------------------------------------------------------------------
-- 1. Requests: what the customer asked for, before anyone priced it.
-- ---------------------------------------------------------------------------

create table if not exists public.quote_requests (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  service       text not null,
  name          text not null,
  email         text not null,
  phone         text,
  address       text,
  postnummer    text,
  area_sqm      numeric,
  rooms         integer,

  -- Everything the per-service questions collected. Kept as sent so a new
  -- question next month does not need a migration.
  details       jsonb not null default '{}'::jsonb,
  message       text,

  source        text,

  status        text not null default 'new'
                  constraint quote_requests_status_check
                  check (status in ('new', 'quoted', 'won', 'lost', 'abandoned'))
);

create index if not exists quote_requests_created_at_idx
  on public.quote_requests (created_at desc);

create index if not exists quote_requests_status_idx
  on public.quote_requests (status)
  where status in ('new', 'quoted');


-- ---------------------------------------------------------------------------
-- 2. Offers: one row per link sent to a customer.
-- ---------------------------------------------------------------------------

create table if not exists public.offers (
  id                      uuid primary key default gen_random_uuid(),
  request_id              uuid references public.quote_requests(id) on delete set null,

  created_at              timestamptz not null default now(),
  created_by              text,
  sent_at                 timestamptz,

  -- The unique link. See note 3 in the header.
  token_selector          text not null,
  token_verifier_hash     text not null,

  -- See note 4. expires_at = can it still be accepted.
  -- link_valid_until      = does the page still respond (withdrawal window).
  expires_at              timestamptz not null,
  link_valid_until        timestamptz not null,

  -- See note 2. The whole rendered offer, frozen.
  snapshot                jsonb not null,

  -- Figures copied out of the snapshot for the office panel and reporting
  -- ONLY. The snapshot is the source of truth; these are for sorting and sums.
  service                 text not null,
  arbetskostnad_incl_vat  numeric not null,
  rut_deduction           numeric not null default 0,
  resetillagg_incl_vat    numeric not null default 0,
  total_to_pay            numeric not null,
  travel_zone             integer,

  -- When the cleaning is scheduled. Null = not agreed yet.
  -- This is what decides requires_start_consent.
  service_at              timestamptz,

  -- See note 5. Decided server side at creation.
  requires_start_consent     boolean not null default false,
  requires_discount_consent  boolean not null default false,

  status                  text not null default 'draft'
                            constraint offers_status_check
                            check (status in ('draft', 'sent', 'accepted',
                                              'declined', 'expired',
                                              'withdrawn', 'cancelled')),

  -- Why the office cancelled it, when they did.
  cancelled_reason        text,

  constraint offers_token_selector_key unique (token_selector),
  constraint offers_link_outlives_offer check (link_valid_until >= expires_at),
  constraint offers_total_non_negative check (total_to_pay >= 0)
);

create index if not exists offers_status_idx
  on public.offers (status);

create index if not exists offers_created_at_idx
  on public.offers (created_at desc);

create index if not exists offers_service_at_idx
  on public.offers (service_at)
  where service_at is not null;

create index if not exists offers_request_id_idx
  on public.offers (request_id)
  where request_id is not null;


-- ---------------------------------------------------------------------------
-- 3. Acceptances: the proof. One row per offer, ever.
-- ---------------------------------------------------------------------------
--
-- The unique constraint on offer_id is what makes acceptance idempotent: a
-- double-tapped button, a retried request or a mail client prefetching the
-- link cannot produce a second contract. The second insert fails and the
-- handler reports the first acceptance back instead.

create table if not exists public.offer_acceptances (
  id                    uuid primary key default gen_random_uuid(),
  offer_id              uuid not null references public.offers(id) on delete restrict,

  accepted_at           timestamptz not null default now(),

  -- The declarations, each stored separately because each one does a different
  -- job in law and a dispute is about one of them, not about "the terms".
  --
  -- consent_info     -- read the withdrawal information (2 kap. 2 § 1 st 10)
  -- consent_start    -- expressly requested the work begin inside the period
  --                     (2 kap. 11 § 1 and 15 § 3: without it, a cleaning done
  --                      inside the 14 days is unbillable)
  -- consent_lapse    -- accepted that the right lapses once the service is
  --                     fully performed (the other half of 2 kap. 11 § 1;
  --                      consent_start alone does NOT extinguish the right)
  -- consent_discount -- expressly approved the 300 kr clawback term
  --                     (avtalsvillkorslagen 1994:1512 13 §: without its own
  --                      express approval the term is void and refundable)
  consent_info          boolean not null,
  consent_start         boolean not null default false,
  consent_lapse         boolean not null default false,
  consent_discount      boolean not null default false,

  -- Exactly what the button said, stored verbatim. C-249/21 Fuhrmann-2 holds
  -- that only the words on the button decide whether the consumer is bound, so
  -- the wording is evidence and belongs in the record, not in the code only.
  button_label          text not null,

  -- What the customer saw: the rendered screen and a hash of it. The hash
  -- makes tampering with the snapshot detectable.
  screen_snapshot       jsonb not null,
  screen_sha256         text not null,

  -- Pseudonymised. The full address is never stored: it proves nothing a hash
  -- does not, and it is personal data we would then have to justify keeping.
  ip_hash               text,
  user_agent            text,

  -- Computed and frozen at acceptance, because this is the date every later
  -- decision depends on and it must not drift if the rules change.
  angerfrist_ends_at    timestamptz not null,

  constraint offer_acceptances_offer_id_key unique (offer_id)
);

create index if not exists offer_acceptances_accepted_at_idx
  on public.offer_acceptances (accepted_at desc);

create index if not exists offer_acceptances_angerfrist_idx
  on public.offer_acceptances (angerfrist_ends_at);


-- ---------------------------------------------------------------------------
-- 4. Withdrawals: the angerfunktion's record and its receipt.
-- ---------------------------------------------------------------------------
--
-- Two timestamps, and the difference matters. Directive 2011/83 art. 11a.5
-- makes the deadline turn on when the consumer SENT the declaration, not on
-- when we processed it. So submitted_at decides within_angerfrist, and
-- received_at is only what the receipt has to confirm (2 kap. 10 a § 3 st).

create table if not exists public.withdrawals (
  id                  uuid primary key default gen_random_uuid(),
  offer_id            uuid not null references public.offers(id) on delete restrict,

  submitted_at        timestamptz not null,
  received_at         timestamptz not null default now(),

  -- What the consumer stated or confirmed. Prefilled from the offer, which is
  -- what 10 a § 2 st means by "ange eller bekrafta", and why we may not demand
  -- BankID or a fresh identification.
  consumer_name       text not null,
  contract_ref        text not null,

  -- The receipt: where it goes, and whether it got there. A failed send is a
  -- visible problem, not a logged one -- 10 a § 3 st requires it "utan
  -- drojsmal", so receipt_error being non-null is an alarm for the office.
  receipt_channel     text not null default 'email',
  receipt_to          text not null,
  receipt_sent_at     timestamptz,
  receipt_error       text,

  -- The message as sent to the consumer, because art. 11a.4 requires the
  -- receipt to carry "dess innehall samt datum och tidpunkt for inlamnandet".
  message_body        jsonb not null,

  within_angerfrist   boolean not null,

  constraint withdrawals_received_after_submitted
    check (received_at >= submitted_at - interval '5 minutes')
);

create index if not exists withdrawals_offer_id_idx
  on public.withdrawals (offer_id);

create index if not exists withdrawals_unsent_receipt_idx
  on public.withdrawals (received_at)
  where receipt_sent_at is null;


-- ---------------------------------------------------------------------------
-- 5. Travel-fee zones, versioned.
-- ---------------------------------------------------------------------------
--
-- Versioned because an offer sent in March must still be explainable in
-- November: valid_from/valid_to let us reconstruct which fee was shown. The
-- fee must be an exact figure on screen before acceptance, which is why this
-- is a lookup table and not a distance API -- a routing call gives a number
-- that varies by route and that the customer cannot check.
--
-- fee_incl_vat NULL means "quote individually": do not price automatically,
-- route the request to a human. Same for a postnummer that matches no row.
--
-- The ranges below are a FIRST DRAFT from Stockholms lan postcode blocks and
-- the published zone models of Stockholm cleaning firms. The zone 1 figure of
-- 150 kr matches the customer's own mockup. Zone 2 and zone 3 figures are not
-- taken from any published tariff -- they are anchored estimates and need
-- verifying against two or three real competitor quotes before launch.

create table if not exists public.travel_zones (
  id                bigserial primary key,
  postnummer_from   integer not null,
  postnummer_to     integer not null,
  zone              integer not null,
  fee_incl_vat      numeric,
  label             text not null,
  valid_from        date not null default current_date,
  valid_to          date,
  note              text,

  constraint travel_zones_range_ordered check (postnummer_to >= postnummer_from),
  constraint travel_zones_zone_positive check (zone >= 1)
);

create index if not exists travel_zones_lookup_idx
  on public.travel_zones (postnummer_from, postnummer_to)
  where valid_to is null;

insert into public.travel_zones
  (postnummer_from, postnummer_to, zone, fee_incl_vat, label, note)
select * from (values
  -- Zone 1: Stockholm city and the near suburbs.
  (10000, 19299, 1, 150, 'Stockholm och narforort',
   'Mockup figure. Covers Stockholm, Solna, Sundbyberg, Lidingo, Danderyd, Sollentuna, Huddinge, Nacka inner.'),
  -- Zone 2: outer suburbs.
  (19300, 19999, 2, 250, 'Ytterforort nord',
   'Estimate, not a published tariff. Verify before launch.'),
  (13000, 13999, 2, 250, 'Ytterforort ost/sydost',
   'Estimate, not a published tariff. Verify before launch.'),
  (14000, 14899, 2, 250, 'Ytterforort syd',
   'Estimate, not a published tariff. Verify before launch.'),
  -- Zone 3: outer kommuner. No published market figure exists for these.
  (15000, 15299, 3, null, 'Sodertalje med omnejd',
   'Quote individually. No Stockholm firm publishes a travel fee here.'),
  (76000, 76299, 3, null, 'Norrtalje med omnejd',
   'Quote individually. No Stockholm firm publishes a travel fee here.'),
  (14900, 14999, 3, null, 'Nynashamn med omnejd',
   'Quote individually. No Stockholm firm publishes a travel fee here.')
) as seed(postnummer_from, postnummer_to, zone, fee_incl_vat, label, note)
where not exists (select 1 from public.travel_zones);


-- ---------------------------------------------------------------------------
-- 6. updated_at, kept honest by a trigger rather than by every caller.
-- ---------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists quote_requests_touch_updated_at on public.quote_requests;
create trigger quote_requests_touch_updated_at
  before update on public.quote_requests
  for each row execute function public.touch_updated_at();


-- ---------------------------------------------------------------------------
-- 7. Row level security. See note 6 in the header.
-- ---------------------------------------------------------------------------

alter table public.quote_requests    enable row level security;
alter table public.offers            enable row level security;
alter table public.offer_acceptances enable row level security;
alter table public.withdrawals       enable row level security;
alter table public.travel_zones      enable row level security;


-- ---------------------------------------------------------------------------
-- 8. Verify. Read these three results before closing the editor.
-- ---------------------------------------------------------------------------

-- Expected: five rows, rls_enabled = true on every one.
select relname as table_name, relrowsecurity as rls_enabled
from pg_class
where oid in (
  'public.quote_requests'::regclass,
  'public.offers'::regclass,
  'public.offer_acceptances'::regclass,
  'public.withdrawals'::regclass,
  'public.travel_zones'::regclass
)
order by relname;

-- Expected: offers_token_selector_key and offer_acceptances_offer_id_key both
-- present and unique. Without the second one, acceptance is not idempotent.
select conname as constraint_name, contype as kind
from pg_constraint
where conname in ('offers_token_selector_key', 'offer_acceptances_offer_id_key')
order by conname;

-- Expected: 7 zone rows, zone 3 rows with fee_incl_vat null.
select zone, count(*) as rows, min(fee_incl_vat) as fee
from public.travel_zones
where valid_to is null
group by zone
order by zone;
