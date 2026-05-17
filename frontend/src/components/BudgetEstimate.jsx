// frontend/src/components/BudgetEstimate.jsx
// Stima del budget per il concerto: biglietto (dai dati evento) + voci
// modificabili dall'utente. Persistito in localStorage per evento.
// Il viaggio può essere calcolato con distanze reali (Google Distance Matrix).

import { useEffect, useState } from "react";
import { TicketIcon } from "./Icons";
import { getDistance } from "../lib/api";

const FIELDS = [
  { key: "travel", label: "Viaggio (a/r)" },
  { key: "hotel", label: "Hotel / alloggio" },
  { key: "food", label: "Cibo e bevande" },
  { key: "extra", label: "Extra (merch, parcheggio…)" },
];

export default function BudgetEstimate({ ev }) {
  const id = ev.id || ev.eventId || "x";
  const storeKey = `ch:budget:${id}`;

  const venue = ev.venue || {};
  const hasGeo = venue.lat != null && venue.lon != null;

  const ticket =
    ev.priceMin != null
      ? Math.round(ev.priceMin)
      : ev.priceMax != null
      ? Math.round(ev.priceMax)
      : 0;

  const [vals, setVals] = useState({ travel: 0, hotel: 0, food: 0, extra: 0 });

  // Città di partenza: globale (la stessa per tutti gli eventi).
  const [origin, setOrigin] = useState(
    () => localStorage.getItem("ch:origin") || ""
  );
  const [trip, setTrip] = useState(null); // { km, durationText, cost }
  const [tripState, setTripState] = useState("idle"); // idle|loading|error|nokey|notfound

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(storeKey) || "null");
      if (saved) setVals((v) => ({ ...v, ...saved }));
    } catch {}
  }, [storeKey]);

  function persist(next) {
    try {
      localStorage.setItem(storeKey, JSON.stringify(next));
    } catch {}
  }

  function set(key, raw) {
    const n = Math.max(0, Math.round(Number(raw) || 0));
    setVals((v) => {
      const next = { ...v, [key]: n };
      persist(next);
      return next;
    });
  }

  async function calcTrip() {
    const city = origin.trim();
    if (!city || !hasGeo) return;
    localStorage.setItem("ch:origin", city);
    setTripState("loading");
    setTrip(null);
    try {
      const r = await getDistance({
        origin: city,
        lat: venue.lat,
        lon: venue.lon,
      });
      if (r.status === "ok") {
        setTrip(r);
        setTripState("idle");
        // Precompila la voce "Viaggio" col costo stimato a/r.
        setVals((v) => {
          const next = { ...v, travel: r.cost };
          persist(next);
          return next;
        });
      } else if (r.status === "not_found") {
        setTripState("notfound");
      } else {
        setTripState("error");
      }
    } catch (e) {
      setTripState(/Distance 503/.test(e.message) ? "nokey" : "error");
    }
  }

  const total =
    ticket + FIELDS.reduce((s, f) => s + (Number(vals[f.key]) || 0), 0);

  return (
    <div className="ed-card ch-budget">
      <div className="ed-tile__head">
        <TicketIcon size={16} />
        <span>Budget stimato</span>
      </div>

      {hasGeo && (
        <div className="ch-budget__trip">
          <label className="ch-budget__trip-field">
            <span>Parti da</span>
            <input
              type="text"
              placeholder="La tua città (es. Bologna)"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && calcTrip()}
            />
          </label>
          <button
            type="button"
            className="btn btn--sm btn--ghost"
            onClick={calcTrip}
            disabled={!origin.trim() || tripState === "loading"}
          >
            {tripState === "loading" ? "Calcolo…" : "Calcola viaggio"}
          </button>

          {trip && (
            <p className="ch-budget__trip-res">
              ≈ <strong>{trip.km} km</strong> · {trip.durationText} ·
              costo stimato a/r <strong>€{trip.cost}</strong>
            </p>
          )}
          {tripState === "notfound" && (
            <p className="ch-budget__trip-err">
              Percorso non trovato: controlla il nome della città.
            </p>
          )}
          {tripState === "nokey" && (
            <p className="ch-budget__trip-err">
              Calcolo distanze non configurato sul server.
            </p>
          )}
          {tripState === "error" && (
            <p className="ch-budget__trip-err">
              Errore nel calcolo, riprova più tardi.
            </p>
          )}
        </div>
      )}

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
