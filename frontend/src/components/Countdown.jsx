// frontend/src/components/Countdown.jsx
// Conto alla rovescia live verso la data del concerto.

import { useEffect, useState } from "react";

const UNITS = [
  { key: "days", label: "Giorni" },
  { key: "hours", label: "Ore" },
  { key: "minutes", label: "Minuti" },
  { key: "seconds", label: "Secondi" },
];

function diffParts(target) {
  const diff = target - Date.now();
  if (diff <= 0) return null;
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

export default function Countdown({ date, time }) {
  const [parts, setParts] = useState(null);

  useEffect(() => {
    if (!date) {
      setParts(null);
      return;
    }
    const target = new Date(
      date.includes("T") ? date : `${date}T${time || "20:00:00"}`
    );
    if (Number.isNaN(target.getTime())) {
      setParts(null);
      return;
    }
    const tick = () => setParts(diffParts(target));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [date, time]);

  if (!parts) return null;

  const soon = parts.days === 0;

  return (
    <div className={"countdown" + (soon ? " countdown--soon" : "")}>
      <span className="countdown__eyebrow">
        {soon ? "Ci siamo quasi" : "Conto alla rovescia"}
      </span>
      <div className="countdown__grid">
        {UNITS.map((u) => (
          <div className="countdown__cell" key={u.key}>
            <span className="countdown__num" key={parts[u.key]}>
              {String(parts[u.key]).padStart(2, "0")}
            </span>
            <span className="countdown__lbl">{u.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
