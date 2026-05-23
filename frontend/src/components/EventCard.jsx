// frontend/src/components/EventCard.jsx

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarIcon,
  ClockIcon,
  PinIcon,
  HeartIcon,
  TicketIcon,
  MusicIcon,
} from "./Icons";

const MONTHS = [
  "GEN", "FEB", "MAR", "APR", "MAG", "GIU",
  "LUG", "AGO", "SET", "OTT", "NOV", "DIC",
];

const pad = (n) => String(n).padStart(2, "0");

function useCardCountdown(date, time) {
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
      if (d > 0)      setLabel(`${d}g ${pad(h)}h ${pad(m)}m`);
      else if (h > 0) setLabel(`${pad(h)}h ${pad(m)}m ${pad(s)}s`);
      else            setLabel(`${pad(m)}m ${pad(s)}s`);
    }
    tick();
    ref.current = setInterval(tick, 1000);
    return () => clearInterval(ref.current);
  }, [date, time]);
  return label;
}

function parseWhen(date, time) {
  if (!date) return null;
  const hasTime = typeof date === "string" && date.includes("T");
  const d = new Date(hasTime ? date : `${date}T${time || "00:00:00"}`);
  if (Number.isNaN(d.getTime())) return null;

  const showTime = hasTime || Boolean(time);
  return {
    day: String(d.getDate()).padStart(2, "0"),
    month: MONTHS[d.getMonth()],
    dateLabel: d.toLocaleDateString("it-IT", {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    timeLabel: showTime
      ? d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })
      : null,
  };
}

function formatPrice(min, max, currency) {
  if (min == null && max == null) return null;
  const cur = currency === "EUR" ? "€" : currency ? `${currency} ` : "€";
  const fmt = (n) => `${cur}${Math.round(n)}`;
  if (min != null && max != null && Math.round(min) !== Math.round(max)) {
    return `${fmt(min)} – ${fmt(max)}`;
  }
  return `da ${fmt(min ?? max)}`;
}

function handleMove(e) {
  const r = e.currentTarget.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width - 0.5;
  const y = (e.clientY - r.top) / r.height - 0.5;
  e.currentTarget.style.setProperty("--rx", `${(-y * 8).toFixed(2)}deg`);
  e.currentTarget.style.setProperty("--ry", `${(x * 8).toFixed(2)}deg`);
  e.currentTarget.style.setProperty("--lift", "-7px");
}

function handleLeave(e) {
  e.currentTarget.style.setProperty("--rx", "0deg");
  e.currentTarget.style.setProperty("--ry", "0deg");
  e.currentTarget.style.setProperty("--lift", "0px");
}

export default function EventCard({
  ev,
  onAddFavorite,
  onRemove,
  onToggleFavorite,
  favorited = false,
}) {
  const when = parseWhen(ev.date, ev.time);
  const price = formatPrice(ev.priceMin, ev.priceMax, ev.currency);
  const detailId = ev.eventId || ev.id;
  const cdLabel = useCardCountdown(ev.date, ev.time);

  const favAction = onRemove || onToggleFavorite || onAddFavorite;
  const active = typeof onRemove === "function" ? true : Boolean(favorited);

  return (
    <article
      className="ev-card press cinematic-card appear"
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <div className="ev-card__media">
        {ev.image ? (
          <img
            className="ev-card__img"
            src={ev.image}
            alt={ev.name || "Evento"}
            loading="lazy"
          />
        ) : (
          <div className="ev-card__noimg">
            <MusicIcon size={56} />
          </div>
        )}

        {when && (
          <div className="ev-card__date" aria-hidden="true">
            <span className="d">{when.day}</span>
            <span className="m">{when.month}</span>
          </div>
        )}

        {favAction && (
          <div className="ev-card__fav">
            <button
              type="button"
              className={"icon-btn icon-btn--fav" + (active ? " is-on" : "")}
              onClick={favAction}
              title={active ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
              aria-label={active ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"}
              aria-pressed={active}
            >
              <HeartIcon size={19} filled={active} />
            </button>
          </div>
        )}

        {price && (
          <div className="ev-card__price">
            <TicketIcon size={15} />
            {price}
          </div>
        )}

        {ev.genre && ev.genre !== "Undefined" && (
          <div className="ev-card__genre">{ev.genre}</div>
        )}
      </div>

      <div className="ev-card__body">
        <h3 className="ev-card__title">
          {detailId ? (
            <Link to={`/event/${detailId}`} className="ev-card__titlelink">
              {ev.name || "Evento senza titolo"}
            </Link>
          ) : (
            ev.name || "Evento senza titolo"
          )}
        </h3>

        <div className="ev-card__meta">
          <div className="meta-row">
            <CalendarIcon size={17} />
            <span>{when ? when.dateLabel : "Data da definire"}</span>
          </div>

          {when?.timeLabel && (
            <div className="meta-row">
              <ClockIcon size={17} />
              <span>Ore {when.timeLabel}</span>
            </div>
          )}

          <div className="meta-row">
            <PinIcon size={17} />
            <span>
              {[ev.venue, ev.city].filter(Boolean).join(" · ") ||
                "Location da annunciare"}
            </span>
          </div>
        </div>

        <div className="ev-card__foot">
          <div className="ev-card__foot-left">
            {cdLabel && <span className="ev-card__countdown">⏱ {cdLabel}</span>}
            {detailId && (
              <Link to={`/event/${detailId}`} className="ev-card__detail-link">
                Scopri evento →
              </Link>
            )}
          </div>
          {ev.url ? (
            <a
              href={ev.url}
              target="_blank"
              rel="noreferrer"
              className="btn btn--primary btn--sm"
            >
              <TicketIcon size={18} />
              Biglietti
            </a>
          ) : (
            <span className="ev-card__no-ticket">Biglietti non disponibili</span>
          )}
        </div>
      </div>
    </article>
  );
}
