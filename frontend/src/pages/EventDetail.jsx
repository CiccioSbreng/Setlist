// frontend/src/pages/EventDetail.jsx

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getEvent, addFavorite } from "../lib/api";
import {
  CalendarIcon,
  ClockIcon,
  PinIcon,
  TicketIcon,
  MusicIcon,
  HeartIcon,
  ArrowRightIcon,
  SearchIcon,
} from "../components/Icons";

function formatWhen(date, time) {
  if (!date) return { dateLabel: "Data da definire", timeLabel: null };
  const hasTime = typeof date === "string" && date.includes("T");
  const d = new Date(hasTime ? date : `${date}T${time || "00:00:00"}`);
  if (Number.isNaN(d.getTime())) {
    return { dateLabel: "Data da definire", timeLabel: null };
  }
  return {
    dateLabel: d.toLocaleDateString("it-IT", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    timeLabel:
      hasTime || time
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

export default function EventDetail() {
  const { id } = useParams();
  const [ev, setEv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [favMsg, setFavMsg] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setNotFound(false);
    setError("");
    getEvent(id)
      .then((data) => {
        if (alive) setEv(data);
      })
      .catch((e) => {
        if (!alive) return;
        if (e.message === "NOT_FOUND") setNotFound(true);
        else setError("Non siamo riusciti a caricare l'evento. Riprova.");
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id]);

  async function handleFav() {
    setFavMsg("");
    const token = localStorage.getItem("token");
    if (!token) {
      setFavMsg("Accedi al tuo account per salvare questo evento.");
      return;
    }
    try {
      await addFavorite({
        eventId: ev.id,
        name: ev.name,
        image: ev.image,
        date: ev.date,
        venue: ev.venue?.name,
        city: ev.venue?.city,
        url: ev.url,
      });
      setFavMsg(`"${ev.name}" aggiunto ai preferiti.`);
    } catch (e) {
      setFavMsg(e.message || "Non è stato possibile salvare il preferito.");
    }
  }

  if (loading) {
    return (
      <section className="section">
        <div className="wrap">
          <div className="sk-card" style={{ maxWidth: 760, margin: "0 auto" }}>
            <div className="sk sk--media" />
            <div className="sk sk--line w70" />
            <div className="sk sk--line w45" />
            <div className="sk sk--line" />
          </div>
        </div>
      </section>
    );
  }

  if (notFound) {
    return (
      <section className="section">
        <div className="wrap">
          <div className="state">
            <div className="state__icon">
              <SearchIcon size={30} />
            </div>
            <h3>Evento non trovato</h3>
            <p>L'evento che cerchi non esiste più o è stato rimosso.</p>
            <Link to="/home" className="btn btn--primary">
              Torna agli eventi
            </Link>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="section">
        <div className="wrap">
          <div className="banner banner--error">{error}</div>
          <div style={{ marginTop: 20 }}>
            <Link to="/home" className="btn btn--ghost">
              ← Torna agli eventi
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const when = formatWhen(ev.date, ev.time);
  const price = formatPrice(ev.priceMin, ev.priceMax, ev.currency);
  const v = ev.venue || {};
  const hasGeo = v.lat != null && v.lon != null;
  const d = 0.008;
  const osmSrc = hasGeo
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${v.lon - d}%2C${
        v.lat - d
      }%2C${v.lon + d}%2C${v.lat + d}&layer=mapnik&marker=${v.lat}%2C${v.lon}`
    : null;
  const gmaps = hasGeo
    ? `https://www.google.com/maps/search/?api=1&query=${v.lat},${v.lon}`
    : null;
  const gdir = hasGeo
    ? `https://www.google.com/maps/dir/?api=1&destination=${v.lat},${v.lon}`
    : null;

  return (
    <section className="section">
      <div className="wrap">
        <Link to="/home" className="ed-back">
          ← Tutti gli eventi
        </Link>

        <article className="ed">
          <div className="ed__media">
            {ev.image ? (
              <img src={ev.image} alt={ev.name} />
            ) : (
              <div className="ed__noimg">
                <MusicIcon size={64} />
              </div>
            )}
          </div>

          <div className="ed__body">
            <div className="ed__tags">
              {ev.segment && <span className="tag">{ev.segment}</span>}
              {ev.genre && <span className="tag">{ev.genre}</span>}
              {ev.status === "cancelled" && (
                <span className="tag tag--warn">Annullato</span>
              )}
            </div>

            <h1 className="ed__title">{ev.name}</h1>

            {ev.lineup?.length > 1 && (
              <p className="ed__lineup">{ev.lineup.join(" · ")}</p>
            )}

            <div className="ed__meta">
              <div className="ed__row">
                <CalendarIcon size={18} />
                <span>{when.dateLabel}</span>
              </div>
              {when.timeLabel && (
                <div className="ed__row">
                  <ClockIcon size={18} />
                  <span>Ore {when.timeLabel}</span>
                </div>
              )}
              <div className="ed__row">
                <PinIcon size={18} />
                <span>
                  {[v.name, v.address, v.city].filter(Boolean).join(" · ") ||
                    "Location da annunciare"}
                </span>
              </div>
              {price && (
                <div className="ed__row">
                  <TicketIcon size={18} />
                  <span>{price}</span>
                </div>
              )}
            </div>

            <div className="ed__actions">
              {ev.url && (
                <a
                  href={ev.url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn--primary"
                >
                  <TicketIcon size={18} />
                  Biglietti su Ticketmaster
                  <ArrowRightIcon size={18} />
                </a>
              )}
              <button
                type="button"
                className="btn btn--ghost"
                onClick={handleFav}
              >
                <HeartIcon size={18} />
                Salva nei preferiti
              </button>
            </div>

            {favMsg && (
              <div
                className={
                  "banner " +
                  (favMsg.includes("aggiunto")
                    ? "banner--ok"
                    : "banner--error")
                }
                style={{ marginTop: 16 }}
              >
                {favMsg}
              </div>
            )}

            {(ev.info || ev.note) && (
              <div className="ed__note">
                {ev.info && <p>{ev.info}</p>}
                {ev.note && <p className="muted">{ev.note}</p>}
              </div>
            )}
          </div>
        </article>

        {hasGeo && (
          <div className="ed-map">
            <div className="ed-map__head">
              <h2>Come arrivare</h2>
              <div className="ed-map__links">
                <a href={gmaps} target="_blank" rel="noreferrer" className="btn btn--outline btn--sm">
                  Apri mappa
                </a>
                <a href={gdir} target="_blank" rel="noreferrer" className="btn btn--outline btn--sm">
                  Indicazioni
                </a>
              </div>
            </div>
            <iframe
              title="Mappa del venue"
              className="ed-map__frame"
              src={osmSrc}
              loading="lazy"
            />
          </div>
        )}
      </div>
    </section>
  );
}
