// backend/src/routes/ticketmaster.js
const express = require('express')
const axios = require('axios')
const NodeCache = require('node-cache')

const router = express.Router()
const cache = new NodeCache({ stdTTL: 60 * 15 }) // 15 minuti

const TM_BASE = 'https://app.ticketmaster.com/discovery/v2'
const API_KEY = process.env.TICKETMASTER_API_KEY

const EU_COUNTRIES = new Set([
  'IT','FR','DE','ES','GB','NL','BE','AT','CH','PT',
  'SE','NO','DK','FI','PL','CZ','HU','RO','GR','HR',
  'SK','SI','BG','RS','LU','IE','LV','LT','EE','MT','CY'
])

// Nomi italiani città → coordinate (fallback latlong per Ticketmaster)
const CITY_LL = {
  // Italia
  'roma':        { lat: 41.9028, lon: 12.4964 },
  'milano':      { lat: 45.4642, lon: 9.1900  },
  'napoli':      { lat: 40.8518, lon: 14.2681 },
  'torino':      { lat: 45.0703, lon: 7.6869  },
  'bologna':     { lat: 44.4949, lon: 11.3426 },
  'firenze':     { lat: 43.7696, lon: 11.2558 },
  'venezia':     { lat: 45.4408, lon: 12.3155 },
  'genova':      { lat: 44.4056, lon: 8.9463  },
  'palermo':     { lat: 38.1157, lon: 13.3613 },
  // Europa (nomi italiani)
  'parigi':      { lat: 48.8566, lon:  2.3522 },
  'londra':      { lat: 51.5074, lon: -0.1278 },
  'berlino':     { lat: 52.5200, lon: 13.4050 },
  'monaco':      { lat: 48.1351, lon: 11.5820 }, // Monaco di Baviera
  'amburgo':     { lat: 53.5753, lon: 10.0153 },
  'bruxelles':   { lat: 50.8503, lon:  4.3517 },
  'amsterdam':   { lat: 52.3676, lon:  4.9041 },
  'barcellona':  { lat: 41.3851, lon:  2.1734 },
  'madrid':      { lat: 40.4168, lon: -3.7038 },
  'lisbona':     { lat: 38.7169, lon: -9.1399 },
  'vienna':      { lat: 48.2082, lon: 16.3738 },
  'zurigo':      { lat: 47.3769, lon:  8.5417 },
  'ginevra':     { lat: 46.2044, lon:  6.1432 },
  'praga':       { lat: 50.0755, lon: 14.4378 },
  'varsavia':    { lat: 52.2297, lon: 21.0122 },
  'atene':       { lat: 37.9838, lon: 23.7275 },
  'dublino':     { lat: 53.3498, lon: -6.2603 },
  'stoccolma':   { lat: 59.3293, lon: 18.0686 },
  'oslo':        { lat: 59.9139, lon: 10.7522 },
  'copenaghen':  { lat: 55.6761, lon: 12.5683 },
  'helsinki':    { lat: 60.1699, lon: 24.9384 },
  'budapest':    { lat: 47.4979, lon: 19.0402 },
  'bucarest':    { lat: 44.4268, lon: 26.1025 },
  'belgrado':    { lat: 44.8176, lon: 20.4633 },
  'zagabria':    { lat: 45.8150, lon: 15.9819 },
}

// Nomi italiani nazioni → countryCode Ticketmaster
const COUNTRY_MAP = {
  'italia': 'IT', 'italy': 'IT',
  'francia': 'FR', 'france': 'FR',
  'spagna': 'ES', 'spain': 'ES',
  'germania': 'DE', 'germany': 'DE',
  'inghilterra': 'GB', 'uk': 'GB', 'regno unito': 'GB',
  'portogallo': 'PT', 'portugal': 'PT',
  'olanda': 'NL', 'paesi bassi': 'NL', 'netherlands': 'NL',
  'belgio': 'BE', 'belgium': 'BE',
  'austria': 'AT',
  'svizzera': 'CH', 'switzerland': 'CH',
  'grecia': 'GR', 'greece': 'GR',
  'polonia': 'PL', 'poland': 'PL',
  'svezia': 'SE', 'sweden': 'SE',
  'norvegia': 'NO', 'norway': 'NO',
  'danimarca': 'DK', 'denmark': 'DK',
  'finlandia': 'FI', 'finland': 'FI',
  'irlanda': 'IE', 'ireland': 'IE',
  'ungheria': 'HU', 'hungary': 'HU',
  'cechia': 'CZ', 'repubblica ceca': 'CZ',
  'romania': 'RO',
  'croazia': 'HR', 'croatia': 'HR',
}

