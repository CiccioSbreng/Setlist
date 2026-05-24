import { Link } from "react-router-dom";
import { useHomeSearch } from "../hooks/useHomeSearch";
import EventCard from "../components/EventCard";
import DateRangePopover from "../components/DateRangePopover";
import { Stagger, StaggerItem } from "../components/Motion";
import {
  SearchIcon, PinIcon, MusicIcon, HeartIcon, SparkIcon,
  TicketIcon, ArrowRightIcon, RefreshIcon, CloseIcon, SpotifyIcon, YoutubeIcon,
} from "../components/Icons";

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=800&q=80",
];

const FEATURES = [
  { icon: <PinIcon size={22} />, title: "Concerti nella tua città", text: "Filtra per città e scopri in pochi secondi tutti gli show vicino a te." },
  { icon: <MusicIcon size={22} />, title: "Artisti, date e venue", text: "Cerca per artista o genere e trova date, orari e location aggiornati." },
  { icon: <HeartIcon size={22} />, title: "Salva i tuoi preferiti", text: "Crea la tua lista personale e tieni d'occhio gli eventi che non vuoi perdere." },
  { icon: <SparkIcon size={22} />, title: "Esperienza personalizzata", text: "Un'interfaccia veloce e pulita, pensata per chi ama la musica live." },
];

export default function Home() {
  const {
    form, update, data, loading, error,
    citySugg, showCitySugg, setShowCitySugg,
    quickRange, applyQuickRange, applyGenre, clearDates, clearSearch,
    runSearch, goToPage, scrollToSearch,
    favMap, toggleFavorite,
    hasResults, hasActiveFilters, hasSearch, isShowcase,
  } = useHomeSearch();


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
              <button type="button" className="btn btn--primary" onClick={scrollToSearch}>
                <SearchIcon size={18} />Cerca eventi
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
                  <a className="brand-link brand-spotify" href="https://open.spotify.com" target="_blank" rel="noopener noreferrer">
                    <SpotifyIcon size={15} />Spotify
                  </a>
                  <span className="brand-sep"> · </span>
                  <a className="brand-link brand-youtube" href="https://www.youtube.com" target="_blank" rel="noopener noreferrer">
                    <YoutubeIcon size={15} />YouTube
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
            <div className="hero__card c1"><img src={HERO_IMAGES[0]} alt="" /></div>
            <div className="hero__card c2"><img src={HERO_IMAGES[1]} alt="" /></div>
            <div className="hero__card c3"><img src={HERO_IMAGES[2]} alt="" /></div>
          </div>
        </div>
      </section>

      {/* ===== RICERCA + RISULTATI ===== */}
      <section className="section" id="ricerca">
        <div className="wrap">
          <div className="section-head">
            <h2>Scopri concerti nella tua città</h2>
            <p>Affina la ricerca per città, artista o periodo. I risultati si aggiornano in tempo reale.</p>
          </div>

          <form className="searchbar" onSubmit={(e) => { e.preventDefault(); runSearch(0); }}>
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
                <SearchIcon size={18} /><span>Cerca</span>
              </button>
            </div>

            <div className="sb-tools">
              <div className="chips" role="group" aria-label="Quando">
                {[{ id: "today", label: "Oggi" }, { id: "week", label: "Questa settimana" }, { id: "month", label: "Questo mese" }].map((q) => (
                  <button key={q.id} type="button" className={"chip" + (quickRange === q.id ? " is-active" : "")} onClick={() => applyQuickRange(q.id)}>
                    {q.label}
                  </button>
                ))}
                <DateRangePopover
                  start={form.start}
                  end={form.end}
                  onChange={({ start, end }) => { update({ start, end }); }}
                  onClear={() => update({ start: "", end: "" })}
                />
              </div>
              {hasSearch && (
                <button type="button" className="sb-reset" onClick={clearSearch}>
                  <CloseIcon size={15} />Azzera tutto
                </button>
              )}
            </div>
          </form>

          {error && <div className="banner banner--error" style={{ marginTop: 24 }}>{error}</div>}

          <div id="risultati" style={{ marginTop: 36 }}>
            {!loading && hasResults && (
              <div className="results-bar">
                <h2>{isShowcase ? "Prossimi concerti in Italia" : "Eventi trovati"}</h2>
                <span className="count">{data.totalElements ?? data.events.length} risultati</span>
              </div>
            )}

            {loading && (
              <div className="events-grid">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div className="sk-card" key={i}>
                    <div className="sk sk--media" />
                    <div className="sk sk--line w70" />
                    <div className="sk sk--line w45" />
                    <div className="sk sk--line" style={{ marginBottom: 18 }} />
                  </div>
                ))}
              </div>
            )}

            {!loading && !error && !hasResults && (
              <div className="state">
                <div className="state__icon"><SearchIcon size={30} /></div>
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
              <Stagger className="events-grid" key={data.page}>
                {data.events.map((ev) => (
                  <StaggerItem key={ev.id}>
                    <EventCard ev={ev} favorited={Boolean(favMap[ev.id])} onToggleFavorite={() => toggleFavorite(ev)} />
                  </StaggerItem>
                ))}
              </Stagger>
            )}

            {!loading && hasResults && data.totalPages > 1 && (
              <div className="pager">
                <button type="button" className="btn btn--outline btn--sm" disabled={form.page <= 0} onClick={() => goToPage(form.page - 1)}>
                  ← Precedente
                </button>
                <span className="pager__info">Pagina {form.page + 1} di {data.totalPages || 1}</span>
                <button type="button" className="btn btn--outline btn--sm" disabled={form.page + 1 >= (data.totalPages || 1)} onClick={() => goToPage(form.page + 1)}>
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
            <p>Tutto quello che ti serve per non perderti più un concerto, in un unico posto.</p>
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
              <p>Registrati gratuitamente per costruire la tua lista di concerti preferiti e ritrovarli su qualsiasi dispositivo.</p>
            </div>
            <Link to="/login" className="btn btn--primary">
              <TicketIcon size={18} />Inizia ora<ArrowRightIcon size={18} />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
