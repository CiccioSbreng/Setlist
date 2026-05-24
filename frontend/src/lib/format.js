export function formatWhen(date, time) {
  if (!date) return { dateLabel: "Data da definire", timeLabel: null };
  const hasTime = typeof date === "string" && date.includes("T");
  const d = new Date(hasTime ? date : `${date}T${time || "00:00:00"}`);
  if (Number.isNaN(d.getTime())) return { dateLabel: "Data da definire", timeLabel: null };
  return {
    dateLabel: d.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
    timeLabel: hasTime || time ? d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }) : null,
  };
}

export function formatPrice(min, max, currency) {
  if (min == null && max == null) return null;
  const cur = currency === "EUR" ? "€" : currency ? `${currency} ` : "€";
  const fmt = (n) => `${cur}${Math.round(n)}`;
  if (min != null && max != null && Math.round(min) !== Math.round(max)) return `${fmt(min)} – ${fmt(max)}`;
  return `da ${fmt(min ?? max)}`;
}

