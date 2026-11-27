import React from "react";
import { formatPrice } from "../../lib/booking/format";

// The label every private price carries on the page. Private prices include
// VAT and are after the RUT deduction (client answer Q23), and the client wants
// that said next to each figure, not only once in a side note. Business prices
// never carry it: RUT does not apply to companies.
export const RUT_LABEL = "efter RUT-avdrag";

export const RutTag = () => <span className="rut-tag">{RUT_LABEL}</span>;

// A price followed by the tag, kept in one span so the summary row's flex
// layout treats them as one value on the right. With no figure yet it shows
// the same dash as formatPrice and no tag: there is nothing to qualify.
export const RutPrice = ({ amount, suffix = "" }) => {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return formatPrice(amount);
  return (
    <span className="rut-price">
      {formatPrice(amount)}
      {suffix}
      <RutTag />
    </span>
  );
};

export default RutTag;
