import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getEvent } from "../lib/api";
import { formatWhen, formatPrice } from "../lib/format";
import { openGoogleCalendar } from "../lib/calendar";
import { useArtistMedia } from "../hooks/useArtistMedia";
import { useEventFavorite } from "../hooks/useEventFavorite";
import { useCountdown } from "../hooks/useCountdown";
import { useTilt } from "../hooks/useTilt";
import {
  CalendarIcon, ClockIcon, PinIcon, TicketIcon, MusicIcon, GlobeIcon,
  HeartIcon, ArrowRightIcon, SearchIcon, ShareIcon, DownloadIcon,
} from "../components/Icons";
import ArtistSection from "../components/ArtistSection";
import VenueSection  from "../components/VenueSection";

/* ─── Sub-components: stati vuoti ─────────────────────────────────────── */

function HeroSkeleton() {
  return (
    <section className="section">
      <div className="wrap">
        <div className="sk ed-hero-sk" />
        <div className="ed-bar-sk">
          {[72, 62, 96].map((w, i) => (
            <div key={i} className="sk" style={{ width: w, height: 34, borderRadius: 999 }} />
          ))}
        </div>
        <div className="ed-card">
          <div className="sk sk--line w70" style={{ marginBottom: 12 }} />
          <div className="sk sk--line w45" />
        </div>
      </div>
    </section>
  );
}

function NotFoundState() {
  return (
    <section className="section">
      <div className="wrap">
        <div className="state">
          <div className="state__icon"><SearchIcon size={30} /></div>
          <h3>Evento non trovato</h3>
          <p>L'evento che cerchi non esiste più o è stato rimosso.</p>
          <Link to="/home" className="btn btn--primary">Torna agli eventi</Link>
        </div>
      </div>
    </section>
  );
}

function ErrorState({ message }) {
  return (
    <section className="section">
      <div className="wrap">
        <div className="banner banner--error">{message}</div>
        <div style={{ marginTop: 20 }}>
          <Link to="/home" className="btn btn--ghost">← Torna agli eventi</Link>
        </div>
      </div>
    </section>
  );
}

/* ─── Componente principale ───────────────────────────────────────────── */

