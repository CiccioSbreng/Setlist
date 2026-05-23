// frontend/src/components/EventCard.jsx

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

function getDaysLeft(date, time) {
  if (!date) return null;
  const d = new Date(date.includes("T") ? date : `${date}T${time || "20:00:00"}`);
  if (Number.isNaN(d.getTime()) || d - Date.now() < 0) return null;
  const days = Math.floor((d - Date.now()) / 86400000);
  if (days === 0) return "Oggi!";
  if (days === 1) return "Domani!";
  if (days < 30) return `Tra ${days} giorni`;
  const months = Math.floor(days / 30);
  return `Tra ${months} ${months === 1 ? "mese" : "mesi"}`;
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

const SPRING = { stiffness: 220, damping: 26, mass: 0.6 };

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
  const daysLeft = getDaysLeft(ev.date, ev.time);

  const favAction = onRemove || onToggleFavorite || onAddFavorite;
  // cuore acceso (rosso) se è nei preferiti: sempre nella pagina Preferiti,
  // oppure quando l'evento risulta salvato in home.
  const active = typeof onRemove === "function" ? true : Boolean(favorited);

  // Parallax 3D al passaggio mouse — tilt morbido via spring
  const mx = useSpring(useMotionValue(0.5), SPRING);
  const my = useSpring(useMotionValue(0.5), SPRING);
  const rotateX = useTransform(my, [0, 1], [6, -6]);
  const rotateY = useTransform(mx, [0, 1], [-6, 6]);

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
            {daysLeft && <span className="ev-card__countdown">{daysLeft}</span>}
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
