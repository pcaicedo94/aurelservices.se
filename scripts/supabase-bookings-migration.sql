-- Fixes the `bookings` table so /api/booking can actually persist a row.
--
-- Background: the API writes `event_id` (the Google Calendar event) but the
-- column never existed, so every insert since March 2026 failed. The handler
-- only logs that error, so bookings kept succeeding while silently losing
-- their database record.
--
-- Run in Supabase → SQL Editor → New query → Run.
-- Safe to run more than once.
--
-- Interim: the free tier pauses the project on inactivity, which takes the
-- database offline while bookings keep succeeding. The plan is to move this
-- table to the MySQL database included in the paid Simply hosting. Until then,
-- a failed write is at least visible — the admin mail carries a warning banner.

-- 1. The missing column, plus the type fixes: date_time and total_price were
--    both created as text.
alter table public.bookings
  add column if not exists event_id text;

alter table public.bookings
  alter column date_time type timestamptz
  using (nullif(date_time, '')::timestamp at time zone 'Europe/Stockholm');

alter table public.bookings
  alter column total_price type numeric
  using nullif(total_price, '')::numeric;

-- 2. Indexes: date_time is what any calendar/report view filters on, and
--    event_id must stay unique so a retried request cannot duplicate a row.
create index if not exists bookings_date_time_idx
  on public.bookings (date_time desc);

create unique index if not exists bookings_event_id_key
  on public.bookings (event_id)
  where event_id is not null;

-- 3. The table holds customer names, addresses, phones and emails. Nothing in
--    the site reads it from the browser — only the server, with the service
--    role key, which bypasses RLS. Turning RLS on therefore changes nothing
--    for the app but stops the public anon key from ever reading the data.
alter table public.bookings enable row level security;

-- 4. Verify. Expected: date_time = timestamp with time zone,
--    total_price = numeric, event_id = text, and rls_enabled = true.
select c.column_name, c.data_type
from information_schema.columns c
where c.table_schema = 'public' and c.table_name = 'bookings'
order by c.ordinal_position;

select relname as table_name, relrowsecurity as rls_enabled
from pg_class
where oid = 'public.bookings'::regclass;
