import { useState } from "react";
import { Link } from "react-router-dom";
import { formatWhen } from "../lib/format";
import {
  ArrowRightIcon, CalendarIcon, GlobeIcon, InstagramIcon,
  ListMusicIcon, MusicIcon, SpotifyIcon, YoutubeIcon,
} from "./Icons";

export default function ArtistSection({ ev, artist, artistBio, spotifyArtist, ytVideos, setlistData, otherDates }) {
  const [bioExpanded, setBioExpanded] = useState(false);

  return (
    <div id="section-artista" className="ed-section">
      {artist && (
        <div className="ed-artist">
          {artist.image && <img className="ed-artist__img" src={artist.image} alt={artist.name} loading="lazy" />}
          <div className="ed-artist__body">
            <span className="eyebrow"><MusicIcon size={14} /> Artista</span>
            <h2>{artist.name}</h2>
            {artist.genre && <p className="ed-artist__genre">{artist.genre}</p>}
            {artistBio && (
              <>
                <p className={`ed-artist__bio${bioExpanded ? " ed-artist__bio--expanded" : ""}`}>{artistBio}</p>
                <button type="button" className="ed-artist__bio-toggle" onClick={() => setBioExpanded((v) => !v)}>
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
              {spotifyArtist.genres?.length > 0 && (
                <div className="ed-spotify__genres">
                  {spotifyArtist.genres.map((g) => <span key={g} className="tag tag--sm">{g}</span>)}
                </div>
              )}
              {spotifyArtist.followers > 0 && (
                <span className="ed-spotify__followers">{spotifyArtist.followers.toLocaleString("it-IT")} follower</span>
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

      {otherDates.length > 0 && (
        <div className="ed-dates">
          <h2>Prossime date{artist?.name ? ` di ${artist.name}` : ""}</h2>
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
        </div>
      )}
    </div>
  );
}
