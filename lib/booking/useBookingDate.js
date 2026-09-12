import { useEffect, useState } from "react";
import { checkDateTime, earliestBookable } from "./rules";

// Requested start time of a booking plus its validation result.
export default function useBookingDate() {
  const [dateTime, setDateTime] = useState("");
  const [minDateTime, setMinDateTime] = useState("");

  // Set after mount so the server render and hydration agree.
  useEffect(() => {
    setMinDateTime(earliestBookable());
  }, []);

  // Checked against the clock on every render, so a page left open overnight
  // does not accept a slot that has become too close.
  const check = checkDateTime(dateTime);

  return {
    dateTime,
    setDateTime,
    minDateTime,
    check,
    isValid: check.status === "ok",
  };
}
