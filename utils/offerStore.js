// Supabase access for the offer flow. Same shape as createBookingStore in
// utils/bookingServices.js: a `trace` means test mode and nothing is written.
//
// Everything here runs server side only. The service-role key bypasses RLS,
// and RLS on these tables has no policies at all, so the browser can read
// nothing: an offer reaches the customer only through getServerSideProps and
// the accept endpoint, never through a direct query.
import { createClient } from "@supabase/supabase-js";
import { createHash } from "crypto";
import { verifyOfferToken } from "./offerToken.js";

let client = null;

function supabase() {
  client ||= createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  return client;
}

// Postgres unique_violation. An acceptance that hits this is not an error:
// the offer was already accepted and the second attempt must be a no-op.
const UNIQUE_VIOLATION = "23505";

// The columns the offer page and the accept endpoint need. Listed rather than
// `*` so that adding a column to the table cannot quietly start shipping it
// to the browser.
const OFFER_COLUMNS = [
  "id",
  "token_selector",
  "token_verifier_hash",
  "expires_at",
  "link_valid_until",
  "snapshot",
  "service",
  "arbetskostnad_incl_vat",
  "rut_deduction",
  "resetillagg_incl_vat",
  "total_to_pay",
  "travel_zone",
  "service_at",
  "requires_start_consent",
  "requires_discount_consent",
  "status",
  "sent_at",
].join(", ");

// A stable hash of exactly what the customer was shown. Stored next to the
// acceptance so that a later edit of the snapshot is detectable.
export function screenHash(snapshot) {
  return createHash("sha256").update(JSON.stringify(snapshot)).digest("hex");
}

// The IP is pseudonymised before it is stored: a hash proves "same visitor"
// just as well as the address and is not an identifier we have to justify
// keeping. Without IP_HASH_SALT the hash is unsalted and therefore reversible
// for IPv4 by brute force, so it is dropped instead of stored weakly.
export function hashIp(ip) {
  const salt = process.env.IP_HASH_SALT;
  if (!ip || !salt) return null;
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export function createOfferStore({ trace = null } = {}) {
  return {
    // Looks the offer up by selector, then compares the verifier in constant
    // time. A wrong selector and a wrong verifier give the same answer, so the
    // response cannot be used to confirm that a selector exists.
    async findByToken({ selector, verifier }) {
      if (!selector || !verifier) return null;

      if (trace) {
        const offer = trace.offers?.[selector] || null;
        if (!offer) return null;
        return verifyOfferToken(verifier, offer.token_verifier_hash) ? offer : null;
      }

      const { data, error } = await supabase()
        .from("offers")
        .select(OFFER_COLUMNS)
        .eq("token_selector", selector)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;
      return verifyOfferToken(verifier, data.token_verifier_hash) ? data : null;
    },

    // The acceptance row IS the event. It is written before the offer's status
    // is touched, and a failure here aborts: an acceptance that is not in
    // offer_acceptances did not happen, whatever the offers table says.
    //
    // Resolves to { recorded: true, row } on a fresh acceptance, or
    // { recorded: false, duplicate: true } when this offer was already
    // accepted — the unique constraint on offer_id is what makes a double
    // click, a retry or a link prefetch harmless.
    async recordAcceptance(row) {
      if (trace) {
        const seen = trace.db.some(
          (entry) => entry.table === "offer_acceptances" && entry.row.offer_id === row.offer_id
        );
        if (seen) return { recorded: false, duplicate: true };
        trace.db.push({ table: "offer_acceptances", row });
        return { recorded: true, row };
      }

      const { data, error } = await supabase()
        .from("offer_acceptances")
        .insert(row)
        .select("id, accepted_at, angerfrist_ends_at")
        .single();

      if (error) {
        if (error.code === UNIQUE_VIOLATION) return { recorded: false, duplicate: true };
        throw error;
      }
      return { recorded: true, row: data };
    },

    // Runs after the acceptance is safely stored. A failure here leaves an
    // offer that reads 'sent' but has an acceptance row: the acceptance still
    // counts, so this is logged and swallowed rather than failing the request
    // and inviting the customer to accept twice.
    async markAccepted(offerId) {
      if (trace) {
        trace.db.push({ table: "offers", update: { id: offerId, status: "accepted" } });
        return { error: null };
      }
      const { error } = await supabase()
        .from("offers")
        .update({ status: "accepted" })
        .eq("id", offerId)
        .eq("status", "sent");
      return { error };
    },
  };
}
