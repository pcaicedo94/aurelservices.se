import { useEffect, useState } from "react";
import { checkDate, checkDateTime, earliestBookable, startTimeOptions } from "./rules";

// The start times offered online never change while the page is open.
const START_TIMES = startTimeOptions();

// Requested start time of a booking plus its validation result. The visitor
// picks the day and the hour in two separate controls; everything outside this
// hook still sees one wall clock, "YYYY-MM-DDTHH:MM", because that is the
// format the booking API and the booking rules read.
export default function useBookingDate() {
  const [day, setDay] = useState("");
  const [time, setTime] = useState("");
  const [minDateTime, setMinDateTime] = useState("");

  // Set after mount so the server render and hydration agree.
  useEffect(() => {
    setMinDateTime(earliestBookable());
  }, []);

  // Half a choice is no choice: the combined value stays empty until both
  // controls are filled, so an incomplete field still reads as "empty".
  const dateTime = day && time ? `${day}T${time}` : "";

  // Checked against the clock on every render, so a page left open overnight
  // does not accept a slot that has become too close.
  const check = checkDateTime(dateTime);
  // The day on its own, so a weekend or a day inside the lead time can be
  // explained before an hour has been picked.
  const dayCheck = checkDate(day);

  // Kept for callers that hold a whole wall clock (the booking payload, tests).
  const setDateTime = (value) => {
    const [nextDay = "", nextTime = ""] = String(value || "").split("T");
    setDay(nextDay);
    setTime(nextTime.slice(0, 5));
  };

  return {
    dateTime,
    setDateTime,
    minDateTime,
    check,
    isValid: check.status === "ok",
    // Parts of the same value, for the two controls of DateTimeField.
    day,
    setDay,
    time,
    setTime,
    times: START_TIMES,
    dayCheck,
    minDay: minDateTime.slice(0, 10),
  };
}
