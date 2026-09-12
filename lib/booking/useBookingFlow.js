import { useCallback, useState } from "react";

// Page level state of the booking steps: contact form open or not, the
// confirmation shown after a successful booking, and the slot the server
// reported as already taken.
export default function useBookingFlow() {
  const [contactOpen, setContactOpen] = useState(false);
  const [focusSignal, setFocusSignal] = useState(0);
  const [confirmation, setConfirmation] = useState(null);
  const [conflictDateTime, setConflictDateTime] = useState("");

  const openContact = useCallback(() => {
    setConfirmation(null);
    setContactOpen(true);
    // Bumped on every click so an already open form scrolls into view again.
    setFocusSignal((n) => n + 1);
  }, []);

  const complete = useCallback((details) => {
    setContactOpen(false);
    setConflictDateTime("");
    setConfirmation(details);
  }, []);

  const dismissConfirmation = useCallback(() => setConfirmation(null), []);

  // True while the given slot is the one the server rejected as taken.
  const isConflict = (dateTime) => conflictDateTime !== "" && conflictDateTime === dateTime;

  return {
    contactOpen,
    focusSignal,
    openContact,
    confirmation,
    complete,
    dismissConfirmation,
    isConflict,
    markConflict: setConflictDateTime,
  };
}