function toIsoUTC(d){ if(!d) return; const dt=new Date(d); return dt.toISOString().slice(0,19)+'Z' }

function bestImage(images){
  return (images || []).slice().sort((a,b)=> (b.width||0) - (a.width||0))[0]?.url || null
}

function num(v){
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function firstUrl(v){
  return Array.isArray(v) && v[0]?.url ? v[0].url : null
}

function mapArtists(list){
  return (list || []).map(a => {
    const el = a.externalLinks || {}
    return {
      id: a.id,
      name: a.name,
      image: bestImage(a.images),
      genre: a.classifications?.[0]?.genre?.name || null,
      links: {
        youtube: firstUrl(el.youtube),
        spotify: firstUrl(el.spotify),
        homepage: firstUrl(el.homepage),
        instagram: firstUrl(el.instagram),
        twitter: firstUrl(el.twitter),
        facebook: firstUrl(el.facebook)
      }
    }
  })
}

function mapVenue(v){
  if (!v) return null
  return {
    name: v.name || null,
    city: v.city?.name || null,
    address: v.address?.line1 || null,
    postalCode: v.postalCode || null,
    lat: num(v.location?.latitude),
    lon: num(v.location?.longitude),
    url: v.url || null
  }
}

function normalizeStatus(code) {
  if (!code) return null
  const c = code.toLowerCase()
  if (c === 'canceled' || c === 'cancelled') return 'cancelled'
  if (c === 'postponed') return 'postponed'
  if (c === 'rescheduled') return 'rescheduled'
  return c
}

function resolveStatus(ev) {
  // 1. nome evento contiene "annullato" o "[cancelled]"
  if (/\[cancelled\]|\bannullat/i.test(ev.name || '')) return 'cancelled'
  // 2. status esplicito dall'API
  const base = normalizeStatus(ev.dates?.status?.code)
  if (base === 'cancelled' || base === 'postponed' || base === 'rescheduled') return base
  // 3. ticketAvailability.unavailableReason → sold out / non disponibile
  const reason = (ev.ticketAvailability?.unavailableReason || '').toLowerCase()
  if (reason) return 'offsale'
  // 4. sale pubblica terminata
  const saleEnd = ev.sales?.public?.endDateTime
  if (saleEnd && new Date(saleEnd) < new Date()) return 'offsale'
  return base  // 'onsale' o null
}

async function tmRequest(params) {
  const { data } = await axios.get(`${TM_BASE}/events.json`, { params })
  const raw = (data?._embedded?.events || []).map(ev => {
    const v = ev._embedded?.venues?.[0]
    return {
      id: ev.id,
      name: ev.name,
      date: ev.dates?.start?.dateTime || ev.dates?.start?.localDate,
      time: ev.dates?.start?.localTime || null,
      venue: v?.name,
      city: v?.city?.name,
      country: v?.country?.countryCode || null,
      lat: num(v?.location?.latitude),
      lon: num(v?.location?.longitude),
      address: v?.address?.line1 || null,
      genre: ev.classifications?.[0]?.genre?.name || null,
      status: resolveStatus(ev),
      limited: ev.ticketAvailability?.limitedAvailability || false,
      priceMin: ev.priceRanges?.[0]?.min ?? null,
      priceMax: ev.priceRanges?.[0]?.max ?? null,
      currency: ev.priceRanges?.[0]?.currency || null,
      url: ev.url,
      image: bestImage(ev.images)
    }
  })
  return {
    page: data?.page?.number ?? 0,
    size: data?.page?.size ?? raw.length,
    totalPages: data?.page?.totalPages ?? 1,
    totalElements: data?.page?.totalElements ?? raw.length,
    events: raw
  }
}

function mapDetail(ev){
  const c = ev.classifications?.[0]
  return {
    id: ev.id,
    name: ev.name,
    date: ev.dates?.start?.dateTime || ev.dates?.start?.localDate || null,
    time: ev.dates?.start?.localTime || null,
    status: resolveStatus(ev),
    limited: ev.ticketAvailability?.limitedAvailability || false,
    unavailableReason: ev.ticketAvailability?.unavailableReason || null,
    saleEnd: ev.sales?.public?.endDateTime || null,
    venue: mapVenue(ev._embedded?.venues?.[0]),
    segment: c?.segment?.name || null,
    genre: c?.genre?.name || null,
    subGenre: c?.subGenre?.name || null,
    priceMin: ev.priceRanges?.[0]?.min ?? null,
    priceMax: ev.priceRanges?.[0]?.max ?? null,
    currency: ev.priceRanges?.[0]?.currency || null,
    info: ev.info || null,
    note: ev.pleaseNote || null,
    lineup: (ev._embedded?.attractions || []).map(a => a.name).filter(Boolean),
    artists: mapArtists(ev._embedded?.attractions),
    url: ev.url,
    image: bestImage(ev.images)
  }
}

async function fetchEventDetail(id) {
  // Nessuna cache: vogliamo sempre dati freschi per status e disponibilità
  const { data } = await axios.get(`${TM_BASE}/events/${encodeURIComponent(id)}.json`, {
    params: { apikey: API_KEY, locale: '*' }
  })
  return mapDetail(data)
}

router.get('/events', async (req, res) => {
  try {
    const { city = '', keyword = '', size = 12, page = 0, start, end, genre = '' } = req.query

    const cityKey = city.trim().toLowerCase()
    const mappedCountry = COUNTRY_MAP[cityKey]
    const isSearch = !!(city || keyword || genre)

    const baseParams = {
      apikey: API_KEY,
      classificationName: genre || 'music',
      size: Math.min(Number(size) || 12, 100),
      page: Number(page) || 0,
      sort: 'date,asc',
      startDateTime: toIsoUTC(start),
      endDateTime: toIsoUTC(end),
      locale: '*',
      // Senza ricerca: mostra solo Italia. Con ricerca: aperto all'Europa (filtro post-fetch)
      ...(!isSearch && { countryCode: 'IT' })
    }

    const filterEU = (out) => {
      if (!isSearch) return out
      const events = out.events.filter(ev => !ev.country || EU_COUNTRIES.has(ev.country))
      return { ...out, events }
    }

    // Ricerca per nome nazione (es. "Germania" → countryCode: 'DE', niente city)
    if (mappedCountry) {
      const p = { ...baseParams, countryCode: mappedCountry, keyword }
      const k = JSON.stringify(p)
      if (cache.has(k)) return res.json(cache.get(k))
      const out = filterEU(await tmRequest(p))
      cache.set(k, out)
      return res.json(out)
    }

    const p1 = { ...baseParams, city, keyword }
    const key1 = JSON.stringify(p1)
    if (cache.has(key1)) return res.json(cache.get(key1))
    let out = filterEU(await tmRequest(p1))

    // Fallback latlong: copre nomi italiani di città europee (parigi, londra, berlino…)
    if ((out.events?.length ?? 0) === 0 && city) {
      const ll = CITY_LL[cityKey]
      if (ll) {
        const p2 = { ...baseParams, latlong: `${ll.lat},${ll.lon}`, radius: 40, unit: 'km', keyword }
        const key2 = JSON.stringify(p2)
        if (cache.has(key2)) return res.json(cache.get(key2))
        out = filterEU(await tmRequest(p2))
        cache.set(key2, out)
        return res.json(out)
      }
    }

    cache.set(key1, out)
    res.json(out)
  } catch (err) {
    const status = err.response?.status || 500
    res.status(status).json({ error: 'Ticketmaster API error', details: err.response?.data || err.message })
  }
})

router.get('/events/:id', async (req, res) => {
  try {
    const out = await fetchEventDetail(req.params.id)
    res.json(out)
  } catch (err) {
    const status = err.response?.status || 500
    if (status === 404) return res.status(404).json({ error: 'Evento non trovato' })
    res.status(status).json({ error: 'Ticketmaster API error', details: err.response?.data || err.message })
  }
})

router.get('/artists/:id/events', async (req, res) => {
  try {
    const { id } = req.params
    const cacheKey = `artist-events:${id}`
    if (cache.has(cacheKey)) return res.json(cache.get(cacheKey))
    const out = await tmRequest({
      apikey: API_KEY,
      attractionId: id,
      sort: 'date,asc',
      size: 12,
      locale: '*'
    })
    cache.set(cacheKey, out)
    res.json(out)
  } catch (err) {
    const status = err.response?.status || 500
    res.status(status).json({ error: 'Ticketmaster API error', details: err.response?.data || err.message })
  }
})

router.get('/attractions', async (req, res) => {
  try {
    const { keyword = '' } = req.query
    if (!keyword || keyword.length < 2) return res.json({ attractions: [] })
    const cacheKey = `attr:${keyword.toLowerCase()}`
    if (cache.has(cacheKey)) return res.json(cache.get(cacheKey))
    const { data } = await axios.get(`${TM_BASE}/attractions.json`, {
      params: { apikey: API_KEY, keyword, classificationName: 'music', size: 6, locale: '*' }
    })
    const attractions = (data?._embedded?.attractions || []).map(a => ({
      id: a.id,
      name: a.name,
      image: bestImage(a.images),
    }))
    const result = { attractions }
    cache.set(cacheKey, result, 300)
    res.json(result)
  } catch {
    res.json({ attractions: [] })
  }
})

module.exports = router
