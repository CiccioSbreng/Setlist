import { useEffect, useState } from "react";
import { getWeather } from "../lib/api";

function overpass(query, signal) {
  return fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`, { signal }).then((r) => r.json());
}

function distanceM(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
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
    const tid  = setTimeout(() => ctrl.abort(), 20000);

    // Catene da escludere dai ristoranti; supermercati/negozi da escludere dai parcheggi
    const CHAIN_RE = /autogrill|mcdonald|burger\s*king|kfc|subway|starbucks|old wild west|roadhouse|spizzico|pizza hut|domino|chef express/i;
    const PARKING_NOISE_RE = /lidl|esselunga|carrefour|conad|coop|ikea|leroy|decathlon|mediaworld|auchan|penny|eurospin|tigr[oò]/i;

    // UNA sola query Overpass per parchi + ristoranti + parcheggi: una richiesta
    // sola evita il limite di concorrenza del browser (3 query in parallelo
    // facevano abortire quella dei parcheggi -> colonna che spariva).
    const query =
      `[out:json][timeout:25];(` +
      `node(around:2000,${lat},${lon})[leisure~"park|garden"][name];` +
      `way(around:2000,${lat},${lon})[leisure~"park|garden"][name];` +
      `node(around:2000,${lat},${lon})[amenity~"restaurant|pizzeria|pub"][name];` +
      `way(around:2000,${lat},${lon})[amenity~"restaurant|pizzeria|pub"][name];` +
      `node(around:1500,${lat},${lon})[amenity=parking];` +
      `way(around:1500,${lat},${lon})[amenity=parking];` +
      `);out center;`;

    overpass(query, ctrl.signal)
      .then((d) => {
        const els = d.elements || [];
        const parkEls = [], restEls = [], parkingEls = [];
        for (const e of els) {
          const t = e.tags || {};
          if (t.leisure && /park|garden/.test(t.leisure) && t.name) parkEls.push(e);
          else if (t.amenity && /restaurant|pizzeria|pub/.test(t.amenity) && t.name) restEls.push(e);
          else if (t.amenity === "parking") parkingEls.push(e);
        }

        // Parchi e verde
        setParks(parkEls.slice(0, 5).map((e) => ({ id: e.id, type: e.type, name: e.tags.name })));

        // Ristoranti / pizzerie / pub (niente catene note)
        const restAll = restEls.filter((e) => !CHAIN_RE.test(e.tags.name));
        const restList = (restAll.length === 0 ? restEls : restAll).slice(0, 6);
        setRestaurants(restList.map((e) => ({ id: e.id, name: e.tags.name, type: e.tags.amenity, lat: e.lat ?? e.center?.lat, lon: e.lon ?? e.center?.lon })));

        // Parcheggi (con indicazione a pagamento)
        const pAll = parkingEls
          .filter((e) => e.tags?.access !== "private" && e.tags?.access !== "no")
          .filter((e) => !PARKING_NOISE_RE.test(e.tags?.name ?? ""));
        const named = pAll.filter((e) => e.tags?.name);
        const list = named.length > 0 ? named : pAll;
        setParkings(
          list
            .map((e) => {
              const pLat = e.lat ?? e.center?.lat;
              const pLon = e.lon ?? e.center?.lon;
              return {
                id: e.id,
                name: e.tags?.name || (e.tags?.fee === "yes" ? "Parcheggio a pagamento" : "Parcheggio"),
                fee: e.tags?.fee || null,
                lat: pLat,
                lon: pLon,
                dist: pLat != null && pLon != null ? distanceM(lat, lon, pLat, pLon) : null,
              };
            })
            .sort((a, b) => (a.dist ?? 9999) - (b.dist ?? 9999))
            .slice(0, 5)
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
