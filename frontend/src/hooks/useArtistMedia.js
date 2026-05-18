import { useEffect, useState } from "react";
import { getArtistEvents, getYoutubeVideos, getSpotifyArtist, getSetlist } from "../lib/api";

export function useArtistMedia(ev) {
  const [otherDates, setOtherDates] = useState([]);
  const [ytVideos, setYtVideos] = useState([]);
  const [spotifyArtist, setSpotifyArtist] = useState(null);
  const [artistBio, setArtistBio] = useState("");
  const [setlistData, setSetlistData] = useState(null);

  const artistId   = ev?.artists?.[0]?.id;
  const artistName = ev?.artists?.[0]?.name;
  const eventId    = ev?.id;

  useEffect(() => {
    if (!artistId) return;
    let alive = true;
    getArtistEvents(artistId)
      .then((res) => {
        if (alive) setOtherDates((res.events || []).filter((e) => e.id !== eventId).slice(0, 6));
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [artistId, eventId]);

  useEffect(() => {
    if (!artistName) return;
    let alive = true;

    getYoutubeVideos(artistName).then((d) => { if (alive) setYtVideos(d.videos || []); }).catch(() => {});
    getSpotifyArtist(artistName).then((d) => { if (alive) setSpotifyArtist(d); }).catch(() => {});
    getSetlist(artistName).then((d) => { if (alive) setSetlistData(d); }).catch(() => {});

    (async () => {
      for (const lang of ["it", "en"]) {
        try {
          const r = await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(artistName)}`);
          if (!r.ok) continue;
          const d = await r.json();
          if (d.extract && d.type !== "disambiguation") { if (alive) setArtistBio(d.extract); return; }
        } catch {}
      }
    })();

    return () => { alive = false; };
  }, [artistName]);

  return { otherDates, ytVideos, spotifyArtist, artistBio, setlistData };
}
