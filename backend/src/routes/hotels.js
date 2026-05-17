const router = require('express').Router();
const axios = require('axios');
const NodeCache = require('node-cache');

const cache = new NodeCache();

// Mappa città IT → codice IATA Amadeus
const CITY_CODES = {
  'milano': 'MIL', 'milan': 'MIL',
  'roma': 'ROM', 'rome': 'ROM',
  'napoli': 'NAP', 'naples': 'NAP',
  'torino': 'TRN', 'turin': 'TRN',
  'bologna': 'BLQ',
  'firenze': 'FLR', 'florence': 'FLR',
  'venezia': 'VCE', 'venice': 'VCE',
  'genova': 'GOA', 'genoa': 'GOA',
  'palermo': 'PMO',
  'bari': 'BRI',
  'verona': 'VRN',
  'catania': 'CTA',
  'rimini': 'RMI',
  'trieste': 'TRS',
  'cagliari': 'CAG',
  'reggio calabria': 'REG',
  'pisa': 'PSA',
  'ancona': 'AOI',
  'perugia': 'PEG',
};

const BASE = 'https://test.api.amadeus.com';

async function getToken(key, secret) {
  const cached = cache.get('amadeus_token');
  if (cached) return cached;

  const r = await axios.post(
    `${BASE}/v1/security/oauth2/token`,
    new URLSearchParams({ grant_type: 'client_credentials', client_id: key, client_secret: secret }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 8000 }
  );
  const token = r.data.access_token;
  // Scade in ~30 minuti; cache per 25.
  cache.set('amadeus_token', token, 1500);
  return token;
}

// GET /api/hotels?city=Milano&checkin=2025-06-15&checkout=2025-06-16
router.get('/', async (req, res) => {
  const key = process.env.AMADEUS_KEY;
  const secret = process.env.AMADEUS_SECRET;
  if (!key || !secret) return res.status(503).json({ error: 'not_configured' });

  const { city, checkin, checkout } = req.query;
  if (!city) return res.status(400).json({ error: 'city required' });

  const cityCode = CITY_CODES[city.trim().toLowerCase()];
  if (!cityCode) return res.json({ hotels: [], cityCode: null });

  const cacheKey = `hotels:${cityCode}:${checkin}:${checkout}`;
  const cached = cache.get(cacheKey);
  if (cached) return res.json(cached);

  try {
    const token = await getToken(key, secret);
    const headers = { Authorization: `Bearer ${token}` };

    // 1. Lista hotel nella città
    const listRes = await axios.get(`${BASE}/v1/reference-data/locations/hotels/by-city`, {
      params: { cityCode, radius: 3, radiusUnit: 'KM', hotelSource: 'ALL' },
      headers,
      timeout: 10000,
    });

    const hotelIds = (listRes.data.data || [])
      .slice(0, 20)
      .map((h) => h.hotelId)
      .join(',');

    if (!hotelIds) return res.json({ hotels: [] });

    // 2. Offerte/prezzi
    const offersParams = {
      hotelIds,
      adults: 1,
      roomQuantity: 1,
      bestRateOnly: true,
      paymentPolicy: 'NONE',
    };
    if (checkin) offersParams.checkInDate = checkin;
    if (checkout) offersParams.checkOutDate = checkout;

    const offersRes = await axios.get(`${BASE}/v3/shopping/hotel-offers`, {
      params: offersParams,
      headers,
      timeout: 12000,
    });

    const hotels = (offersRes.data.data || [])
      .filter((h) => h.available && h.offers?.[0]?.price?.total)
      .slice(0, 5)
      .map((h) => {
        const offer = h.offers[0];
        const price = parseFloat(offer.price.total);
        const currency = offer.price.currency || 'EUR';
        return {
          id: h.hotel.hotelId,
          name: h.hotel.name,
          stars: h.hotel.rating ? Number(h.hotel.rating) : null,
          price: Math.round(price),
          currency,
          checkin: offer.checkInDate || checkin,
          checkout: offer.checkOutDate || checkout,
          bookingUrl: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(h.hotel.name + ' ' + city)}`,
        };
      })
      .sort((a, b) => a.price - b.price);

    const result = { hotels, cityCode };
    cache.set(cacheKey, result, 3600); // cache 1h
    res.json(result);
  } catch (e) {
    const status = e.response?.status;
    if (status === 401) {
      cache.del('amadeus_token');
      return res.status(502).json({ error: 'auth_failed' });
    }
    // 400 spesso = nessuna disponibilità per quelle date in sandbox
    if (status === 400) return res.json({ hotels: [] });
    res.status(502).json({ error: 'fetch_failed' });
  }
});

module.exports = router;
