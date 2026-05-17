const router = require('express').Router();
const axios = require('axios');

router.get('/', async (req, res) => {
  const { lat, lon } = req.query;
  const key = process.env.OPENWEATHER_API_KEY;
  if (!key) return res.status(503).json({ error: 'not_configured' });
  if (!lat || !lon) return res.status(400).json({ error: 'lat/lon required' });

  try {
    const r = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: { lat, lon, appid: key, units: 'metric', lang: 'it' },
    });
    res.json({
      temp: Math.round(r.data.main.temp),
      feels_like: Math.round(r.data.main.feels_like),
      desc: r.data.weather[0].description,
      icon: r.data.weather[0].icon,
      wind: Math.round(r.data.wind.speed * 3.6),
      humidity: r.data.main.humidity,
      city: r.data.name,
    });
  } catch {
    res.status(500).json({ error: 'fetch failed' });
  }
});

module.exports = router;
