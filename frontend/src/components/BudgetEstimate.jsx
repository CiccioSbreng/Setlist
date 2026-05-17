// frontend/src/components/BudgetEstimate.jsx
// Stima del budget per il concerto: biglietto (dai dati evento) + voci
// modificabili dall'utente. Persistito in localStorage per evento.

import { useEffect, useState } from "react";
import { TicketIcon } from "./Icons";

const FIELDS = [
  { key: "travel", label: "Viaggio (a/r)" },
  { key: "hotel", label: "Hotel / alloggio" },
  { key: "food", label: "Cibo e bevande" },
  { key: "extra", label: "Extra (merch, parcheggio…)" },
];

export default function BudgetEstimate({ ev }) {
  const id = ev.id || ev.eventId || "x";
  const storeKey = `ch:budget:${id}`;

  const ticket =
    ev.priceMin != null
      ? Math.round(ev.priceMin)
      : ev.priceMax != null
      ? Math.round(ev.priceMax)
      : 0;

  const [vals, setVals] = useState({ travel: 0, hotel: 0, food: 0, extra: 0 });

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storeKey) || "null");
      if (saved) setVals((v) => ({ ...v, ...saved }));
    } catch {}
  }, [storeKey]);

  function set(key, raw) {
    const n = Math.max(0, Math.round(Number(raw) || 0));
    setVals((v) => {
      const next = { ...v, [key]: n };
      try {
        localStorage.setItem(storeKey, JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  const total =
    ticket + FIELDS.reduce((s, f) => s + (Number(vals[f.key]) || 0), 0);

  return (
    <div className="ed-card ch-budget">
      <div className="ed-tile__head">
        <TicketIcon size={16} />
        <span>Budget stimato</span>
      </div>

      <div className="ch-budget__rows">
        <div className="ch-budget__row ch-budget__row--fixed">
          <span>Biglietto</span>
          <span>{ticket > 0 ? `€${ticket}` : "—"}</span>
        </div>
        {FIELDS.map((f) => (
          <label key={f.key} className="ch-budget__row">
            <span>{f.label}</span>
            <span className="ch-budget__input">
              €
              <input
                type="number"
                min="0"
                inputMode="numeric"
                value={vals[f.key] || ""}
                placeholder="0"
                onChange={(e) => set(f.key, e.target.value)}
              />
            </span>
          </label>
        ))}
      </div>

      <div className="ch-budget__total">
        <span>Totale stimato</span>
        <strong>€{total}</strong>
      </div>
      <p className="ch-budget__hint">
        Stima indicativa, salvata solo su questo dispositivo.
      </p>
    </div>
  );
}
