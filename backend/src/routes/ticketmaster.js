// backend/src/routes/ticketmaster.js
const express = require('express')
const axios = require('axios')
const NodeCache = require('node-cache')

const router = express.Router()
const cache = new NodeCache({ stdTTL: 60 * 15 }) // 15 minuti

const TM_BASE = 'https://app.ticketmaster.com/discovery/v2'
const API_KEY = process.env.TICKETMASTER_API_KEY

// lat/long base per le principali città (fallback)
const CITY_LL = {
  'roma':     { lat: 41.9028, lon: 12.4964 },
  'milano':   { lat: 45.4642, lon: 9.1900 },
  'napoli':   { lat: 40.8518, lon: 14.2681 },
  'torino':   { lat: 45.0703, lon: 7.6869 },
  'bologna':  { lat: 44.4949, lon: 11.3426 },
  'firenze':  { lat: 43.7696, lon: 11.2558 },
  'venezia':  { lat: 45.4408, lon: 12.3155 },
  'genova':   { lat: 44.4056, lon: 8.9463 },
  'palermo':  { lat: 38.1157, lon: 13.3613 }
}

function toIsoUTC(d){ if(!d) return; const dt=new Date(d); return dt.toISOString().slice(0,19)+'Z' }

async function tmRequest(params) {
  const { data } = await axios.get(`${TM_BASE}/events.json`, { params })
  const events = (data?._embedded?.events || []).map(ev => ({
    id: ev.id,
    name: ev.name,
    date: ev.dates?.start?.dateTime || ev.dates?.start?.localDate,
    time: ev.dates?.start?.localTime || null,
    venue: ev._embedded?.venues?.[0]?.name,
    city: ev._embedded?.venues?.[0]?.city?.name,
    genre: ev.classifications?.[0]?.genre?.name || null,
    priceMin: ev.priceRanges?.[0]?.min ?? null,
    priceMax: ev.priceRanges?.[0]?.max ?? null,
    currency: ev.priceRanges?.[0]?.currency || null,
    url: ev.url,
    image: (ev.images || []).sort((a,b)=>b.width - a.width)[0]?.url
  }))
  return {
    page: data?.page?.number ?? 0,
    size: data?.page?.size ?? events.length,
    totalPages: data?.page?.totalPages ?? 1,
    totalElements: data?.page?.totalElements ?? events.length,
    events
  }
}

router.get('/events', async (req, res) => {
  try {
    const { city = '', keyword = '', size = 12, page = 0, start, end } = req.query

    const baseParams = {
      apikey: API_KEY,
      countryCode: 'IT',
      classificationName: 'music',
      size: Math.min(Number(size) || 12, 100),
      page: Number(page) || 0,
      sort: 'date,asc',
      startDateTime: toIsoUTC(start),
      endDateTime: toIsoUTC(end),
      locale: '*' // evita filtri lingua strani
    }

    // ---- Primo tentativo: per città
    const p1 = { ...baseParams, city, keyword }
    const key1 = JSON.stringify(p1)
    if (cache.has(key1)) return res.json(cache.get(key1))
    let out = await tmRequest(p1)

    // ---- Fallback: se 0 risultati e c'è una città nota, usa latlong + radius
    if ((out.events?.length ?? 0) === 0 && city) {
      const ll = CITY_LL[city.trim().toLowerCase()]
      if (ll) {
        const p2 = { ...baseParams, latlong: `${ll.lat},${ll.lon}`, radius: 50, unit: 'km', keyword }
        const key2 = JSON.stringify(p2)
        if (cache.has(key2)) return res.json(cache.get(key2))
        out = await tmRequest(p2)
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

module.exports = router