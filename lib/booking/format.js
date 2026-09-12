// Swedish display formatting for the booking pages.

// ["storlek", "frekvens", "datum"] -> "storlek, frekvens och datum"
export function joinSwedish(items) {
  const list = items.filter(Boolean);
  if (list.length <= 1) return list.join("");
  return `${list.slice(0, -1).join(", ")} och ${list[list.length - 1]}`;
}
