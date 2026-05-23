const pad = (n) => String(n).padStart(2, "0");

function buildDateStr(ev) {
  const dt = ev.date ? ev.date.replace(/[-:]/g, "").replace("T", "") : "";
  return dt ? dt.slice(0, 8) + "T" + (ev.time ? ev.time.replace(":", "") + "00" : "200000") : "";
}

function buildEndStr(dtStr) {
  if (!dtStr) return "";
  const y = +dtStr.slice(0, 4), mo = +dtStr.slice(4, 6) - 1, d = +dtStr.slice(6, 8);
  const h = +dtStr.slice(9, 11), mi = +dtStr.slice(11, 13);
  const end = new Date(y, mo, d, h + 3, mi);
  return `${end.getFullYear()}${pad(end.getMonth() + 1)}${pad(end.getDate())}T${pad(end.getHours())}${pad(end.getMinutes())}00`;
}

export function openGoogleCalendar(ev) {
  const v = ev.venue || {};
  const start = buildDateStr(ev);
  const end   = buildEndStr(start);
  const loc   = [v.name, v.address, v.city].filter(Boolean).join(", ");
  window.open(
    `https://www.google.com/calendar/render?action=TEMPLATE` +
    `&text=${encodeURIComponent(ev.name || "")}` +
    `&dates=${start}/${end}` +
    `&location=${encodeURIComponent(loc)}` +
    `&details=${encodeURIComponent(ev.url || "")}`,
    "_blank"
  );
}

export function downloadICS(ev) {
  const v     = ev.venue || {};
  const start = buildDateStr(ev);
  const end   = buildEndStr(start);
  const loc   = [v.name, v.address, v.city].filter(Boolean).join(", ");
  const lines = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//ConcertHub//IT",
    "BEGIN:VEVENT",
    start  ? `DTSTART:${start}` : "",
    end    ? `DTEND:${end}`     : "",
    `SUMMARY:${(ev.name || "").replace(/[,;\\]/g, " ")}`,
    `LOCATION:${loc.replace(/[,;\\]/g, " ")}`,
    `URL:${ev.url || ""}`,
    "END:VEVENT", "END:VCALENDAR",
  ].filter(Boolean).join("\r\n");

  const url = URL.createObjectURL(new Blob([lines], { type: "text/calendar" }));
  Object.assign(document.createElement("a"), {
    href: url,
    download: `${(ev.name || "evento").replace(/[^a-z0-9]/gi, "_")}.ics`,
  }).click();
  URL.revokeObjectURL(url);
}
