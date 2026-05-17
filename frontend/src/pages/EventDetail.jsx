// frontend/src/pages/EventDetail.jsx

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getEvent, getArtistEvents, getYoutubeVideos, getSpotifyArtist, addFavorite } from "../lib/api";
import {
  CalendarIcon,
  ClockIcon,
  PinIcon,
  TicketIcon,
  MusicIcon,
  HeartIcon,
  ArrowRightIcon,
  SearchIcon,
  GlobeIcon,
  TreeIcon,
  BedIcon,
  ForkIcon,
  YoutubeIcon,
  SpotifyIcon,
  InstagramIcon,
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

function getDaysLeft(date, time) {
  if (!date) return null;
  const d = new Date(date.includes("T") ? date : `${date}T${time || "20:00:00"}`);
  if (Number.isNaN(d.getTime())) return null;
  const diff = d - new Date();
  if (diff < 0) return null;
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Oggi!";
  if (days === 1) return "Domani!";
  if (days < 30) return `Tra ${days} giorni`;
  const months = Math.floor(days / 30);
  return `Tra ${months} ${months === 1 ? "mese" : "mesi"}`;
}

export default function EventDetail() {
  const { id } = useParams();
  const [ev, setEv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [favMsg, setFavMsg] = useState("");
  const [otherDates, setOtherDates] = useState([]);
  const [parks, setParks] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [showMap, setShowMap] = useState(false);
  const [ytVideos, setYtVideos] = useState([]);
  const [artistBio, setArtistBio] = useState("");
  const [spotifyArtist, setSpotifyArtist] = useState(null);
  const [activeTab, setActiveTab] = useState("evento");
  const [bioExpanded, setBioExpanded] = useState(false);

  useEffect(() => { window.scrollTo(0, 0); }, [id]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setNotFound(false);
    setError("");
    setOtherDates([]);
    setParks([]);
    getEvent(id)
      .then((data) => {
        if (alive) setEv(data);
      })
      .catch((e) => {
        if (!alive) return;
        if (e.message === "NOT_FOUND") setNotFound(true);
        else if (e.message === "ENDPOINT_MISSING")
          setError(
            "Dettaglio non disponibile su questo backend: la rotta /events/:id non è ancora attiva (backend non aggiornato o VITE_API_BASE_URL che punta alla versione online vecchia)."
          );
        else setError("Non siamo riusciti a caricare l'evento. Riprova.");
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [id]);

  const artistId = ev?.artists?.[0]?.id;

  useEffect(() => {
    if (!artistId) return;
    let alive = true;
    getArtistEvents(artistId)
      .then((res) => {
        if (!alive) return;
        const list = (res.events || []).filter((e) => e.id !== id).slice(0, 6);
        setOtherDates(list);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [artistId, id]);

  useEffect(() => {
    const name = ev?.artists?.[0]?.name;
    if (!name) return;
    let alive = true;

    // YouTube: sempre per nome, indipendente da Ticketmaster
    getYoutubeVideos(name)
      .then((data) => { if (alive) setYtVideos(data.videos || []); })
      .catch(() => {});

    // Spotify: cerca artista per nome, indipendente da Ticketmaster
    getSpotifyArtist(name)
      .then((data) => { if (alive) setSpotifyArtist(data); })
      .catch(() => {});

    // Bio: Wikipedia (IT con fallback EN), nessuna API key
    const fetchBio = async () => {
      for (const lang of ["it", "en"]) {
        try {
          const r = await fetch(
            `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`
          );
          if (!r.ok) continue;
          const d = await r.json();
          if (d.extract && d.type !== "disambiguation") {
            if (alive) setArtistBio(d.extract);
            return;
          }
        } catch {}
      }
    };
    fetchBio();

    return () => { alive = false; };
  }, [ev]);

  useEffect(() => {
    const lat = ev?.venue?.lat;
    const lon = ev?.venue?.lon;
    if (lat == null || lon == null) return;
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 8000);
    const q = `[out:json][timeout:8];(node(around:2000,${lat},${lon})[leisure~"park|garden"][name];way(around:2000,${lat},${lon})[leisure~"park|garden"][name];);out center 5;`;
    fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((data) => {
        const items = (data.elements || [])
          .filter((el) => el.tags?.name)
          .slice(0, 5)
          .map((el) => ({ id: el.id, type: el.type, name: el.tags.name }));
        setParks(items);
      })
      .catch(() => {})
      .finally(() => clearTimeout(tid));
    return () => { ctrl.abort(); clearTimeout(tid); };
  }, [ev]);

  useEffect(() => {
    const lat = ev?.venue?.lat;
    const lon = ev?.venue?.lon;
    if (lat == null || lon == null) return;
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 8000);
    const q = `[out:json][timeout:8];(node(around:1000,${lat},${lon})[amenity~"restaurant|bar|cafe|fast_food|pub"][name];);out 6;`;
    fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((data) => {
        const items = (data.elements || [])
          .filter((el) => el.tags?.name)
          .slice(0, 6)
          .map((el) => ({ id: el.id, name: el.tags.name, type: el.tags.amenity }));
        setRestaurants(items);
      })
      .catch(() => {})
      .finally(() => clearTimeout(tid));
    return () => { ctrl.abort(); clearTimeout(tid); };
  }, [ev]);

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
  const daysLeft = getDaysLeft(ev.date, ev.time);
  const v = ev.venue || {};
  const artist = ev.artists?.[0];
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

  const hasMedia = !!(artist?.name);

  const checkin = ev.date ? ev.date.slice(0, 10) : null;
  const checkout = (() => {
    if (!checkin) return null;
    const d = new Date(`${checkin}T12:00:00`);
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  })();
  const bookingUrl = v.city
    ? `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(v.city)}${checkin ? `&checkin=${checkin}&checkout=${checkout}` : ""}`
    : null;
  const airbnbUrl = v.city
    ? `https://www.airbnb.it/s/${encodeURIComponent(v.city)}/homes${checkin ? `?checkin=${checkin}&checkout=${checkout}` : ""}`
    : null;

  return (
    <section className="section">
      <div className="wrap">
        <Link to="/home" className="ed-back">← Tutti gli eventi</Link>

        {/* HERO */}
        <div className={`ed-hero${!ev.image ? " ed-hero--noimg" : ""}`}>
          {ev.image && <img className="ed-hero__img" src={ev.image} alt={ev.name} />}
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
                <CalendarIcon size={15} />
                <span>{when.dateLabel}</span>
                {when.timeLabel && (
                  <>
                    <span className="ed-hero__sep">·</span>
                    <ClockIcon size={15} />
                    <span>Ore {when.timeLabel}</span>
                  </>
                )}
                {daysLeft && <span className="ed-hero__countdown">{daysLeft}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE TABS */}
        <div className="ed-tabs">
          {[["evento", "Evento"], ["artista", "Artista"], ["dove", "Dove & Come"]].map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              className={`ed-tabs__btn${activeTab === tab ? " active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* SECTION: EVENTO */}
        <div className={`ed-section${activeTab === "evento" ? " ed-section--active" : ""}`}>
          <div className="ed-card">
            <div className="ed__meta">
              <div className="ed__row">
                <PinIcon size={18} />
                <span>{[v.name, v.address, v.city].filter(Boolean).join(" · ") || "Location da annunciare"}</span>
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
                <a href={ev.url} target="_blank" rel="noreferrer" className="btn btn--primary">
                  <TicketIcon size={18} />
                  Biglietti su Ticketmaster
                  <ArrowRightIcon size={18} />
                </a>
              )}
              <button type="button" className="btn btn--ghost" onClick={handleFav}>
                <HeartIcon size={18} />
                Salva nei preferiti
              </button>
            </div>
            {favMsg && (
              <div
                className={"banner " + (favMsg.includes("aggiunto") ? "banner--ok" : "banner--error")}
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

          {otherDates.length > 0 && (
            <div className="ed-dates">
              <h2>Prossime date{artist?.name ? ` di ${artist.name}` : ""}</h2>
              <ul className="ed-dates__list">
                {otherDates.map((e) => {
                  const w = formatWhen(e.date, e.time);
                  return (
                    <li key={e.id}>
                      <Link to={`/event/${e.id}`} className="ed-dates__row">
                        <span className="ed-dates__when">
                          <CalendarIcon size={16} />
                          {w.dateLabel}
                        </span>
                        <span className="ed-dates__where">
                          {[e.venue, e.city].filter(Boolean).join(" · ") || "Location da annunciare"}
                        </span>
                        <ArrowRightIcon size={16} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>

        {/* SECTION: ARTISTA */}
        <div className={`ed-section${activeTab === "artista" ? " ed-section--active" : ""}`}>
          {artist && (
            <div className="ed-artist">
              {artist.image && (
                <img className="ed-artist__img" src={artist.image} alt={artist.name} loading="lazy" />
              )}
              <div className="ed-artist__body">
                <span className="eyebrow"><MusicIcon size={14} /> Artista</span>
                <h2>{artist.name}</h2>
                {artist.genre && <p className="ed-artist__genre">{artist.genre}</p>}
                {artistBio && (
                <>
                  <p className={"ed-artist__bio" + (bioExpanded ? " ed-artist__bio--expanded" : "")}>
                    {artistBio}
                  </p>
                  <button
                    type="button"
                    className="ed-artist__bio-toggle"
                    onClick={() => setBioExpanded((v) => !v)}
                  >
                    {bioExpanded ? "Riduci ▲" : "Leggi di più ▼"}
                  </button>
                </>
              )}
                <div className="ed-artist__links">
                  {artist.links?.instagram && (
                    <a href={artist.links.instagram} target="_blank" rel="noreferrer" className="ed-artist__link ed-artist__link--ig">
                      <InstagramIcon size={15} />Instagram
                    </a>
                  )}
                  {artist.links?.homepage && (
                    <a href={artist.links.homepage} target="_blank" rel="noreferrer" className="ed-artist__link">
                      <GlobeIcon size={15} />Sito ufficiale
                    </a>
                  )}
                  {artist.links?.twitter && (
                    <a href={artist.links.twitter} target="_blank" rel="noreferrer" className="ed-artist__link">Twitter / X</a>
                  )}
                  {artist.links?.facebook && (
                    <a href={artist.links.facebook} target="_blank" rel="noreferrer" className="ed-artist__link">Facebook</a>
                  )}
                </div>
              </div>
            </div>
          )}
          {spotifyArtist && (
            <div className="ed-spotify">
              <div className="ed-spotify__header">
                <h3><SpotifyIcon size={16} />Ascolta su Spotify</h3>
                <div className="ed-spotify__meta">
                  {spotifyArtist.genres.length > 0 && (
                    <div className="ed-spotify__genres">
                      {spotifyArtist.genres.map((g) => (
                        <span key={g} className="tag tag--sm">{g}</span>
                      ))}
                    </div>
                  )}
                  {spotifyArtist.followers > 0 && (
                    <span className="ed-spotify__followers">
                      {spotifyArtist.followers.toLocaleString("it-IT")} follower
                    </span>
                  )}
                </div>
              </div>
              <iframe
                title="Player Spotify"
                className="ed-spotify__frame"
                src={spotifyArtist.embedUrl}
                loading="lazy"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              />
              {spotifyArtist.externalUrl && (
                <a href={spotifyArtist.externalUrl} target="_blank" rel="noreferrer" className="ed-spotify__open">
                  <SpotifyIcon size={14} />Apri su Spotify<ArrowRightIcon size={14} />
                </a>
              )}
            </div>
          )}
          {ytVideos.length > 0 && (
            <div className="ed-yt">
              <h3><YoutubeIcon size={16} />Ultimo video</h3>
              <iframe
                className="ed-yt__embed"
                src={`https://www.youtube.com/embed/${ytVideos[0].id}`}
                title={ytVideos[0].title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              <a href={`https://www.youtube.com/watch?v=${ytVideos[0].id}`} target="_blank" rel="noreferrer" className="ed-yt__open">
                <YoutubeIcon size={14} />Apri su YouTube<ArrowRightIcon size={14} />
              </a>
            </div>
          )}
        </div>

        {/* SECTION: DOVE & COME */}
        <div className={`ed-section${activeTab === "dove" ? " ed-section--active" : ""}`}>
          <div className="ed-grid4">

            {/* Card 1 — Mappa */}
            {hasGeo && (
              <div className="ed-tile">
                <div className="ed-tile__head">
                  <PinIcon size={16} /><span>Come arrivare</span>
                  <div className="ed-tile__links">
                    <a href={gdir} target="_blank" rel="noreferrer" className="btn btn--outline btn--sm">Indicazioni</a>
                  </div>
                </div>
                {showMap ? (
                  <iframe title="Mappa del venue" className="ed-tile__map" src={osmSrc} />
                ) : (
                  <button type="button" className="ed-tile__map-preview" onClick={() => setShowMap(true)}>
                    <PinIcon size={24} />
                    <span>Mostra mappa</span>
                    {(v.address || v.city) && <small>{[v.address, v.city].filter(Boolean).join(" · ")}</small>}
                  </button>
                )}
              </div>
            )}

            {/* Card 2 — Parchi */}
            {parks.length > 0 && (
              <div className="ed-tile">
                <div className="ed-tile__head">
                  <TreeIcon size={16} /><span>Parchi e verde</span>
                </div>
                <ul className="ed-tile__list">
                  {parks.map((p) => (
                    <li key={p.id}>
                      <a href={`https://www.openstreetmap.org/${p.type}/${p.id}`} target="_blank" rel="noreferrer" className="ed-tile__row">
                        <TreeIcon size={14} /><span>{p.name}</span><ArrowRightIcon size={12} />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Card 3 — Ristoranti */}
            {restaurants.length > 0 && (
              <div className="ed-tile">
                <div className="ed-tile__head">
                  <ForkIcon size={16} /><span>Dove mangiare</span>
                </div>
                <ul className="ed-tile__list">
                  {restaurants.map((r) => (
                    <li key={r.id}>
                      <div className="ed-tile__row ed-tile__row--static">
                        <ForkIcon size={14} />
                        <span>{r.name}</span>
                        <small className="ed-tile__tag">{r.type === "fast_food" ? "fast food" : r.type}</small>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Card 4 — Dormire */}
            {(bookingUrl || airbnbUrl) && (
              <div className="ed-tile">
                <div className="ed-tile__head">
                  <BedIcon size={16} /><span>Dove dormire</span>
                </div>
                <div className="ed-tile__sleep">
                  {bookingUrl && (
                    <a href={bookingUrl} target="_blank" rel="noreferrer" className="ed-tile__sleep-card">
                      <div className="ed-tile__sleep-icon"><BedIcon size={20} /></div>
                      <div>
                        <div className="ed-tile__sleep-title">Booking.com</div>
                        <div className="ed-tile__sleep-sub">Hotel, B&amp;B e appartamenti</div>
                      </div>
                      <ArrowRightIcon size={16} />
                    </a>
                  )}
                  {airbnbUrl && (
                    <a href={airbnbUrl} target="_blank" rel="noreferrer" className="ed-tile__sleep-card">
                      <div className="ed-tile__sleep-icon"><GlobeIcon size={20} /></div>
                      <div>
                        <div className="ed-tile__sleep-title">Airbnb</div>
                        <div className="ed-tile__sleep-sub">Case e stanze a {v.city || "destinazione"}</div>
                      </div>
                      <ArrowRightIcon size={16} />
                    </a>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>

      </div>
    </section>
  );
}
