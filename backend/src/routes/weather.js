const router = require('express').Router();
const axios = require('axios');

// Codici meteo WMO -> descrizione IT + icona
const WMO = {
  0: ['Sereno', '☀️'],
  1: ['Prevalentemente sereno', '🌤️'],
  2: ['Parzialmente nuvoloso', '⛅'],
  3: ['Coperto', '☁️'],
  45: ['Nebbia', '🌫️'], 48: ['Nebbia', '🌫️'],
  51: ['Pioviggine leggera', '🌦️'], 53: ['Pioviggine', '🌦️'], 55: ['Pioviggine intensa', '🌧️'],
  56: ['Pioviggine gelata', '🌧️'], 57: ['Pioviggine gelata', '🌧️'],
  61: ['Pioggia leggera', '🌦️'], 63: ['Pioggia', '🌧️'], 65: ['Pioggia forte', '🌧️'],
  66: ['Pioggia gelata', '🌧️'], 67: ['Pioggia gelata', '🌧️'],
  71: ['Neve leggera', '❄️'], 73: ['Neve', '❄️'], 75: ['Neve forte', '❄️'], 77: ['Nevischio', '❄️'],
  80: ['Rovesci leggeri', '🌦️'], 81: ['Rovesci', '🌧️'], 82: ['Rovesci forti', '⛈️'],
  85: ['Rovesci di neve', '🌨️'], 86: ['Rovesci di neve', '🌨️'],
  95: ['Temporale', '⛈️'], 96: ['Temporale con grandine', '⛈️'], 99: ['Temporale con grandine', '⛈️'],
};

// Previsione per la data del concerto. Open-Meteo: gratis, nessuna API key.
router.get('/', async (req, res) => {
  const { lat, lon, date } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: 'lat/lon required' });
  if (!date) return res.status(400).json({ error: 'date required' });

  const day = String(date).slice(0, 10);
  const target = new Date(`${day}T00:00:00`);
  if (Number.isNaN(target.getTime())) return res.status(400).json({ error: 'bad date' });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target - today) / 86400000);
  if (diffDays < 0) return res.json({ status: 'past' });
  if (diffDays > 15) return res.json({ status: 'out_of_range' });

  try {
    const r = await axios.get('https://api.open-meteo.com/v1/forecast', {
      params: {
        latitude: lat,
        longitude: lon,
        daily:
          'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max',
        timezone: 'auto',
        start_date: day,
        end_date: day,
      },
      timeout: 8000,
    });

    const d = r.data && r.data.daily;
    if (!d || !Array.isArray(d.time) || d.time[0] !== day) {
      return res.json({ status: 'out_of_range' });
    }

    const code = d.weather_code && d.weather_code[0];
    const [desc, icon] = WMO[code] || ['Variabile', '🌡️'];

    res.json({
      status: 'ok',
      date: day,
      tMax: Math.round(d.temperature_2m_max[0]),
      tMin: Math.round(d.temperature_2m_min[0]),
      precip: Math.round(d.precipitation_probability_max[0] ?? 0),
      wind: Math.round(d.wind_speed_10m_max[0] ?? 0),
      code,
      desc,
      icon,
    });
  } catch {
    res.status(502).json({ status: 'error' });
  }
});

module.exports = router;
