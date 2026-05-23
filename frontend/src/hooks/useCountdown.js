import { useEffect, useRef, useState } from "react";

const pad = (n) => String(n).padStart(2, "0");

export function useCountdown(date, time) {
  const [label, setLabel] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    if (!date) return;
    const target = new Date(date.includes("T") ? date : `${date}T${time || "20:00:00"}`);
    if (isNaN(target)) return;

    function tick() {
      const diff = target - Date.now();
      if (diff <= 0) { setLabel(null); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setLabel(d > 0 ? `${d}g ${pad(h)}h ${pad(m)}m` : `${pad(h)}h ${pad(m)}m ${pad(s)}s`);
    }
    tick();
    ref.current = setInterval(tick, 1000);
    return () => clearInterval(ref.current);
  }, [date, time]);

  return label;
}