export default function EventDetail() {
  const { id } = useParams();
  const [ev,       setEv]       = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error,    setError]    = useState("");
  const [shareMsg, setShareMsg] = useState("");
  const [activeTab, setActiveTab] = useState("evento");

  const media   = useArtistMedia(ev);
  const { isFav, toggle: toggleFav } = useEventFavorite(id, ev);
  const cdLabel = useCountdown(ev?.date, ev?.time);
  const heroRef = useTilt({ max: 7 });
  const stageRef = useRef(null);
  const [barFloating, setBarFloating] = useState(false);

  const [venueVisible, setVenueVisible] = useState(false);
  const venueSentinelRef = useRef(null);
  useEffect(() => {
    if (!ev || !venueSentinelRef.current) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVenueVisible(true); obs.disconnect(); } },
      { rootMargin: "300px" }
    );
    obs.observe(venueSentinelRef.current);
    return () => obs.disconnect();
  }, [ev]);

  useEffect(() => {
    if (!ev) return;
    const stage = stageRef.current;
    if (!stage) return;
    const check = () => {
      if (window.innerWidth <= 860) { setBarFloating(false); return; }
      const rect = stage.getBoundingClientRect();
      setBarFloating(rect.bottom < 72);
    };
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check, { passive: true });
    check();
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [ev]);

  useEffect(() => { window.scrollTo(0, 0); }, [id]);

  useEffect(() => {
    let alive = true;
    setLoading(true); setNotFound(false); setError("");
    getEvent(id)
      .then((data) => { if (alive) setEv(data); })
      .catch((e) => {
        if (!alive) return;
        if (e.message === "NOT_FOUND")           setNotFound(true);
        else if (e.message === "ENDPOINT_MISSING") setError("Dettaglio non disponibile: VITE_API_BASE_URL errato o backend non aggiornato.");
        else                                       setError("Non siamo riusciti a caricare l'evento. Riprova.");
      })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [id]);

  async function share() {
    if (navigator.share) {
      try { await navigator.share({ title: ev.name, url: window.location.href }); } catch {}
    } else {
      await navigator.clipboard.writeText(window.location.href).catch(() => {});
      setShareMsg("Link copiato!");
      setTimeout(() => setShareMsg(""), 2500);
    }
  }

  function scrollTo(tab) {
    setActiveTab(tab);
    document.getElementById(`section-${tab}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ── early returns ── */
  if (loading)  return <HeroSkeleton />;
  if (notFound) return <NotFoundState />;
  if (error)    return <ErrorState message={error} />;

  const when   = formatWhen(ev.date, ev.time);
  const price  = formatPrice(ev.priceMin, ev.priceMax, ev.currency);
  const v      = ev.venue || {};
  const artist = ev.artists?.[0];

  return (
    <section className="section">
      <div className="wrap">
        <Link to="/home" className="ed-back">← Tutti gli eventi</Link>

        {/* ── HERO 3D ── */}
        <div ref={stageRef} className="ed-stage">
          <div ref={heroRef} className={`ed-hero${!ev.image ? " ed-hero--noimg" : ""}`}>
            {ev.image && (
              <div className="ed-hero__media">
                <img
                  className="ed-hero__img blur-up"
                  src={ev.image}
                  alt={ev.name}
                  onLoad={(e) => e.target.classList.remove("blur-up")}
                />
              </div>
            )}
            <div className="ed-hero__glow" aria-hidden="true" />
            <div className="ed-hero__overlay">
              <div className="ed-hero__inner">
                <div className="ed__tags">
                  {ev.segment && <span className="tag">{ev.segment}</span>}
                  {ev.genre   && <span className="tag">{ev.genre}</span>}
                  {ev.subGenre && ev.subGenre !== ev.genre && <span className="tag">{ev.subGenre}</span>}
                  {ev.status === "cancelled"  && <span className="tag tag--warn">Annullato</span>}
                  {ev.status === "postponed"  && <span className="tag tag--warn">Rinviato</span>}
                  {ev.status === "rescheduled" && <span className="tag tag--warn">Riprogrammato</span>}
                </div>
                <h1 className="ed-hero__title">{ev.name}</h1>
                {ev.lineup?.length > 1 && (
                  <p className="ed-hero__lineup">{ev.lineup.join(" · ")}</p>
                )}
                <div className="ed-hero__when">
                  <CalendarIcon size={15} /><span>{when.dateLabel}</span>
                  {when.timeLabel && (
                    <><span className="ed-hero__sep">·</span><ClockIcon size={15} /><span>Ore {when.timeLabel}</span></>
                  )}
                  {cdLabel && <span className="ed-hero__countdown">⏱ {cdLabel}</span>}
                </div>
              </div>
            </div>
            <div className="ed-hero__glare" aria-hidden="true" />
          </div>
        </div>

        {/* ── BARRA: navigazione + azioni ── */}
        <div className={`ed-bar${barFloating ? " is-floating" : ""}`}>
          <nav className="ed-bar__nav" aria-label="Sezioni evento">
            {[["evento","Evento"],["artista","Artista"],["dove","Dove & Come"]].map(([tab, label]) => (
              <button
                key={tab}
                type="button"
                className={`ed-bar__tab${activeTab === tab ? " active" : ""}`}
                onClick={() => scrollTo(tab)}
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="ed-bar__actions">
            {ev.status !== "cancelled" && ev.url && (
              <a href={ev.url} target="_blank" rel="noreferrer" className="btn btn--primary">
                <TicketIcon size={18} />Controlla disponibilità<ArrowRightIcon size={18} />
              </a>
            )}
            <button
              type="button"
              className={`btn ${isFav ? "btn--fav-active" : "btn--ghost"}`}
              onClick={toggleFav}
            >
              <HeartIcon size={18} filled={isFav} />{isFav ? "Nei preferiti" : "Salva"}
            </button>
            <button type="button" className="btn btn--ghost" onClick={share}>
              <ShareIcon size={18} />{shareMsg || "Condividi"}
            </button>
            <button type="button" className="btn btn--ghost" onClick={() => openGoogleCalendar(ev)}>
              <DownloadIcon size={18} />Calendario
            </button>
          </div>
        </div>

        {/* ── SEZIONE EVENTO ── */}
        <div id="section-evento" className="ed-section">
          <div className="ed-card">
            {ev.status === "cancelled" && (
              <div className="ed__status-banner ed__status-banner--cancelled">
                Evento annullato — i biglietti acquistati verranno rimborsati
              </div>
            )}
            {ev.status === "postponed" && (
              <div className="ed__status-banner ed__status-banner--warn">
                Evento rinviato — verifica la nuova data sul sito ufficiale
              </div>
            )}
            {ev.status === "rescheduled" && (
              <div className="ed__status-banner ed__status-banner--warn">
                Evento riprogrammato — controlla la data aggiornata
              </div>
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
                <span>{[v.name, v.address, v.city].filter(Boolean).join(" · ") || "Location da annunciare"}</span>
              </div>
              {(ev.genre || ev.segment) && (
                <div className="ed__row">
                  <MusicIcon size={18} />
                  <span>{[ev.genre, ev.subGenre && ev.subGenre !== ev.genre ? ev.subGenre : null].filter(Boolean).join(" · ") || ev.segment}</span>
                </div>
              )}
              {price && (
                <div className="ed__row">
                  <TicketIcon size={18} /><span>{price}</span>
                </div>
              )}
              {v.url && (
                <div className="ed__row">
                  <GlobeIcon size={18} />
                  <a href={v.url} target="_blank" rel="noreferrer" className="ed__row-link">{v.name || "Sito del venue"}</a>
                </div>
              )}
            </div>
            {(ev.info || ev.note) && (
              <div className="ed__note">
                {ev.info && <p>{ev.info}</p>}
                {ev.note && <p className="muted">{ev.note}</p>}
              </div>
            )}
          </div>
        </div>

        {/* ── ARTISTA ── */}
        <ArtistSection ev={ev} artist={artist} {...media} />

        {/* ── DOVE & COME (lazy) ── */}
        <div ref={venueSentinelRef}>
          {venueVisible && <VenueSection ev={ev} />}
        </div>
      </div>

      {/* ── STICKY CTA (solo mobile) ── */}
      <div className="ed-sticky-cta">
        {ev.status !== "cancelled" && ev.url && (
          <a href={ev.url} target="_blank" rel="noreferrer" className="btn btn--primary ed-sticky-cta__tickets">
            <TicketIcon size={18} />Controlla disponibilità<ArrowRightIcon size={16} />
          </a>
        )}
        <button
          type="button"
          className={`btn ${isFav ? "btn--fav-active" : "btn--ghost"} ed-sticky-cta__fav`}
          onClick={toggleFav}
          aria-label={isFav ? "Rimuovi dai preferiti" : "Salva nei preferiti"}
        >
          <HeartIcon size={20} filled={isFav} />
        </button>
      </div>
    </section>
  );
}
