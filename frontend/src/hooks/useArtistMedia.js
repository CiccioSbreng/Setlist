import { useEffect, useState } from "react";
import { getArtistEvents, getYoutubeVideos, getSpotifyArtist, getSetlist } from "../lib/api";

export function useArtistMedia(ev) {
  const [otherDates,     setOtherDates]     = useState([]);
  const [ytVideos,       setYtVideos]       = useState([]);
  const [spotifyArtist,  setSpotifyArtist]  = useState(null);
  const [artistBio,      setArtistBio]      = useState("");
  const [setlistData,    setSetlistData]    = useState(null);
  const [spotifyLoading, setSpotifyLoading] = useState(false);
  const [ytLoading,      setYtLoading]      = useState(false);
  const [ytError,        setYtError]        = useState(false);

  const artistId   = ev?.artists?.[0]?.id;
  const artistName = ev?.artists?.[0]?.name;
  const eventId    = ev?.id;

  useEffect(() => {
    if (!artistId) return;
    const ctrl = new AbortController();
    getArtistEvents(artistId, ctrl.signal)
      .then((res) => {
        setOtherDates((res.events || []).filter((e) => e.id !== eventId).slice(0, 6));
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [artistId, eventId]);

  useEffect(() => {
    if (!artistName) return;
    const ctrl = new AbortController();
    const { signal } = ctrl;

    setSpotifyLoading(true);
    setYtLoading(true);
    setYtError(false);

    getYoutubeVideos(artistName, signal)
      .then((d) => { setYtVideos(d.videos || []); setYtLoading(false); })
      .catch((e) => { if (e.name !== "AbortError") { setYtLoading(false); setYtError(true); } });

    getSpotifyArtist(artistName, signal)
      .then((d) => { setSpotifyArtist(d); setSpotifyLoading(false); })
      .catch((e) => { if (e.name !== "AbortError") setSpotifyLoading(false); });

    getSetlist(artistName, signal)
      .then((d) => { setSetlistData(d); })
      .catch(() => {});

    (async () => {
      for (const lang of ["it", "en"]) {
        try {
          const url = `https://${lang}.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=true&explaintext=true&redirects=1&titles=${encodeURIComponent(artistName)}&format=json&origin=*`;
          const r = await fetch(url, { signal });
          if (!r.ok) continue;
          const d = await r.json();
          const pages = Object.values(d.query?.pages || {});
          const page = pages.find((p) => p.extract && !p.missing);
          if (page?.extract) { setArtistBio(page.extract.trim()); return; }
        } catch {}
      }
    })();

    return () => ctrl.abort();
  }, [artistName]);

  return { otherDates, ytVideos, spotifyArtist, artistBio, setlistData, spotifyLoading, ytLoading, ytError };
}
