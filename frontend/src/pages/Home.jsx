// frontend/src/pages/Home.jsx

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  searchEvents,
  toUtcStart,
  toUtcEnd,
  addFavorite,
  getFavorites,
  removeFavorite,
} from "../lib/api";
import EventCard from "../components/EventCard";
import DateRangePopover from "../components/DateRangePopover";
import {
  SearchIcon,
  PinIcon,
  MusicIcon,
  HeartIcon,
  SparkIcon,
  TicketIcon,
  ArrowRightIcon,
  RefreshIcon,
  SpotifyIcon,
  YoutubeIcon,
} from "../components/Icons";

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=800&q=80",
];

const FEATURES = [
  {
    icon: <PinIcon size={22} />,
    title: "Concerti nella tua città",
    text: "Filtra per città e scopri in pochi secondi tutti gli show vicino a te.",
  },
  {
    icon: <MusicIcon size={22} />,
    title: "Artisti, date e venue",
    text: "Cerca per artista o genere e trova date, orari e location aggiornati.",
  },
  {
    icon: <HeartIcon size={22} />,
    title: "Salva i tuoi preferiti",
    text: "Crea la tua lista personale e tieni d'occhio gli eventi che non vuoi perdere.",
  },
  {
    icon: <SparkIcon size={22} />,
    title: "Esperienza personalizzata",
    text: "Un'interfaccia veloce e pulita, pensata per chi ama la musica live.",
  },
];

