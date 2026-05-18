const router = require('express').Router();
const axios = require('axios');

const COST_PER_KM = 0.20; // €/km stimato (carburante + usura)
const BASE = 'https://api.openrouteservice.org';

async function geocode(text, key) {
  const r = await axios.get(`${BASE}/geocode/search`, {
    params: { api_key: key, text, 'boundary.country': 'IT', size: 1 },
    timeout: 6000,
  });
  const coords = r.data?.features?.[0]?.geometry?.coordinates;
  if (!coords) throw new Error('city_not_found');
  return coords; // [lon, lat]
}

// GET /api/distance?origin=Bologna&lat=45.46&lon=9.19
router.get('/', async (req, res) => {
  const key = process.env.ORS_API_KEY;
  if (!key) return res.status(503).json({ error: 'not_configured' });

  const { origin, lat, lon } = req.query;
  if (!origin) return res.status(400).json({ error: 'origin required' });
  if (!lat || !lon) return res.status(400).json({ error: 'lat/lon required' });

  try {
    const [oLon, oLat] = await geocode(origin, key);

    const r = await axios.get(`${BASE}/v2/directions/driving-car`, {
      params: {
        api_key: key,
        start: `${oLon},${oLat}`,
        end: `${lon},${lat}`,
      },
      timeout: 10000,
    });

    const summary = r.data?.features?.[0]?.properties?.summary;
    if (!summary) return res.json({ status: 'not_found' });

    const km = summary.distance / 1000;
    const minutes = Math.round(summary.duration / 60);
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    const durationText = h > 0 ? `${h}h ${m}min` : `${m} min`;
    const distanceText = `${Math.round(km)} km`;
    const cost = Math.round(km * 2 * COST_PER_KM);

    res.json({
      status: 'ok',
      km: Math.round(km),
      distanceText,
      minutes,
      durationText,
      cost,
    });
  } catch (e) {
    if (e.message === 'city_not_found') return res.json({ status: 'not_found' });
    const s = e.response?.status;
    if (s === 403) return res.status(403).json({ error: 'invalid_key' });
    res.status(502).json({ status: 'error' });
  }
});

module.exports = router;
