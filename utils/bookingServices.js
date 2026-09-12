import { randomUUID } from "crypto";
import { google } from "googleapis";
import { createClient } from "@supabase/supabase-js";
import { simulatedError } from "./testMode.js";

// Thin wrappers around the external services the booking flow writes to. Each
// takes the request's test trace: null means the real service, a trace means
// test mode (see utils/testMode.js).

function calendarApi() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN });
  return google.calendar({ version: "v3", auth });
}

// Google returns every event whose end is after timeMin and whose start is
// before timeMax, so partial overlaps are included.
async function listRealEvents(api, { timeMin, timeMax }) {
  const { data } = await api.events.list({
    calendarId: process.env.GOOGLE_CALENDAR_ID,
    timeMin,
    timeMax,
    singleEvents: true,
    showDeleted: false,
  });
  return data.items || [];
}

function fakeId(prefix) {
  return `${prefix}${randomUUID().replace(/-/g, "")}`;
}

// A booking that covers the whole window and was created an hour ago, so it
// is older than anything the current request inserts.
function simulatedExistingEvent({ timeMin, timeMax }) {
  return {
    id: fakeId("testexisting"),
    status: "confirmed",
    summary: "Simulated existing booking",
    created: new Date(Date.now() - 3600000).toISOString(),
    start: { dateTime: timeMin },
    end: { dateTime: timeMax },
  };
}

export function createCalendarGateway({ trace = null } = {}) {
  const api = calendarApi();
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  if (!trace) {
    return {
      listEvents: (window) => listRealEvents(api, window),
      async insertEvent(requestBody) {
        const { data } = await api.events.insert({ calendarId, requestBody });
        return data;
      },
      async deleteEvent(eventId) {
        await api.events.delete({ calendarId, eventId });
      },
    };
  }

  const inserted = [];
  return {
    async listEvents(window) {
      trace.calendar.reads += 1;
      switch (trace.scenario) {
        case null:
          return listRealEvents(api, window);
        case "calendar-error":
          throw simulatedError("calendar");
        case "conflict":
          return [simulatedExistingEvent(window)];
        case "race":
          // Clear when availability is checked; by the time the new booking is
          // verified an older one holds the same slot.
          return trace.calendar.reads === 1
            ? []
            : [simulatedExistingEvent(window), ...inserted];
        default:
          return [...inserted];
      }
    },
    async insertEvent(requestBody) {
      const event = {
        ...requestBody,
        id: fakeId("test"),
        status: "confirmed",
        created: new Date().toISOString(),
      };
      inserted.push(event);
      trace.calendar.inserted.push(event);
      return event;
    },
    async deleteEvent(eventId) {
      // Recorded only: test mode never deletes anything from the real calendar.
      trace.calendar.deleted.push(eventId);
    },
  };
}

let supabaseClient = null;

function supabase() {
  supabaseClient ||= createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  return supabaseClient;
}

export function createBookingStore({ trace = null } = {}) {
  return {
    // Resolves to { error } like supabase-js, so a failed write can be
    // reported by the caller instead of aborting the booking.
    async insert(row) {
      if (trace) {
        trace.db.push({ table: "bookings", row });
        return { error: null };
      }
      const { error } = await supabase().from("bookings").insert(row);
      return { error };
    },
  };
}
