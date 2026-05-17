const router = require('express').Router();
const axios = require('axios');

// Costo medio auto stimato a km (carburante + usura). Indicativo.
const COST_PER_KM = 0.20;

// Tempo e distanza reali origine -> venue (Google Distance Matrix).
router.get('/', async (req, res) => {
  const key = process.env.GOOGLE_MAPS_KEY;
  if (!key) return res.status(503).json({ error: 'not_configured' });

  const { origin, lat, lon } = req.query;
  if (!origin) return res.status(400).json({ error: 'origin required' });
  if (!lat || !lon) return res.status(400).json({ error: 'lat/lon required' });

  try {
    const r = await axios.get(
      'https://maps.googleapis.com/maps/api/distancematrix/json',
      {
        params: {
          origins: origin,
          destinations: `${lat},${lon}`,
          mode: 'driving',
          units: 'metric',
          language: 'it',
          key,
        },
        timeout: 8000,
      }
    );

    const el = r.data?.rows?.[0]?.elements?.[0];
    if (!el || el.status !== 'OK') {
      return res.json({ status: 'not_found' });
    }

    const km = el.distance.value / 1000;
    const minutes = Math.round(el.duration.value / 60);
    const costRound = Math.round(km * 2 * COST_PER_KM);

    res.json({
      status: 'ok',
      km: Math.round(km),
      distanceText: el.distance.text,
      minutes,
      durationText: el.duration.text,
      cost: costRound, // andata + ritorno
    });
  } catch {
    res.status(502).json({ status: 'error' });
  }
});

module.exports = router;