// "YYYY-MM-DD" in orario locale (niente shift da UTC)
function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function Home() {
  const [form, setForm] = useState({
    city: "",
    keyword: "",
    start: "",
    end: "",
    size: 12,
    page: 0,
  });

  const [data, setData] = useState({
    events: [],
    totalPages: 1,
    page: 0,
    totalElements: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [citySugg, setCitySugg] = useState([]);
  const [showCitySugg, setShowCitySugg] = useState(false);
  const [quickRange, setQuickRange] = useState(null);
  // eventId Ticketmaster -> _id del preferito (per toggle e cuore acceso)
  const [favMap, setFavMap] = useState({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    getFavorites()
      .then((list) => {
        const m = {};
        for (const f of list) m[f.eventId] = f._id;
        setFavMap(m);
      })
      .catch(() => {});
  }, []);

  async function toggleFavorite(ev) {
    setError("");
    setInfo("");
    const token = localStorage.getItem("token");
    if (!token) {
      setError(
        "Per salvare un evento nei preferiti devi prima accedere o registrarti."
      );
      return;
    }

    const favId = favMap[ev.id];
    if (favId) {
      try {
        await removeFavorite(favId);
        setFavMap((m) => {
          const next = { ...m };
          delete next[ev.id];
          return next;
        });
        setInfo(`"${ev.name}" rimosso dai preferiti.`);
      } catch (e) {
        setError(e.message || "Non è stato possibile rimuovere il preferito.");
      }
      return;
    }

    try {
      const created = await addFavorite({
        eventId: ev.id,
        name: ev.name,
        image: ev.image,
        date: ev.date,
        venue: ev.venue,
        city: ev.city,
        url: ev.url,
      });
      setFavMap((m) => ({ ...m, [ev.id]: created._id }));
      setInfo(`"${ev.name}" aggiunto ai preferiti.`);
    } catch (e) {
      setError(e.message || "Non è stato possibile salvare il preferito.");
    }
  }

  function update(p) {
    setForm((f) => ({ ...f, ...p }));
  }

  function applyQuickRange(id) {
    const now = new Date();
    let startDate = null;
    let endDate = null;

    if (id === "today") {
      startDate = now;
      endDate = now;
    } else if (id === "week") {
      const day = now.getDay();
      const diffToMonday = (day + 6) % 7;
      const monday = new Date(now);
      monday.setDate(now.getDate() - diffToMonday);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      startDate = monday;
      endDate = sunday;
    } else if (id === "month") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    if (!startDate || !endDate) return;

    setQuickRange(id);
    setForm((f) => ({
      ...f,
      start: formatDate(startDate),
      end: formatDate(endDate),
      page: 0,
    }));
  }

  function clearDates() {
    setQuickRange(null);
    const cleared = { ...form, start: "", end: "", page: 0 };
    setForm(cleared);
    runSearch(0, cleared);
  }

  async function runSearch(page = 0, overrideForm) {
    setLoading(true);
    setError("");
    setInfo("");

    const usedForm = overrideForm ?? { ...form, page };

    try {
      const res = await searchEvents({
        city: usedForm.city,
        keyword: usedForm.keyword,
        size: usedForm.size,
        page,
        start: toUtcStart(usedForm.start),
        end: toUtcEnd(usedForm.end),
      });

      const seen = new Set();
      const uniqueEvents = [];
      for (const ev of res.events || []) {
        if (!seen.has(ev.id)) {
          seen.add(ev.id);
          uniqueEvents.push(ev);
        }
      }

      setData({ ...res, events: uniqueEvents });
      setForm((f) => ({ ...f, page: res.page ?? page }));
    } catch {
      setError(
        "Non siamo riusciti a caricare gli eventi in questo momento. Riprova tra poco."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    runSearch(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const city = form.city.trim();
    if (city.length < 2) { setCitySugg([]); return; }
    const tid = setTimeout(() => {
      searchEvents({ city, size: 6 })
        .then((res) => {
          const cities = [...new Set((res.events || []).map((e) => e.city).filter(Boolean))].slice(0, 5);
          setCitySugg(cities);
        })
        .catch(() => {});
    }, 300);
    return () => clearTimeout(tid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.city]);

  function scrollToSearch() {
    document
      .getElementById("ricerca")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function goToPage(p) {
    await runSearch(p);
    document.getElementById("risultati")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const hasResults = data.events?.length > 0;
  const hasActiveFilters = Boolean(form.start || form.end || quickRange);
  const isShowcase =
    !form.city && !form.keyword && !form.start && !form.end && !quickRange;

  return (
    <>
      {/* ===== HERO ===== */}
      <section className="hero">
        <div className="hero__overlay" />
        <div className="hero__glow" />
        <div className="wrap hero__inner">
          <div>
            <span className="eyebrow">
              <SparkIcon size={14} /> Eventi live · powered by Ticketmaster
            </span>

            <h1 className="hero__title">
              Vivi la musica.
              <br />
              <span className="grad">Trova il tuo prossimo concerto.</span>
            </h1>

            <p className="hero__sub">
              ConcertHub raccoglie concerti ed eventi live in tutta Italia.
              Cerca per città, artista o data, scopri venue e prezzi, e salva
              gli show che non vuoi perdere.
            </p>

            <div className="hero__actions">
              <button
                type="button"
                className="btn btn--primary"
                onClick={scrollToSearch}
              >
                <SearchIcon size={18} />
                Cerca eventi
              </button>
              <Link to="/favorites" className="btn btn--ghost">
                <HeartIcon size={18} />I miei preferiti
              </Link>
            </div>

            <div className="hero__stats">
              <div className="hero__stat">
                <div className="n">Live</div>
                <div className="l">Eventi da Ticketmaster</div>
              </div>
              <div className="hero__stat">
                <div className="n">
                  <a
                    className="brand-link brand-spotify"
                    href="https://open.spotify.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <SpotifyIcon size={15} />
                    Spotify
                  </a>
                  <span className="brand-sep"> · </span>
                  <a
                    className="brand-link brand-youtube"
                    href="https://www.youtube.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <YoutubeIcon size={15} />
                    YouTube
                  </a>
                </div>
                <div className="l">Anteprime artista</div>
              </div>
              <div className="hero__stat">
                <div className="n">Mappa · Hotel</div>
                <div className="l">Pianifica la serata</div>
              </div>
            </div>
          </div>

          <div className="hero__art" aria-hidden="true">
            <div className="hero__card c1">
              <img src={HERO_IMAGES[0]} alt="" />
            </div>
            <div className="hero__card c2">
              <img src={HERO_IMAGES[1]} alt="" />
            </div>
            <div className="hero__card c3">
              <img src={HERO_IMAGES[2]} alt="" />
            </div>
          </div>
        </div>
      </section>

      {/* ===== RICERCA + RISULTATI ===== */}
      <section className="section" id="ricerca">
        <div className="wrap">
          <div className="section-head">
            <h2>Scopri concerti nella tua città</h2>
            <p>
              Affina la ricerca per città, artista o periodo. I risultati si
              aggiornano in tempo reale.
            </p>
          </div>

          <form
            className="searchbar"
            onSubmit={(e) => {
              e.preventDefault();
              runSearch(0);
            }}
          >
            <div className="sb-bar">
              <label className="sb-seg sb-seg--autocomplete" htmlFor="city">
                <PinIcon size={20} className="sb-seg__ic" />
                <input
                  id="city"
                  className="sb-seg__input"
                  placeholder="In quale città?"
                  value={form.city}
                  autoComplete="off"
                  onChange={(e) => { update({ city: e.target.value }); setShowCitySugg(true); }}
                  onFocus={() => setShowCitySugg(true)}
                  onBlur={() => setTimeout(() => setShowCitySugg(false), 150)}
                />
                {showCitySugg && citySugg.length > 0 && (
                  <ul className="sb-sugg">
                    {citySugg.map((c) => (
                      <li key={c}>
                        <button type="button" onMouseDown={() => { update({ city: c }); setShowCitySugg(false); runSearch(0, { ...form, city: c, page: 0 }); }}>
                          <PinIcon size={14} />{c}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </label>

              <span className="sb-div" aria-hidden="true" />

              <label className="sb-seg" htmlFor="keyword">
                <MusicIcon size={20} className="sb-seg__ic" />
                <input
                  id="keyword"
                  className="sb-seg__input"
                  placeholder="Artista, band o genere"
                  value={form.keyword}
                  onChange={(e) => update({ keyword: e.target.value })}
                />
              </label>

              <button type="submit" className="sb-go">
                <SearchIcon size={18} />
                <span>Cerca</span>
              </button>
            </div>

            <div className="sb-tools">
              <div className="chips" role="group" aria-label="Quando">
                {[
                  { id: "today", label: "Oggi" },
                  { id: "week", label: "Questa settimana" },
                  { id: "month", label: "Questo mese" },
                ].map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    className={
                      "chip" + (quickRange === q.id ? " is-active" : "")
                    }
                    onClick={() => applyQuickRange(q.id)}
                  >
                    {q.label}
                  </button>
                ))}

                <DateRangePopover
                  start={form.start}
                  end={form.end}
                  onChange={({ start, end }) => {
                    setQuickRange(null);
                    update({ start, end });
                  }}
                  onClear={() => {
                    setQuickRange(null);
                    update({ start: "", end: "" });
                  }}
                />
              </div>

              {hasActiveFilters && (
                <button
                  type="button"
                  className="sb-reset"
                  onClick={clearDates}
                >
                  <RefreshIcon size={15} />
                  Azzera
                </button>
              )}
            </div>
          </form>

          {/* messaggi */}
          {error && (
            <div className="banner banner--error" style={{ marginTop: 24 }}>
              {error}
            </div>
          )}
          {info && !error && (
            <div className="banner banner--ok" style={{ marginTop: 24 }}>
              {info}
            </div>
          )}

          {/* risultati */}
          <div id="risultati" style={{ marginTop: 36 }}>
            {!loading && hasResults && (
              <div className="results-bar">
                <h2>{isShowcase ? "Prossimi concerti in Italia" : "Eventi trovati"}</h2>
                <span className="count">
                  {data.totalElements ?? data.events.length} risultati
                </span>
              </div>
            )}

            {loading && (
              <div className="events-grid">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div className="sk-card" key={i}>
                    <div className="sk sk--media" />
                    <div className="sk sk--line w70" />
                    <div className="sk sk--line w45" />
                    <div
                      className="sk sk--line"
                      style={{ marginBottom: 18 }}
                    />
                  </div>
                ))}
              </div>
            )}

            {!loading && !error && !hasResults && (
              <div className="state">
                <div className="state__icon">
                  <SearchIcon size={30} />
                </div>
                {(form.city || form.keyword || form.start || form.end) ? (
                  <>
                    <h3>Nessun evento trovato</h3>
                    <p>Prova a cambiare città, periodo o parola chiave.</p>
                    <button type="button" className="btn btn--ghost" onClick={clearDates}>
                      <RefreshIcon size={18} />Azzera filtri
                    </button>
                  </>
                ) : (
                  <>
                    <h3>Cerca il tuo prossimo concerto</h3>
                    <p>Inserisci una città o il nome di un artista per iniziare.</p>
                  </>
                )}
              </div>
            )}

            {!loading && hasResults && (
              <div className="events-grid">
                {data.events.map((ev) => (
                  <EventCard
                    key={ev.id}
                    ev={ev}
                    favorited={Boolean(favMap[ev.id])}
                    onToggleFavorite={() => toggleFavorite(ev)}
                  />
                ))}
              </div>
            )}

            {!loading && hasResults && data.totalPages > 1 && (
              <div className="pager">
                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  disabled={form.page <= 0}
                  onClick={() => goToPage(form.page - 1)}
                >
                  ← Precedente
                </button>
                <span className="pager__info">
                  Pagina {form.page + 1} di {data.totalPages || 1}
                </span>
                <button
                  type="button"
                  className="btn btn--outline btn--sm"
                  disabled={form.page + 1 >= (data.totalPages || 1)}
                  onClick={() => goToPage(form.page + 1)}
                >
                  Successiva →
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===== PERCHÉ CONCERTHUB ===== */}
      <section className="section" id="why">
        <div className="wrap">
          <div className="section-head">
            <h2>Perché usare ConcertHub</h2>
            <p>
              Tutto quello che ti serve per non perderti più un concerto, in un
              unico posto.
            </p>
          </div>

          <div className="features">
            {FEATURES.map((f) => (
              <div className="feature" key={f.title}>
                <div className="feature__icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CALL TO ACTION ===== */}
      <section className="section" id="how">
        <div className="wrap">
          <div className="cta-band">
            <div className="cta-band__text">
              <h2>Crea il tuo account e salva i tuoi eventi</h2>
              <p>
                Registrati gratuitamente per costruire la tua lista di concerti
                preferiti e ritrovarli su qualsiasi dispositivo.
              </p>
            </div>
            <Link to="/login" className="btn btn--primary">
              <TicketIcon size={18} />
              Inizia ora
              <ArrowRightIcon size={18} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
