import { useCallback, useEffect, useRef, useState } from "react";

export const BOOKING_ENDPOINT = "/api/booking";

// Used only when the response carries no message of its own. The API's
// Swedish messages (rule violations on 400, rate limit on 429) are shown as is.
const FALLBACK_MESSAGES = {
  invalid: "Kontrollera uppgifterna och försök igen.",
  rateLimited: "Du har skickat flera förfrågningar på kort tid. Vänta en stund och försök igen.",
  server: "Något gick fel hos oss. Försök igen om en stund eller ring oss på 076-045 02 28.",
  network: "Vi kunde inte nå servern. Kontrollera din internetanslutning och försök igen.",
};

const errorKind = (status) => {
  if (status === 409) return "conflict";
  if (status === 429) return "rateLimited";
  if (status >= 500) return "server";
  return "invalid";
};

// Posts a booking once and reports the outcome without leaving the page.
// status: idle | sending | success | error
// error:  { kind: "conflict" | "invalid" | "rateLimited" | "server" | "network", status, message }
export default function useBookingSubmit({ endpoint = BOOKING_ENDPOINT } = {}) {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);
  // A ref rather than state: clicks that land before React has re-rendered the
  // disabled button must not start a second request.
  const inFlight = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const submit = useCallback(
    async (payload) => {
      if (inFlight.current) return { ok: false, skipped: true };
      inFlight.current = true;
      setStatus("sending");
      setError(null);

      let result;
      try {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        // A proxy or crash page may answer with HTML; that is still an error
        // with a readable message, not an exception.
        const data = await response.json().catch(() => ({}));

        if (response.ok) {
          result = { ok: true, data };
        } else {
          const kind = errorKind(response.status);
          const serverMessage =
            data && typeof data.message === "string" ? data.message.trim() : "";
          result = {
            ok: false,
            error: {
              kind,
              status: response.status,
              message: kind === "conflict" ? "" : serverMessage || FALLBACK_MESSAGES[kind],
            },
          };
        }
      } catch (err) {
        result = {
          ok: false,
          error: { kind: "network", status: 0, message: FALLBACK_MESSAGES.network },
        };
      } finally {
        inFlight.current = false;
      }

      if (mounted.current) {
        setStatus(result.ok ? "success" : "error");
        setError(result.ok ? null : result.error);
      }
      return result;
    },
    [endpoint]
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
  }, []);

  return { status, error, sending: status === "sending", submit, reset };
}
