import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useArtistMedia } from "../hooks/useArtistMedia";
import { getArtistEvents } from "../lib/api";
import { formatWhen, formatPrice, compactNumber } from "../lib/format";
import {
  ArrowRightIcon, CalendarIcon, FacebookIcon, GlobeIcon, InstagramIcon,
  ListMusicIcon, MusicIcon, PinIcon, SearchIcon, SpotifyIcon,
  TicketIcon, XIcon, YoutubeIcon,
} from "../components/Icons";


function ArtistSkeleton() {
  return (
    <section className="section">
      <div className="wrap">
        <div className="sk" style={{ height: 320, borderRadius: 20, marginBottom: 24 }} />
        <div className="sk sk--line w45" style={{ marginBottom: 12 }} />
        <div className="sk sk--line w70" />
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
          <h3>Artista non trovato</h3>
          <p>Non abbiamo trovato informazioni per questo artista.</p>
          <Link to="/home" className="btn btn--primary">Torna agli eventi</Link>
        </div>
      </div>
    </section>
  );
}

export default function ArtistPage() {
  const { id } = useParams();
  const [events,   setEvents]   = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    setNotFound(false);
    getArtistEvents(id)
      .then((res) => {
        if (!res.events?.length) { setNotFound(true); return; }
        setEvents(res.events);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const artist = events[0]?.artists?.find((a) => a.id === id) ?? events[0]?.artists?.[0] ?? null;

  // synthetic ev object so useArtistMedia can reuse its logic
  const syntheticEv = useMemo(
    () => (artist ? { id: "__artist_page__", artists: [artist] } : null),
    [artist]
  );

  const { ytVideos, spotifyArtist, artistBio, setlistData, spotifyLoading, ytLoading } =
    useArtistMedia(syntheticEv);

  if (loading)  return <ArtistSkeleton />;
  if (notFound || !artist) return <NotFoundState />;

  const bioTrimmed = artistBio?.slice(0, 600);
  const bioLong    = artistBio?.length > 600;
  const n = encodeURIComponent(artist.name);
  const ig  = artist.links?.instagram || `https://www.instagram.com/explore/search/keyword/?q=${n}`;
  const tw  = artist.links?.twitter   || `https://x.com/search?q=${n}&f=user`;
  const fb  = artist.links?.facebook  || `https://www.facebook.com/search/top?q=${n}`;
  const web = artist.links?.homepage;

  return (
    <section className="section">
      <div className="wrap">
        <Link to="/home" className="ed-back">← Tutti gli eventi</Link>

        {/* ── HERO ARTISTA ── */}
        <div className="ed-aphero ed-aphero--page">
          {artist.image && (
            <div className="ed-aphero__bg" style={{ backgroundImage: `url(${artist.image})` }} aria-hidden="true" />
          )}
          <div className="ed-aphero__inner">
            {artist.image && (
              <img className="ed-aphero__photo ed-aphero__photo--lg" src={artist.image} alt={artist.name} />
            )}
            <div className="ed-aphero__body">
              <span className="ed-eyebrow"><MusicIcon size={13} /> Artista</span>
              <h1 className="ed-aphero__name">{artist.name}</h1>
              {artist.genre && <p className="ed-aphero__genre">{artist.genre}</p>}

              {spotifyArtist && (spotifyArtist.followers > 0 || spotifyArtist.genres?.length > 0) && (
                <div className="ed-stats">
                  {spotifyArtist.followers > 0 && (
                    <div className="ed-stat">
                      <b>{compactNumber(spotifyArtist.followers)}</b>
                      <span>follower Spotify</span>
                    </div>
                  )}
                  {spotifyArtist.genres?.[0] && (
                    <div className="ed-stat">
                      <b>{spotifyArtist.genres[0]}</b>
                      <span>genere</span>
                    </div>
                  )}
                </div>
              )}

              <div className="ed-aphero__links">
                <a href={ig} target="_blank" rel="noreferrer" className="ed-chip ed-chip--ig">
                  <InstagramIcon size={15} />Instagram
                </a>
                <a href={tw} target="_blank" rel="noreferrer" className="ed-chip ed-chip--x">
                  <XIcon size={15} />X
                </a>
                <a href={fb} target="_blank" rel="noreferrer" className="ed-chip ed-chip--fb">
                  <FacebookIcon size={15} />Facebook
                </a>
                {web && (
                  <a href={web} target="_blank" rel="noreferrer" className="ed-chip">
                    <GlobeIcon size={15} />Sito ufficiale
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="ed-section ed-stack">

          {/* ── BIO ── */}
          {artistBio && (
            <section className="ed-block">
              <div className="ed-block__head">
                <div>
                  <span className="ed-eyebrow"><MusicIcon size={13} /> Biografia</span>
                  <h2 className="ed-block__title">Chi è {artist.name}</h2>
                </div>
              </div>
              <p className="ed-bio__text">
                {bioExpanded || !bioLong ? artistBio : `${bioTrimmed}…`}
              </p>
              {bioLong && (
                <button className="ed-bio__toggle" onClick={() => setBioExpanded((v) => !v)}>
                  {bioExpanded ? "Riduci ▲" : "Leggi di più ▼"}
                </button>
              )}
            </section>
          )}

          {/* ── MEDIA: Spotify + YouTube ── */}
          {(spotifyLoading || ytLoading || spotifyArtist || ytVideos.length > 0) && (
            <div className="ed-media-duo">
              {(spotifyLoading || spotifyArtist) && (
                <section className="ed-block ed-block--sp">
                  <div className="ed-block__head">
                    <div>
                      <span className="ed-eyebrow ed-eyebrow--sp"><SpotifyIcon size={13} /> Musica</span>
                      <h3 className="ed-block__title">Ascolta {artist.name}</h3>
                    </div>
                    {spotifyArtist?.externalUrl && (
                      <a href={spotifyArtist.externalUrl} target="_blank" rel="noreferrer" className="ed-block__cta ed-block__cta--sp">
                        <SpotifyIcon size={14} />Apri su Spotify<ArrowRightIcon size={14} />
                      </a>
                    )}
                  </div>
                  <div className="ed-sp__box">
                    {spotifyLoading && !spotifyArtist
                      ? <div className="sk" style={{ height: "100%" }} />
                      : (
                        <iframe
                          className="ed-sp__frame"
                          title="Player Spotify"
                          src={spotifyArtist.embedUrl}
                          width="100%"
                          height="450"
                          loading="lazy"
                          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        />
                      )
                    }
                  </div>
                </section>
              )}

              {(ytLoading || ytVideos.length > 0) && (
                <section className="ed-block ed-block--yt">
                  <div className="ed-block__head">
                    <div>
                      <span className="ed-eyebrow ed-eyebrow--yt"><YoutubeIcon size={13} /> Video</span>
                      <h3 className="ed-block__title">Ultimo video</h3>
                    </div>
                    {ytVideos.length > 0 && (
                      <a href={`https://www.youtube.com/watch?v=${ytVideos[0].id}`} target="_blank" rel="noreferrer" className="ed-block__cta ed-block__cta--yt">
                        <YoutubeIcon size={14} />Apri su YouTube<ArrowRightIcon size={14} />
                      </a>
                    )}
                  </div>
                  <div className="ed-video">
                    {ytLoading && ytVideos.length === 0
                      ? <div className="sk" style={{ position: "absolute", inset: 0 }} />
                      : (
                        <iframe
                          src={`https://www.youtube.com/embed/${ytVideos[0].id}`}
                          title={ytVideos[0].title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      )
                    }
                  </div>
                </section>
              )}
            </div>
          )}

          {/* ── TUTTE LE DATE ── */}
          {events.length > 0 && (
            <section className="ed-block ed-block--dates">
              <div className="ed-block__head">
                <div>
                  <span className="ed-eyebrow"><CalendarIcon size={13} /> Tour</span>
                  <h2 className="ed-block__title">Prossimi concerti di {artist.name}</h2>
                </div>
              </div>
              <ul className="ed-dates__list">
                {events.map((ev) => {
                  const w     = formatWhen(ev.date, ev.time);
                  const price = formatPrice(ev.priceMin, ev.priceMax, ev.currency);
                  const v     = ev.venue || {};
                  return (
                    <li key={ev.id}>
                      <Link to={`/event/${ev.id}`} className="ed-dates__row ed-dates__row--full">
                        <span className="ed-dates__when">
                          <CalendarIcon size={15} />
                          <span>{w.dateLabel}</span>
                        </span>
                        <span className="ed-dates__where">
                          <PinIcon size={14} />
                          {[v.name, v.city].filter(Boolean).join(" · ") || "Location da annunciare"}
                        </span>
                        {price && <span className="ed-dates__price"><TicketIcon size={13} />{price}</span>}
                        <ArrowRightIcon size={15} />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* ── SCALETTA ── */}
          {setlistData?.songs?.length > 0 && (
            <section className="ed-block ed-block--setlist">
              <div className="ed-block__head">
                <div>
                  <span className="ed-eyebrow"><ListMusicIcon size={13} /> Scaletta</span>
                  <h2 className="ed-block__title">Cosa potrebbe suonare</h2>
                </div>
                {setlistData.event && (
                  <span className="ed-block__meta">
                    ultimo live: {setlistData.event.venue}
                    {setlistData.event.city ? `, ${setlistData.event.city}` : ""}
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
            </section>
          )}

        </div>
      </div>
    </section>
  );
}
