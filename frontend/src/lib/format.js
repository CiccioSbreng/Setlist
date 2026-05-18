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

export function getDaysLeft(date, time) {
  if (!date) return null;
  const d = new Date(date.includes("T") ? date : `${date}T${time || "20:00:00"}`);
  if (Number.isNaN(d.getTime())) return null;
  const diff = d - new Date();
  if (diff < 0) return null;
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Oggi!";
  if (days === 1) return "Domani!";
  if (days < 30) return `Tra ${days} giorni`;
  const months = Math.floor(days / 30);
  return `Tra ${months} ${months === 1 ? "mese" : "mesi"}`;
}
