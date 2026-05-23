import { useEffect, useState } from "react";
import { getWeather } from "../lib/api";

function overpass(query, signal) {
  return fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`, { signal }).then((r) => r.json());
}

export function useVenueData(ev) {
  const [weather,        setWeather]        = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [parks,          setParks]          = useState([]);
  const [restaurants,    setRestaurants]    = useState([]);
  const [parkings,       setParkings]       = useState([]);
  const [cityInfo,       setCityInfo]       = useState(null);

  const lat  = ev?.venue?.lat;
  const lon  = ev?.venue?.lon;
  const date = ev?.date;
  const city = ev?.venue?.city;

  useEffect(() => {
    setWeather(null);
    setWeatherLoading(false);
    if (lat == null || lon == null || !date) return;
    const ctrl = new AbortController();
    setWeatherLoading(true);
    getWeather({ lat, lon, date }, ctrl.signal)
      .then((w) => { setWeather(w); setWeatherLoading(false); })
      .catch((e) => { if (e.name !== "AbortError") setWeatherLoading(false); });
    return () => ctrl.abort();
  }, [lat, lon, date]);

  useEffect(() => {
    if (lat == null || lon == null) return;
    const ctrl = new AbortController();
    const tid  = setTimeout(() => ctrl.abort(), 10000);
    const q    = (query) => overpass(query, ctrl.signal);

    q(`[out:json][timeout:8];(node(around:2000,${lat},${lon})[leisure~"park|garden"][name];way(around:2000,${lat},${lon})[leisure~"park|garden"][name];);out center 5;`)
      .then((d) => setParks((d.elements || []).filter((e) => e.tags?.name).slice(0, 5).map((e) => ({ id: e.id, type: e.type, name: e.tags.name }))))
      .catch(() => {});

    // Ristoranti: niente brand tag E niente catene note per nome
    const CHAIN_RE = /autogrill|mcdonald|burger\s*king|kfc|subway|starbucks|old wild west|roadhouse|spizzico|pizza hut|domino|chef express/i;
    const PARKING_NOISE_RE = /lidl|esselunga|carrefour|conad|coop|ikea|leroy|decathlon|mediaworld|auchan|penny|eurospin|tigr[oò]/i;

    q(`[out:json][timeout:10];(node(around:2000,${lat},${lon})[amenity~"restaurant|pizzeria|pub"][name];way(around:2000,${lat},${lon})[amenity~"restaurant|pizzeria|pub"][name];);out center 8;`)
      .then((d) => {
        const all = (d.elements || []).filter((e) => e.tags?.name && !CHAIN_RE.test(e.tags.name));
        // se dopo il filtro catene è vuoto, mostra i risultati grezzi senza brand=yes
        const fallback = all.length === 0
          ? (d.elements || []).filter((e) => e.tags?.name).slice(0, 6)
          : all.slice(0, 6);
        setRestaurants(fallback.map((e) => ({ id: e.id, name: e.tags.name, type: e.tags.amenity, lat: e.lat ?? e.center?.lat, lon: e.lon ?? e.center?.lon })));
      })
      .catch(() => {});

    q(`[out:json][timeout:8];(node(around:1500,${lat},${lon})[amenity=parking];way(around:1500,${lat},${lon})[amenity=parking];);out center 8;`)
      .then((d) => {
        const named = (d.elements || []).filter((e) => e.tags?.name && !PARKING_NOISE_RE.test(e.tags.name));
        // se non ci sono parcheggi con nome "pulito", prende anche quelli senza nome con access=yes o fee
        const list = named.length > 0 ? named : (d.elements || []).filter((e) => !PARKING_NOISE_RE.test(e.tags?.name ?? ""));
        setParkings(
          list.slice(0, 5).map((e) => ({
            id: e.id,
            name: e.tags?.name || (e.tags?.fee === "yes" ? "Parcheggio a pagamento" : "Parcheggio"),
            lat: e.lat ?? e.center?.lat,
            lon: e.lon ?? e.center?.lon,
          }))
        );
      })
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

  return { weather, weatherLoading, parks, restaurants, parkings, cityInfo };
}
