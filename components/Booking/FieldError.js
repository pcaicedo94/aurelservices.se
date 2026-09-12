import React from "react";
import styles from "./Booking.module.css";

// Inline validation message under a calculator field.
const FieldError = ({ id, children }) => {
  if (!children) return null;
  return (
    <p id={id} className={styles.fieldError} role="alert">
      {children}
    </p>
  );
};

export const invalidClass = styles.invalid;

export default FieldError;
