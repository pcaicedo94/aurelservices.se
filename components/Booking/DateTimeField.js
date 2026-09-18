import React from "react";
import Link from "next/link";
import FieldError, { invalidClass } from "./FieldError";

// Date and time picker of the booking calculators, with the booking rules
// (lead time, weekdays, opening hours) explained inline instead of alert().
const DateTimeField = ({
  id = "dateTime",
  label = "Önskat datum och tid (Mellan 07:00-15:00)",
  date,
  conflict = false,
  inputRef,
  children,
}) => {
  const errorId = `${id}-error`;
  const { check } = date;

  let message = null;
  if (conflict) {
    message = "Tiden är tyvärr redan bokad. Välj en annan dag eller tid.";
  } else if (check.status === "weekend") {
    message = (
      <>
        <strong>Helgbokning?</strong> <Link href="/contact">Kontakta oss</Link> – online kan du
        boka måndag till fredag.
      </>
    );
  } else if (check.message) {
    message = check.message;
  }

  return (
    <div className="form-group">
      <label htmlFor={id}>{label}</label>
      <input
        ref={inputRef}
        type="datetime-local"
        id={id}
        className={`form-control${message ? ` ${invalidClass}` : ""}`}
        value={date.dateTime}
        onChange={(e) => date.setDateTime(e.target.value)}
        min={date.minDateTime || undefined}
        step="1800"
        required
        aria-invalid={message ? true : undefined}
        aria-describedby={message ? errorId : undefined}
      />
      <FieldError id={errorId}>{message}</FieldError>
      {children}
    </div>
  );
};

export default DateTimeField;
