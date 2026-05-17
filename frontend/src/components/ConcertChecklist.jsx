// frontend/src/components/ConcertChecklist.jsx
// Checklist pre-concerto, stato persistito in localStorage per evento.

import { useEffect, useState } from "react";
import { ListMusicIcon } from "./Icons";

const DEFAULT_ITEMS = [
  "Biglietto (digitale o stampato)",
  "Documento d'identità",
  "Telefono carico + powerbank",
  "Contanti / carta",
  "Controlla il meteo e vestiti di conseguenza",
  "Salva indirizzo del venue offline",
  "Organizza viaggio di ritorno",
];

export default function ConcertChecklist({ ev }) {
  const id = ev.id || ev.eventId || "x";
  const storeKey = `ch:checklist:${id}`;

  const [done, setDone] = useState({});

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storeKey) || "null");
      if (saved) setDone(saved);
    } catch {}
  }, [storeKey]);

  function toggle(i) {
    setDone((d) => {
      const next = { ...d, [i]: !d[i] };
      try {
        localStorage.setItem(storeKey, JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  const completed = DEFAULT_ITEMS.filter((_, i) => done[i]).length;

  return (
    <div className="ed-card ch-list">
      <div className="ed-tile__head">
        <ListMusicIcon size={16} />
        <span>Checklist concerto</span>
        <small className="ch-list__count">
          {completed}/{DEFAULT_ITEMS.length}
        </small>
      </div>

      <ul className="ch-list__items">
        {DEFAULT_ITEMS.map((label, i) => (
          <li key={i}>
            <label className={"ch-list__item" + (done[i] ? " is-done" : "")}>
              <input
                type="checkbox"
                checked={Boolean(done[i])}
                onChange={() => toggle(i)}
              />
              <span className="ch-list__box" aria-hidden="true" />
              <span className="ch-list__label">{label}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
