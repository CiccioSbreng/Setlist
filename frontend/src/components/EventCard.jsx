// frontend/src/components/EventCard.jsx

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

export default function EventCard({ ev, onAddFavorite, onRemove }) {
  const when = parseWhen(ev.date, ev.time);
  const price = formatPrice(ev.priceMin, ev.priceMax, ev.currency);
  const isFav = typeof onRemove === "function";
  const detailId = ev.eventId || ev.id;

  return (
    <article className="ev-card appear">
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

        {(onAddFavorite || onRemove) && (
          <div className="ev-card__fav">
            <button
              type="button"
              className={"icon-btn icon-btn--fav" + (isFav ? " is-on" : "")}
              onClick={isFav ? onRemove : onAddFavorite}
              title={
                isFav ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"
              }
              aria-label={
                isFav ? "Rimuovi dai preferiti" : "Aggiungi ai preferiti"
              }
            >
              <HeartIcon size={19} filled={isFav} />
            </button>
          </div>
        )}

        {price && (
          <div className="ev-card__price">
            <TicketIcon size={15} />
            {price}
          </div>
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
          {detailId && (
            <Link
              to={`/event/${detailId}`}
              className="btn btn--outline btn--block btn--sm"
            >
              Dettagli
            </Link>
          )}
          {ev.url ? (
            <a
              href={ev.url}
              target="_blank"
              rel="noreferrer"
              className="btn btn--primary btn--block btn--sm"
            >
              <TicketIcon size={18} />
              Biglietti
            </a>
          ) : (
            <span
              className="btn btn--outline btn--block btn--sm"
              aria-disabled="true"
            >
              Biglietti non disponibili
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
