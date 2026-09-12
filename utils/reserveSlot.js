// Reserving a calendar slot without double bookings (QA-01).
//
// Checking availability and then inserting leaves a window in which two
// requests for the same slot both see it free and both insert. Google Calendar
// has no conditional insert, so the booking is compensated instead: after the
// insert the slot is listed again, and if an overlapping blocking event was
// created before ours, ours is deleted and the request gets a 409. Both racing
// requests order events the same way (creation time, then id), so exactly one
// of them keeps its event.
//
// `calendar` is anything with listEvents({ timeMin, timeMax }),
// insertEvent(requestBody) and deleteEvent(id); see utils/bookingServices.js.

export function isBlocking(event) {
  return Boolean(event) && event.status !== "cancelled" && event.transparency !== "transparent";
}

// Events without a readable creation time sort last.
function createdMs(event) {
  const ms = Date.parse(event?.created || "");
  return Number.isFinite(ms) ? ms : Number.POSITIVE_INFINITY;
}

// Negative when `a` was created before `b`. Equal creation times fall back to
// the id, so both sides of a race reach the same verdict.
export function compareCreation(a, b) {
  const diff = createdMs(a) - createdMs(b);
  if (diff !== 0 && !Number.isNaN(diff)) return diff;
  const idA = String(a?.id || "");
  const idB = String(b?.id || "");
  if (idA === idB) return 0;
  return idA < idB ? -1 : 1;
}

// The oldest blocking event, other than `own`, created before `own`; or null.
export function findEarlierConflict(own, events) {
  const earlier = (events || []).filter(
    (event) => event && event.id !== own.id && isBlocking(event) && compareCreation(event, own) < 0
  );
  if (earlier.length === 0) return null;
  return earlier.sort(compareCreation)[0];
}

async function deleteQuietly(calendar, eventId) {
  try {
    await calendar.deleteEvent(eventId);
    return true;
  } catch (error) {
    console.error(
      "Could not delete a booking event that must not be kept, remove it by hand:",
      eventId,
      error?.message
    );
    return false;
  }
}

// Resolves to { reserved: true, event } or { reserved: false, reason }, where
// reason is "taken" (already busy) or "race" (lost to an older booking).
export async function reserveSlot(calendar, { window, event }) {
  const existing = (await calendar.listEvents(window)).filter(isBlocking);
  if (existing.length > 0) return { reserved: false, reason: "taken" };

  const created = await calendar.insertEvent(event);

  let overlapping;
  try {
    overlapping = await calendar.listEvents(window);
  } catch (error) {
    // An unverified booking is not kept: asking the customer to retry is
    // better than a silent double booking.
    await deleteQuietly(calendar, created.id);
    throw error;
  }

  const earlier = findEarlierConflict(created, overlapping);
  if (earlier) {
    await deleteQuietly(calendar, created.id);
    return { reserved: false, reason: "race", eventId: created.id, conflictId: earlier.id };
  }

  return { reserved: true, event: created };
}
