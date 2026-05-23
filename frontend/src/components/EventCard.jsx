// frontend/src/components/EventCard.jsx

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
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

// Estrae { day, month, dateLabel, timeLabel } in modo robusto dai dati Ticketmaster.
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

const SPRING = { stiffness: 160, damping: 28, mass: 0.8 };

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

  // Parallax 3D — spring più morbida per evitare jitter
  const mx = useSpring(useMotionValue(0.5), SPRING);
  const my = useSpring(useMotionValue(0.5), SPRING);
  const rotateX = useTransform(my, [0, 1], [5, -5]);
  const rotateY = useTransform(mx, [0, 1], [-5, 5]);

  function handleMove(e) {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  }
  function handleLeave() {
    mx.set(0.5);
    my.set(0.5);
  }

  return (
    <motion.article
      className="ev-card press cinematic-card appear"
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.28, ease: [0.2, 0.9, 0.3, 1] }}
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
              title={
                active ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"
              }
              aria-label={
                active ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"
              }
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
    </motion.article>
  );
}
