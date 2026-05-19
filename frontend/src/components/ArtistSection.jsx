import { useState } from "react";
import { Link } from "react-router-dom";
import { formatWhen } from "../lib/format";
import {
  ArrowRightIcon, CalendarIcon, GlobeIcon, InstagramIcon,
  ListMusicIcon, MusicIcon, SpotifyIcon, YoutubeIcon,
} from "./Icons";

function compact(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".0", "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(".0", "")}K`;
  return String(n);
}

export default function ArtistSection({ ev, artist, artistBio, spotifyArtist, ytVideos, setlistData, otherDates }) {
  const [bioExpanded, setBioExpanded] = useState(false);

  return (
    <div id="section-artista" className="ed-section ed-stack">
      {artist && (
        <div className="ed-aphero">
          {artist.image && (
            <div className="ed-aphero__bg" style={{ backgroundImage: `url(${artist.image})` }} aria-hidden="true" />
          )}
          <div className="ed-aphero__inner">
            {artist.image && (
              <img className="ed-aphero__photo" src={artist.image} alt={artist.name} loading="lazy" />
            )}
            <div className="ed-aphero__body">
              <span className="ed-eyebrow"><MusicIcon size={13} /> Artista</span>
              <h2 className="ed-aphero__name">{artist.name}</h2>
              {artist.genre && <p className="ed-aphero__genre">{artist.genre}</p>}

              {spotifyArtist && (spotifyArtist.followers > 0 || spotifyArtist.genres?.length > 0) && (
                <div className="ed-stats">
                  {spotifyArtist.followers > 0 && (
                    <div className="ed-stat">
                      <b>{compact(spotifyArtist.followers)}</b>
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

              {artistBio && (
                <>
                  <p className={`ed-aphero__bio${bioExpanded ? " is-open" : ""}`}>{artistBio}</p>
                  <button type="button" className="ed-link-btn" onClick={() => setBioExpanded((v) => !v)}>
                    {bioExpanded ? "Riduci ▲" : "Leggi di più ▼"}
                  </button>
                </>
              )}

              <div className="ed-aphero__links">
                {artist.links?.instagram && (
                  <a href={artist.links.instagram} target="_blank" rel="noreferrer" className="ed-chip ed-chip--ig">
                    <InstagramIcon size={15} />Instagram
                  </a>
                )}
                {artist.links?.homepage && (
                  <a href={artist.links.homepage} target="_blank" rel="noreferrer" className="ed-chip">
                    <GlobeIcon size={15} />Sito ufficiale
                  </a>
                )}
                {artist.links?.twitter && (
                  <a href={artist.links.twitter} target="_blank" rel="noreferrer" className="ed-chip">Twitter / X</a>
                )}
                {artist.links?.facebook && (
                  <a href={artist.links.facebook} target="_blank" rel="noreferrer" className="ed-chip">Facebook</a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {spotifyArtist && (
        <section className="ed-block">
          <div className="ed-block__head">
            <div>
              <span className="ed-eyebrow ed-eyebrow--sp"><SpotifyIcon size={13} /> Musica</span>
              <h3 className="ed-block__title">Ascolta {artist?.name || "l'artista"}</h3>
            </div>
            {spotifyArtist.externalUrl && (
              <a href={spotifyArtist.externalUrl} target="_blank" rel="noreferrer" className="ed-block__cta ed-block__cta--sp">
                <SpotifyIcon size={14} />Apri su Spotify<ArrowRightIcon size={14} />
              </a>
            )}
          </div>
          <div className="ed-video" style={{ maxHeight: 400 }}>
            <iframe
              title="Player Spotify"
              src={spotifyArtist.embedUrl}
              loading="lazy"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
            />
          </div>
        </section>
      )}

      {ytVideos.length > 0 && (
        <section className="ed-block">
          <div className="ed-block__head">
            <div>
              <span className="ed-eyebrow ed-eyebrow--yt"><YoutubeIcon size={13} /> Video</span>
              <h3 className="ed-block__title">Ultimo video</h3>
            </div>
            <a href={`https://www.youtube.com/watch?v=${ytVideos[0].id}`} target="_blank" rel="noreferrer" className="ed-block__cta ed-block__cta--yt">
              <YoutubeIcon size={14} />Apri su YouTube<ArrowRightIcon size={14} />
            </a>
          </div>
          <div className="ed-video">
            <iframe
              src={`https://www.youtube.com/embed/${ytVideos[0].id}`}
              title={ytVideos[0].title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </section>
      )}

      {setlistData?.songs?.length > 0 && (
        <section className="ed-block">
          <div className="ed-block__head">
            <div>
              <span className="ed-eyebrow"><ListMusicIcon size={13} /> Scaletta</span>
              <h3 className="ed-block__title">Cosa potrebbe suonare</h3>
            </div>
            {setlistData.event && (
              <span className="ed-block__meta">
                ultimo live: {setlistData.event.venue}{setlistData.event.city ? `, ${setlistData.event.city}` : ""}
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

      {otherDates.length > 0 && (
        <section className="ed-block">
          <div className="ed-block__head">
            <div>
              <span className="ed-eyebrow"><CalendarIcon size={13} /> Tour</span>
              <h3 className="ed-block__title">Prossime date{artist?.name ? ` di ${artist.name}` : ""}</h3>
            </div>
          </div>
          <ul className="ed-dates__list">
            {otherDates.map((e) => {
              const w = formatWhen(e.date, e.time);
              return (
                <li key={e.id}>
                  <Link to={`/event/${e.id}`} className="ed-dates__row">
                    <span className="ed-dates__when"><CalendarIcon size={16} />{w.dateLabel}</span>
                    <span className="ed-dates__where">{[e.venue, e.city].filter(Boolean).join(" · ") || "Location da annunciare"}</span>
                    <ArrowRightIcon size={16} />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
