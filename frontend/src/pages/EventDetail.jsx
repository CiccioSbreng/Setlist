import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getEvent, addFavorite, removeFavorite, getFavorites } from "../lib/api";
import { formatWhen, formatPrice, getDaysLeft } from "../lib/format";
import { useArtistMedia } from "../hooks/useArtistMedia";
import { useVenueData } from "../hooks/useVenueData";
import { useTilt } from "../hooks/useTilt";
import {
  CalendarIcon, ClockIcon, PinIcon, TicketIcon,
  HeartIcon, ArrowRightIcon, SearchIcon,
  ShareIcon, DownloadIcon,
} from "../components/Icons";
import ArtistSection from "../components/ArtistSection";
import VenueSection  from "../components/VenueSection";

export default function EventDetail() {
  const { id } = useParams();
  const [ev,       setEv]       = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error,    setError]    = useState("");
  const [isFav,    setIsFav]    = useState(false);
  const [favId,    setFavId]    = useState(null);
  const [favMsg,   setFavMsg]   = useState("");
  const [shareMsg, setShareMsg] = useState("");
  const [activeTab, setActiveTab] = useState("evento");

  const media = useArtistMedia(ev);
  const venue = useVenueData(ev);
  const heroRef = useTilt({ max: 7 });

  useEffect(() => { window.scrollTo(0, 0); }, [id]);

  useEffect(() => {
    let alive = true;
    setLoading(true); setNotFound(false); setError("");
    getEvent(id)
      .then((data) => { if (alive) setEv(data); })
      .catch((e) => {
        if (!alive) return;
        if (e.message === "NOT_FOUND")        setNotFound(true);
        else if (e.message === "ENDPOINT_MISSING") setError("Dettaglio non disponibile: backend non aggiornato o VITE_API_BASE_URL errato.");
        else                                   setError("Non siamo riusciti a caricare l'evento. Riprova.");
      })
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [id]);

  useEffect(() => {
    if (!localStorage.getItem("token") || !id) return;
    getFavorites()
      .then((list) => {
        const found = list.find((f) => f.eventId === id);
        if (found) { setIsFav(true); setFavId(found._id); }
      })
      .catch(() => {});
  }, [id]);

  async function handleFav() {
    setFavMsg("");
    if (!localStorage.getItem("token")) { setFavMsg("Accedi al tuo account per salvare questo evento."); return; }
    try {
      if (isFav && favId) {
        await removeFavorite(favId);
        setIsFav(false); setFavId(null); setFavMsg("Rimosso dai preferiti.");
      } else {
        const created = await addFavorite({ eventId: ev.id, name: ev.name, image: ev.image, date: ev.date, venue: ev.venue?.name, city: ev.venue?.city, url: ev.url });
        setIsFav(true); setFavId(created._id); setFavMsg("Aggiunto ai preferiti!");
      }
    } catch (e) { setFavMsg(e.message || "Errore."); }
  }

  async function shareEvent() {
    const url = window.location.href;
    if (navigator.share) { try { await navigator.share({ title: ev.name, url }); } catch {} }
    else {
      await navigator.clipboard.writeText(url).catch(() => {});
      setShareMsg("Link copiato!"); setTimeout(() => setShareMsg(""), 2500);
    }
  }

  function openGoogleCalendar() {
    const v = ev.venue || {};
    const dt = ev.date ? ev.date.replace(/[-:]/g, "").replace("T", "") : "";
    const start = dt ? dt.slice(0, 8) + "T" + (ev.time ? ev.time.replace(":", "") + "00" : "200000") : "";
    const end = start ? start.slice(0, 9) + String(parseInt(start.slice(9, 11)) + 3).padStart(2, "0") + "0000" : "";
    const loc = [v.name, v.address, v.city].filter(Boolean).join(", ");
    window.open(`https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ev.name || "")}&dates=${start}/${end}&location=${encodeURIComponent(loc)}&details=${encodeURIComponent(ev.url || "")}`, "_blank");
  }

  function generateICS() {
    const v = ev.venue || {};
    const dt = ev.date ? ev.date.replace(/[-:]/g, "").replace("T", "") : "";
    const dtStr = dt ? dt.slice(0, 8) + "T" + (ev.time ? ev.time.replace(":", "") + "00" : "200000") : "";
    let dtEnd = "";
    if (dtStr) {
      const y = +dtStr.slice(0, 4), mo = +dtStr.slice(4, 6) - 1, d = +dtStr.slice(6, 8);
      const h = +dtStr.slice(9, 11), mi = +dtStr.slice(11, 13);
      const end = new Date(y, mo, d, h + 3, mi);
      const pad = (n) => String(n).padStart(2, "0");
      dtEnd = `${end.getFullYear()}${pad(end.getMonth() + 1)}${pad(end.getDate())}T${pad(end.getHours())}${pad(end.getMinutes())}00`;
    }
    const loc = [v.name, v.address, v.city].filter(Boolean).join(", ");
    const ics = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//ConcertHub//IT","BEGIN:VEVENT", dtStr ? `DTSTART:${dtStr}` : "", dtEnd ? `DTEND:${dtEnd}` : "", `SUMMARY:${(ev.name || "").replace(/[,;\\]/g, " ")}`, `LOCATION:${loc.replace(/[,;\\]/g, " ")}`, `URL:${ev.url || ""}`, "END:VEVENT","END:VCALENDAR"].filter(Boolean).join("\r\n");
    const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
    const a = document.createElement("a"); a.href = url; a.download = `${(ev.name || "evento").replace(/[^a-z0-9]/gi, "_")}.ics`; a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return (
    <section className="section"><div className="wrap">
      <div className="sk-card" style={{ maxWidth: 760, margin: "0 auto" }}>
        <div className="sk sk--media" /><div className="sk sk--line w70" /><div className="sk sk--line w45" /><div className="sk sk--line" />
      </div>
    </div></section>
  );

  if (notFound) return (
    <section className="section"><div className="wrap">
      <div className="state">
        <div className="state__icon"><SearchIcon size={30} /></div>
        <h3>Evento non trovato</h3>
        <p>L'evento che cerchi non esiste più o è stato rimosso.</p>
        <Link to="/home" className="btn btn--primary">Torna agli eventi</Link>
      </div>
    </div></section>
  );

  if (error) return (
    <section className="section"><div className="wrap">
      <div className="banner banner--error">{error}</div>
      <div style={{ marginTop: 20 }}><Link to="/home" className="btn btn--ghost">← Torna agli eventi</Link></div>
    </div></section>
  );

  const when     = formatWhen(ev.date, ev.time);
  const price    = formatPrice(ev.priceMin, ev.priceMax, ev.currency);
  const daysLeft = getDaysLeft(ev.date, ev.time);
  const v        = ev.venue || {};
  const artist   = ev.artists?.[0];

  return (
    <section className="section">
      <div className="wrap">
        <Link to="/home" className="ed-back">← Tutti gli eventi</Link>

        {/* HERO 3D */}
        <div className="ed-stage">
          <div ref={heroRef} className={`ed-hero${!ev.image ? " ed-hero--noimg" : ""}`}>
            {ev.image && (
              <div className="ed-hero__media">
                <img className="ed-hero__img" src={ev.image} alt={ev.name} />
              </div>
            )}
            <div className="ed-hero__glow" aria-hidden="true" />
            <div className="ed-hero__overlay">
              <div className="ed-hero__inner">
                <div className="ed__tags">
                  {ev.segment && <span className="tag">{ev.segment}</span>}
                  {ev.genre && <span className="tag">{ev.genre}</span>}
                  {ev.status === "cancelled" && <span className="tag tag--warn">Annullato</span>}
                </div>
                <h1 className="ed-hero__title">{ev.name}</h1>
                {ev.lineup?.length > 1 && <p className="ed-hero__lineup">{ev.lineup.join(" · ")}</p>}
                <div className="ed-hero__when">
                  <CalendarIcon size={15} /><span>{when.dateLabel}</span>
                  {when.timeLabel && <><span className="ed-hero__sep">·</span><ClockIcon size={15} /><span>Ore {when.timeLabel}</span></>}
                  {daysLeft && <span className="ed-hero__countdown">{daysLeft}</span>}
                </div>
              </div>
            </div>
            <div className="ed-hero__glare" aria-hidden="true" />
          </div>
        </div>

        {/* BARRA: navigazione + azioni primarie */}
        <div className="ed-bar">
          <nav className="ed-bar__nav">
            {[["evento","Evento"],["artista","Artista"],["dove","Dove & Come"]].map(([tab, label]) => (
              <button key={tab} type="button" className={`ed-bar__tab${activeTab === tab ? " active" : ""}`}
                onClick={() => { setActiveTab(tab); document.getElementById(`section-${tab}`)?.scrollIntoView({ behavior: "smooth", block: "start" }); }}>
                {label}
              </button>
            ))}
          </nav>
          <div className="ed-bar__actions">
            {ev.url && (
              <a href={ev.url} target="_blank" rel="noreferrer" className="btn btn--primary">
                <TicketIcon size={18} />Biglietti<ArrowRightIcon size={18} />
              </a>
            )}
            <button type="button" className={`btn ${isFav ? "btn--fav-active" : "btn--ghost"}`} onClick={handleFav}>
              <HeartIcon size={18} filled={isFav} />{isFav ? "Nei preferiti" : "Salva"}
            </button>
            <button type="button" className="btn btn--ghost" onClick={shareEvent}>
              <ShareIcon size={18} />{shareMsg || "Condividi"}
            </button>
            <button type="button" className="btn btn--ghost" onClick={openGoogleCalendar}>
              <DownloadIcon size={18} />Calendario
            </button>
          </div>
        </div>

        {/* EVENTO */}
        <div id="section-evento" className="ed-section">
          <div className="ed-card">
            <div className="ed__meta">
              <div className="ed__row"><PinIcon size={18} /><span>{[v.name, v.address, v.city].filter(Boolean).join(" · ") || "Location da annunciare"}</span></div>
              {price && <div className="ed__row"><TicketIcon size={18} /><span>{price}</span></div>}
            </div>
            {favMsg && (
              <div className={`banner ${favMsg.startsWith("Aggiunto") ? "banner--ok" : "banner--error"}`} style={{ marginTop: 16 }}>
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
        </div>

        {/* ARTISTA */}
        <ArtistSection ev={ev} artist={artist} {...media} />

        {/* DOVE & COME */}
        <VenueSection ev={ev} {...venue} />
      </div>
    </section>
  );
}
