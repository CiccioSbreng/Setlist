import { useState } from "react";
import { Link } from "react-router-dom";
import { formatWhen } from "../lib/format";
import {
  ArrowRightIcon, CalendarIcon, FacebookIcon, GlobeIcon, InstagramIcon,
  ListMusicIcon, MusicIcon, SpotifyIcon, XIcon, YoutubeIcon,
} from "./Icons";

function compact(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(".0", "")}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(".0", "")}K`;
  return String(n);
}

export default function ArtistSection({ ev, artist, artistBio, spotifyArtist, ytVideos, setlistData, otherDates, spotifyLoading, ytLoading }) {
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
                {(() => {
                  const n = encodeURIComponent(artist.name);
                  const ig  = artist.links?.instagram  || `https://www.instagram.com/explore/search/keyword/?q=${n}`;
                  const tw  = artist.links?.twitter    || `https://x.com/search?q=${n}&f=user`;
                  const fb  = artist.links?.facebook   || `https://www.facebook.com/search/top?q=${n}`;
                  const web = artist.links?.homepage;
                  return (
                    <>
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
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {(spotifyLoading || ytLoading || spotifyArtist || ytVideos.length > 0) && (
        <div className="ed-media-duo">
          {(spotifyLoading || spotifyArtist) && (
            <section className="ed-block ed-block--sp">
              <div className="ed-block__head">
                <div>
                  <span className="ed-eyebrow ed-eyebrow--sp"><SpotifyIcon size={13} /> Musica</span>
                  <h3 className="ed-block__title">Ascolta {artist?.name || "l'artista"}</h3>
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

      {setlistData?.songs?.length > 0 && (
        <section className="ed-block ed-block--setlist">
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
        <section className="ed-block ed-block--dates">
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
