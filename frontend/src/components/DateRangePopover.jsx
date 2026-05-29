// frontend/src/components/DateRangePopover.jsx
// Date-range picker custom, senza dipendenze. Produce stringhe "YYYY-MM-DD".

import { useEffect, useRef, useState } from "react";
import { CalendarIcon } from "./Icons";

const WD = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
const MO = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];

function parse(s) {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function fmt(dt) {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function ddmm(s) {
  return s ? `${s.slice(8, 10)}/${s.slice(5, 7)}` : "";
}

function sameDay(a, b) {
  return (
    a &&
    b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfMonth(dt) {
  return new Date(dt.getFullYear(), dt.getMonth(), 1);
}

function buildGrid(view) {
  const first = startOfMonth(view);
  const offset = (first.getDay() + 6) % 7; // lunedì = 0
  const start = new Date(first);
  start.setDate(1 - offset);
  const days = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(d);
  }
  return days;
}

const QUICK = [
  { id: "today", label: "Oggi" },
  { id: "week",  label: "Questa settimana" },
  { id: "month", label: "Questo mese" },
];

export default function DateRangePopover({ start, end, onChange, onClear, quickRange, applyQuickRange }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const startD = parse(start);
  const endD = parse(end);

  const [view, setView] = useState(() => startOfMonth(startD || new Date()));

  useEffect(() => {
    if (open) setView(startOfMonth(parse(start) || new Date()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onDoc(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function pick(d) {
    const iso = fmt(d);
    if (!start || (start && end) || (startD && d < startD)) {
      onChange({ start: iso, end: "" });
      return;
    }
    onChange({ start, end: iso });
    setOpen(false);
  }

  const label =
    start || end
      ? `${ddmm(start) || "…"} – ${ddmm(end) || "…"}`
      : "Aggiungi date";

  const grid = buildGrid(view);
  const today = new Date();

  return (
    <div className="drp" ref={wrapRef}>
      <button
        type="button"
        className={"chip chip--cal" + (start || end ? " is-active" : "")}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <CalendarIcon size={15} />
        {label}
      </button>

      {open && (
        <div className="drp__pop" role="dialog" aria-label="Seleziona le date">
          {applyQuickRange && (
            <div className="drp__quick">
              {QUICK.map((q) => (
                <button
                  key={q.id}
                  type="button"
                  className={"drp__qchip" + (quickRange === q.id ? " is-active" : "")}
                  onClick={() => { applyQuickRange(q.id); setOpen(false); }}
                >
                  {q.label}
                </button>
              ))}
            </div>
          )}
          <div className="drp__head">
            <button
              type="button"
              className="drp__nav"
              aria-label="Mese precedente"
              onClick={() =>
                setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))
              }
            >
              ‹
            </button>
            <span className="drp__title">
              {MO[view.getMonth()]} {view.getFullYear()}
            </span>
            <button
              type="button"
              className="drp__nav"
              aria-label="Mese successivo"
              onClick={() =>
                setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))
              }
            >
              ›
            </button>
          </div>

          <div className="drp__wd">
            {WD.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>

          <div className="drp__grid">
            {grid.map((d, i) => {
              const inMonth = d.getMonth() === view.getMonth();
              const isStart = sameDay(d, startD);
              const isEnd = sameDay(d, endD);
              const inRange = startD && endD && d > startD && d < endD;
              const isToday = sameDay(d, today);
              const cls =
                "drp__day" +
                (inMonth ? "" : " is-out") +
                (isStart || isEnd ? " is-edge" : "") +
                (inRange ? " is-range" : "") +
                (isToday ? " is-today" : "");
              return (
                <button
                  type="button"
                  key={i}
                  className={cls}
                  onClick={() => pick(d)}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>

          <div className="drp__foot">
            <button
              type="button"
              className="drp__clear"
              onClick={() => {
                onClear();
                setOpen(false);
              }}
            >
              Cancella
            </button>
            <button
              type="button"
              className="drp__done"
              onClick={() => setOpen(false)}
            >
              Fatto
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
