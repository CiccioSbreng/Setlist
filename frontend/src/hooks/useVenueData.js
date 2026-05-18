import { useEffect, useState } from "react";
import { getWeather } from "../lib/api";

function overpass(query, signal) {
  return fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`, { signal }).then((r) => r.json());
}

export function useVenueData(ev) {
  const [weather,     setWeather]     = useState(null);
  const [parks,       setParks]       = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [parkings,    setParkings]    = useState([]);
  const [cityInfo,    setCityInfo]    = useState(null);

  const lat  = ev?.venue?.lat;
  const lon  = ev?.venue?.lon;
  const date = ev?.date;
  const city = ev?.venue?.city;

  useEffect(() => {
    setWeather(null);
    if (lat == null || lon == null || !date) return;
    let alive = true;
    getWeather({ lat, lon, date }).then((w) => { if (alive) setWeather(w); }).catch(() => {});
    return () => { alive = false; };
  }, [lat, lon, date]);

  useEffect(() => {
    if (lat == null || lon == null) return;
    const ctrl = new AbortController();
    const tid  = setTimeout(() => ctrl.abort(), 10000);
    const q    = (query) => overpass(query, ctrl.signal);

    q(`[out:json][timeout:8];(node(around:2000,${lat},${lon})[leisure~"park|garden"][name];way(around:2000,${lat},${lon})[leisure~"park|garden"][name];);out center 5;`)
      .then((d) => setParks((d.elements || []).filter((e) => e.tags?.name).slice(0, 5).map((e) => ({ id: e.id, type: e.type, name: e.tags.name }))))
      .catch(() => {});

    q(`[out:json][timeout:10];(node(around:2000,${lat},${lon})[amenity~"restaurant|bar|cafe|fast_food|pub|pizzeria"][name];way(around:2000,${lat},${lon})[amenity~"restaurant|bar|cafe|fast_food|pub|pizzeria"][name];);out center 6;`)
      .then((d) => setRestaurants((d.elements || []).filter((e) => e.tags?.name).slice(0, 6).map((e) => ({ id: e.id, name: e.tags.name, type: e.tags.amenity, lat: e.lat ?? e.center?.lat, lon: e.lon ?? e.center?.lon }))))
      .catch(() => {});

    q(`[out:json][timeout:8];(node(around:1200,${lat},${lon})[amenity=parking][name];way(around:1200,${lat},${lon})[amenity=parking][name];);out center 5;`)
      .then((d) => setParkings((d.elements || []).filter((e) => e.tags?.name).slice(0, 5).map((e) => ({ id: e.id, name: e.tags.name, lat: e.lat ?? e.center?.lat, lon: e.lon ?? e.center?.lon }))))
      .catch(() => {});

    return () => { ctrl.abort(); clearTimeout(tid); };
  }, [lat, lon]);

  useEffect(() => {
    setCityInfo(null);
    if (!city) return;
    let alive = true;
    (async () => {
      for (const lang of ["it", "en"]) {
        try {
          const r = await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(city)}`);
          if (!r.ok) continue;
          const d = await r.json();
          if (d.extract && d.type !== "disambiguation") {
            if (alive) setCityInfo({ title: d.title || city, extract: d.extract, url: d.content_urls?.desktop?.page || null, thumb: d.thumbnail?.source || null });
            return;
          }
        } catch {}
      }
    })();
    return () => { alive = false; };
  }, [city]);

  return { weather, parks, restaurants, parkings, cityInfo };
}
