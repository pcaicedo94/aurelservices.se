import React from "react";
import Link from "next/link";
import FieldError, { invalidClass } from "./FieldError";
import styles from "./Booking.module.css";

// Date and time picker of the booking calculators. The form only offers what
// can actually be booked: the date cannot start before the lead time and the
// hours are the ones the client accepts online, so nothing has to be typed and
// then refused. Weekends cannot be switched off in a native date input, so a
// weekend day is explained inline and the hour is locked instead.
const DateTimeField = ({
  id = "dateTime",
  label = "Önskat datum och tid",
  dayLabel = "Datum",
  timeLabel = "Starttid",
  date,
  conflict = false,
  inputRef,
  children,
}) => {
  const dayId = `${id}-day`;
  const timeId = `${id}-time`;
  const errorId = `${id}-error`;
  const { check, dayCheck } = date;
  const isWeekend = dayCheck.status === "weekend";

  let message = null;
  if (conflict) {
    message = "Tiden är tyvärr redan bokad. Välj en annan dag eller tid.";
  } else if (isWeekend) {
    message = (
      <>
        <strong>Helgbokning?</strong> <Link href="/kontakt">Kontakta oss</Link> – online kan du
        boka måndag till fredag.
      </>
    );
  } else if (dayCheck.message) {
    message = dayCheck.message;
  } else if (check.message) {
    message = check.message;
  }

  const invalid = message ? ` ${invalidClass}` : "";
  const describedBy = message ? errorId : undefined;

  return (
    <fieldset className="form-group">
      <legend className={styles.groupLabel}>{label}</legend>
      <div className={styles.dateTimeRow}>
        <div>
          <label className={styles.partLabel} htmlFor={dayId}>
            {dayLabel}
          </label>
          <input
            ref={inputRef}
            type="date"
            id={dayId}
            className={`form-control${invalid}`}
            value={date.day}
            onChange={(e) => date.setDay(e.target.value)}
            min={date.minDay || undefined}
            required
            aria-invalid={message ? true : undefined}
            aria-describedby={describedBy}
          />
        </div>
        <div>
          <label className={styles.partLabel} htmlFor={timeId}>
            {timeLabel}
          </label>
          <select
            id={timeId}
            className={`form-control${invalid}`}
            value={date.time}
            onChange={(e) => date.setTime(e.target.value)}
            disabled={isWeekend}
            required
            aria-invalid={message ? true : undefined}
            aria-describedby={describedBy}
          >
            <option value="">Välj tid</option>
            {date.times.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>
      </div>
      <FieldError id={errorId}>{message}</FieldError>
      {children}
    </fieldset>
  );
};

export default DateTimeField;
