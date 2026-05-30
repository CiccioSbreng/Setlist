// frontend/src/components/EventCard.jsx

import { Link } from "react-router-dom";
import { formatPrice } from "../lib/format";
import { useCountdown } from "../hooks/useCountdown";
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
  const cdLabel = useCountdown(ev.date, ev.time);
  const isStarted = cdLabel === "🔴 Iniziato";


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
            className="ev-card__img blur-up"
            src={ev.image}
            alt={ev.name || "Evento"}
            loading="lazy"
            onLoad={(e) => e.target.classList.remove("blur-up")}
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

        {ev.genre && ev.genre !== "Undefined" && (
          <div className="ev-card__genre">{ev.genre}</div>
        )}

        {ev.status === "cancelled" ? (
          <div className="ev-card__status-badge ev-card__status-badge--cancelled">Annullato</div>
        ) : ev.status === "postponed" ? (
          <div className="ev-card__status-badge ev-card__status-badge--postponed">Posticipato</div>
        ) : ev.status === "rescheduled" ? (
          <div className="ev-card__status-badge ev-card__status-badge--rescheduled">Riprogrammato</div>
        ) : isStarted ? (
          <div className="ev-card__incorso-badge"><span className="ev-card__incorso-dot" />In Corso</div>
        ) : ev.status === "offsale" ? (
          <div className="ev-card__status-badge ev-card__status-badge--offsale">Esaurito</div>
        ) : ev.limited ? (
          <div className="ev-card__status-badge ev-card__status-badge--limited">Ultimi posti</div>
        ) : cdLabel ? (
          <div className="ev-card__countdown-badge">⏱ {cdLabel}</div>
        ) : price ? (
          <div className="ev-card__price">
            <TicketIcon size={15} />
            {price}
          </div>
        ) : ev.status === "onsale" ? (
          <div className="ev-card__status-badge ev-card__status-badge--onsale">Disponibile</div>
        ) : null}

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
            {detailId && (
              <Link to={`/event/${detailId}`} className="ev-card__detail-link">
                Scopri evento →
              </Link>
            )}
          </div>
          {!isStarted && (
            <div className="ev-card__foot-right">
              {price && ev.status !== "cancelled" && ev.status !== "offsale" && (
                <span className="ev-card__foot-price">{price}</span>
              )}
              {ev.status === "cancelled" ? (
                <button type="button" className="btn btn--sm ev-card__status-btn" disabled>Annullato</button>
              ) : ev.status === "offsale" ? (
                <button type="button" className="btn btn--sm ev-card__status-btn ev-card__status-btn--offsale" disabled>Esaurito</button>
              ) : ev.status === "postponed" ? (
                <a href={ev.url} target="_blank" rel="noreferrer" className="btn btn--outline btn--sm">Aggiornamenti →</a>
              ) : ev.status === "rescheduled" ? (
                <a href={ev.url} target="_blank" rel="noreferrer" className="btn btn--outline btn--sm">Nuova data →</a>
              ) : ev.url ? (
                <a
                  href={ev.url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn--primary btn--sm"
                >
                  <TicketIcon size={18} />
                  Controlla disponibilità
                </a>
              ) : (
                <span className="ev-card__no-ticket">Biglietti non disponibili</span>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
