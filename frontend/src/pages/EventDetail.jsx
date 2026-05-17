// frontend/src/pages/EventDetail.jsx

import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getEvent, getArtistEvents, getYoutubeVideos, getSpotifyArtist, addFavorite, removeFavorite, getFavorites, getSetlist, getWeather } from "../lib/api";
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
  ShareIcon,
  DownloadIcon,
  ListMusicIcon,
  CloudIcon,
  YoutubeIcon,
  SpotifyIcon,
  InstagramIcon,
} from "../components/Icons";
import BudgetEstimate from "../components/BudgetEstimate";
import ConcertChecklist from "../components/ConcertChecklist";

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
  const [setlistData, setSetlistData] = useState(null);
  const [isFav, setIsFav] = useState(false);
  const [favId, setFavId] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [shareMsg, setShareMsg] = useState("");
  const [ytVideos, setYtVideos] = useState([]);
  const [artistBio, setArtistBio] = useState("");
  const [spotifyArtist, setSpotifyArtist] = useState(null);
  const [activeTab, setActiveTab] = useState("evento");
  const [bioExpanded, setBioExpanded] = useState(false);
  const [weather, setWeather] = useState(null);
  const [parkings, setParkings] = useState([]);
  const [cityInfo, setCityInfo] = useState(null);

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
    const token = localStorage.getItem("token");
    if (!token || !id) return;
    getFavorites()
      .then((list) => {
        const found = list.find((f) => f.eventId === id);
        if (found) { setIsFav(true); setFavId(found._id); }
      })
      .catch(() => {});
  }, [id]);

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
    const q = `[out:json][timeout:10];(node(around:2000,${lat},${lon})[amenity~"restaurant|bar|cafe|fast_food|pub|pizzeria"][name];way(around:2000,${lat},${lon})[amenity~"restaurant|bar|cafe|fast_food|pub|pizzeria"][name];);out center 6;`;
    fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((data) => {
        const items = (data.elements || [])
          .filter((el) => el.tags?.name)
          .slice(0, 6)
          .map((el) => {
            const elLat = el.lat ?? el.center?.lat;
            const elLon = el.lon ?? el.center?.lon;
            return { id: el.id, name: el.tags.name, type: el.tags.amenity, lat: elLat, lon: elLon };
          });
        setRestaurants(items);
      })
      .catch(() => {})
      .finally(() => clearTimeout(tid));
    return () => { ctrl.abort(); clearTimeout(tid); };
  }, [ev]);

  useEffect(() => {
    const name = ev?.artists?.[0]?.name;
    if (!name) return;
    getSetlist(name).then(setSetlistData).catch(() => {});
  }, [ev]);

  useEffect(() => {
    setWeather(null);
    const lat = ev?.venue?.lat;
    const lon = ev?.venue?.lon;
    const date = ev?.date;
    if (lat == null || lon == null || !date) return;
    let alive = true;
    getWeather({ lat, lon, date })
      .then((w) => alive && setWeather(w))
      .catch(() => {});
    return () => { alive = false; };
  }, [ev]);

  useEffect(() => {
    setParkings([]);
    const lat = ev?.venue?.lat;
    const lon = ev?.venue?.lon;
    if (lat == null || lon == null) return;
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 8000);
    const q = `[out:json][timeout:8];(node(around:1200,${lat},${lon})[amenity=parking][name];way(around:1200,${lat},${lon})[amenity=parking][name];);out center 5;`;
    fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(q)}`, { signal: ctrl.signal })
      .then((r) => r.json())
      .then((data) => {
        const items = (data.elements || [])
          .filter((el) => el.tags?.name)
          .slice(0, 5)
          .map((el) => ({
            id: el.id,
            name: el.tags.name,
            lat: el.lat ?? el.center?.lat,
            lon: el.lon ?? el.center?.lon,
          }));
        setParkings(items);
      })
      .catch(() => {})
      .finally(() => clearTimeout(tid));
    return () => { ctrl.abort(); clearTimeout(tid); };
  }, [ev]);

  useEffect(() => {
    setCityInfo(null);
    const city = ev?.venue?.city;
    if (!city) return;
    let alive = true;
    (async () => {
      for (const lang of ["it", "en"]) {
        try {
          const r = await fetch(
            `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(city)}`
          );
          if (!r.ok) continue;
          const d = await r.json();
          if (d.extract && d.type !== "disambiguation") {
            if (alive)
              setCityInfo({
                title: d.title || city,
                extract: d.extract,
                url: d.content_urls?.desktop?.page || null,
                thumb: d.thumbnail?.source || null,
              });
            return;
          }
        } catch {}
      }
    })();
    return () => { alive = false; };
  }, [ev]);

  function generateICS() {
    const v = ev.venue || {};
    const dt = ev.date ? ev.date.replace(/[-:]/g, '').replace('T', '') : '';
    const dtStr = dt ? dt.slice(0, 8) + 'T' + (ev.time ? ev.time.replace(':', '') + '00' : '200000') : '';
    const location = [v.name, v.address, v.city].filter(Boolean).join(', ');
    const ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ConcertHub//IT',
      'BEGIN:VEVENT',
      dtStr ? `DTSTART:${dtStr}` : '',
      `SUMMARY:${(ev.name || '').replace(/[,;\\]/g, ' ')}`,
      `LOCATION:${location.replace(/[,;\\]/g, ' ')}`,
      `URL:${ev.url || ''}`,
      'END:VEVENT', 'END:VCALENDAR',
    ].filter(Boolean).join('\r\n');
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${(ev.name || 'evento').replace(/[^a-z0-9]/gi, '_')}.ics`; a.click();
    URL.revokeObjectURL(url);
  }

  async function shareEvent() {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: ev.name, url }); } catch {}
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
      setShareMsg('Link copiato!');
      setTimeout(() => setShareMsg(''), 2500);
    }
  }

  async function handleFav() {
    setFavMsg("");
    const token = localStorage.getItem("token");
    if (!token) { setFavMsg("Accedi al tuo account per salvare questo evento."); return; }
    try {
      if (isFav && favId) {
        await removeFavorite(favId);
        setIsFav(false); setFavId(null);
        setFavMsg("Rimosso dai preferiti.");
      } else {
        const created = await addFavorite({
          eventId: ev.id, name: ev.name, image: ev.image,
          date: ev.date, venue: ev.venue?.name, city: ev.venue?.city, url: ev.url,
        });
        setIsFav(true); setFavId(created._id);
        setFavMsg("Aggiunto ai preferiti!");
      }
    } catch (e) {
      setFavMsg(e.message || "Errore.");
    }
  }

  function openGoogleCalendar() {
    const v = ev.venue || {};
    const dt = ev.date ? ev.date.replace(/[-:]/g, '').replace('T', '') : '';
    const start = dt ? dt.slice(0, 8) + 'T' + (ev.time ? ev.time.replace(':', '') + '00' : '200000') : '';
    const end = start ? start.slice(0, 9) + String(parseInt(start.slice(9, 11)) + 3).padStart(2, '0') + '0000' : '';
    const location = [v.name, v.address, v.city].filter(Boolean).join(', ');
    const url = `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ev.name || '')}&dates=${start}/${end}&location=${encodeURIComponent(location)}&details=${encodeURIComponent(ev.url || '')}`;
    window.open(url, '_blank');
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

        {/* TABS — scroll nav su mobile */}
        <div className="ed-tabs">
          {[["evento", "Evento"], ["artista", "Artista"], ["dove", "Dove & Come"]].map(([tab, label]) => (
            <button
              key={tab}
              type="button"
              className={`ed-tabs__btn${activeTab === tab ? " active" : ""}`}
              onClick={() => {
                setActiveTab(tab);
                document.getElementById(`section-${tab}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* SECTION: EVENTO */}
        <div id="section-evento" className="ed-section">
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
              <button type="button" className={`btn ${isFav ? "btn--fav-active" : "btn--ghost"}`} onClick={handleFav}>
                <HeartIcon size={18} filled={isFav} />
                {isFav ? "Nei preferiti" : "Salva"}
              </button>
              <button type="button" className="btn btn--ghost" onClick={shareEvent}>
                <ShareIcon size={18} />
                {shareMsg || "Condividi"}
              </button>
              <button type="button" className="btn btn--ghost" onClick={openGoogleCalendar}>
                <DownloadIcon size={18} />
                Aggiungi al calendario
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
        <div id="section-artista" className="ed-section">
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
              {spotifyArtist.topTracks?.length > 0 && (
                <ul className="ed-toptracks">
                  {spotifyArtist.topTracks.map((t, i) => (
                    <li key={t.id}>
                      <a href={t.url || spotifyArtist.externalUrl} target="_blank" rel="noreferrer" className="ed-toptracks__row">
                        <span className="ed-toptracks__n">{i + 1}</span>
                        {t.image && <img src={t.image} alt="" loading="lazy" />}
                        <span className="ed-toptracks__name">{t.name}</span>
                        {t.preview && <span className="ed-toptracks__tag">anteprima</span>}
                        <ArrowRightIcon size={13} />
                      </a>
                    </li>
                  ))}
                </ul>
              )}
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

          {setlistData?.songs?.length > 0 && (
            <div className="ed-setlist">
              <div className="ed-setlist__head">
                <h3><ListMusicIcon size={16} />Scaletta probabile</h3>
                {setlistData.event && (
                  <span className="ed-setlist__meta">
                    da {setlistData.event.venue}{setlistData.event.city ? `, ${setlistData.event.city}` : ""}
                  </span>
                )}
              </div>
              <ol className="ed-setlist__list">
                {setlistData.songs.map((s, i) => (
                  <li key={i} className={s.encore ? "encore" : ""}>
                    <span className="ed-setlist__num">{i + 1}</span>
                    <span className="ed-setlist__name">{s.name}</span>
                    {s.encore && <span className="ed-setlist__tag">encore</span>}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* SECTION: DOVE & COME */}
        <div id="section-dove" className="ed-section">
          <div className="ed-grid4">

            {/* Card 0 — Meteo del concerto */}
            {weather?.status === "ok" && (
              <div className="ed-tile">
                <div className="ed-tile__head">
                  <CloudIcon size={16} /><span>Meteo del concerto</span>
                </div>
                <div className="ed-wx">
                  <div className="ed-wx__main">
                    <span className="ed-wx__icon" aria-hidden="true">{weather.icon}</span>
                    <div>
                      <div className="ed-wx__temp">
                        {weather.tMax}° <span>/ {weather.tMin}°</span>
                      </div>
                      <div className="ed-wx__desc">{weather.desc}</div>
                    </div>
                  </div>
                  <div className="ed-wx__meta">
                    <span>💧 {weather.precip}% pioggia</span>
                    <span>💨 {weather.wind} km/h</span>
                  </div>
                </div>
              </div>
            )}

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
                      <a
                        href={r.lat ? `https://www.google.com/maps/search/?api=1&query=${r.lat},${r.lon}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.name)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="ed-tile__row"
                      >
                        <ForkIcon size={14} />
                        <span>{r.name}</span>
                        <small className="ed-tile__tag">{r.type === "fast_food" ? "fast food" : r.type}</small>
                        <ArrowRightIcon size={12} />
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Card 3b — Parcheggi */}
            {parkings.length > 0 && (
              <div className="ed-tile">
                <div className="ed-tile__head">
                  <PinIcon size={16} /><span>Dove parcheggiare</span>
                </div>
                <ul className="ed-tile__list">
                  {parkings.map((p) => (
                    <li key={p.id}>
                      <a
                        href={p.lat ? `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lon}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="ed-tile__row"
                      >
                        <PinIcon size={14} />
                        <span>{p.name}</span>
                        <ArrowRightIcon size={12} />
                      </a>
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

            {/* Card 5 — Trasporti */}
            {hasGeo && (
              <div className="ed-tile">
                <div className="ed-tile__head">
                  <GlobeIcon size={16} /><span>Come spostarsi</span>
                </div>
                <div className="ed-tile__sleep">
                  <a
                    href={`https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${v.lat}&dropoff[longitude]=${v.lon}&dropoff[nickname]=${encodeURIComponent(v.name || "Venue")}`}
                    target="_blank" rel="noreferrer" className="ed-tile__sleep-card"
                  >
                    <div className="ed-tile__sleep-icon" style={{ background: "rgba(0,0,0,0.3)" }}>
                      <span style={{ fontWeight: 800, fontSize: "0.9rem", letterSpacing: "-0.03em" }}>Ub</span>
                    </div>
                    <div>
                      <div className="ed-tile__sleep-title">Uber</div>
                      <div className="ed-tile__sleep-sub">Prenota un passaggio</div>
                    </div>
                    <ArrowRightIcon size={16} />
                  </a>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${v.lat},${v.lon}&travelmode=transit`}
                    target="_blank" rel="noreferrer" className="ed-tile__sleep-card"
                  >
                    <div className="ed-tile__sleep-icon" style={{ background: "rgba(66,133,244,0.15)" }}>
                      <span style={{ fontWeight: 800, fontSize: "0.75rem", color: "#4285f4" }}>BUS</span>
                    </div>
                    <div>
                      <div className="ed-tile__sleep-title">Trasporto pubblico</div>
                      <div className="ed-tile__sleep-sub">Indicazioni con Google Maps</div>
                    </div>
                    <ArrowRightIcon size={16} />
                  </a>
                  <a
                    href={`https://free-now.com`}
                    target="_blank" rel="noreferrer" className="ed-tile__sleep-card"
                  >
                    <div className="ed-tile__sleep-icon" style={{ background: "rgba(255,220,0,0.15)" }}>
                      <span style={{ fontWeight: 800, fontSize: "0.7rem", color: "#f5c800" }}>FREE</span>
                    </div>
                    <div>
                      <div className="ed-tile__sleep-title">FREE NOW</div>
                      <div className="ed-tile__sleep-sub">Taxi e NCC</div>
                    </div>
                    <ArrowRightIcon size={16} />
                  </a>
                </div>
              </div>
            )}

          </div>

          {cityInfo && (
            <div className="ed-card ed-cityinfo">
              <div className="ed-tile__head">
                <GlobeIcon size={16} /><span>La città: {cityInfo.title}</span>
              </div>
              <div className="ed-cityinfo__body">
                {cityInfo.thumb && (
                  <img src={cityInfo.thumb} alt={cityInfo.title} loading="lazy" />
                )}
                <div>
                  <p>{cityInfo.extract}</p>
                  {cityInfo.url && (
                    <a href={cityInfo.url} target="_blank" rel="noreferrer" className="ed-cityinfo__more">
                      Approfondisci su Wikipedia <ArrowRightIcon size={13} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="ed-plan__grid">
            <BudgetEstimate ev={ev} />
            <ConcertChecklist ev={ev} />
          </div>
        </div>

      </div>
    </section>
  );
}
