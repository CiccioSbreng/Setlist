const axios = require('axios');

const T = 5000;

async function probe(fn) {
  try {
    await fn();
    return { ok: true, detail: null };
  } catch (e) {
    const s = e.response?.status;
    if (s === 401 || s === 403) return { ok: false, detail: 'chiave non valida' };
    if (s === 429)              return { ok: false, detail: 'rate limit' };
    if (e.code === 'ENOTFOUND' || e.code === 'ECONNREFUSED')
                               return { ok: false, detail: 'non raggiungibile' };
    if (e.code === 'ECONNABORTED' || /timeout/i.test(e.message))
                               return { ok: false, detail: 'timeout' };
    return { ok: false, detail: (e.message || 'errore').slice(0, 60) };
  }
}

async function checkTicketmaster(key) {
  if (!key) return { configured: false };
  return { configured: true, ...(await probe(() =>
    axios.get('https://app.ticketmaster.com/discovery/v2/events.json',
      { params: { apikey: key, size: 1 }, timeout: T })
  )) };
}

async function checkSpotify(id, secret) {
  if (!id || !secret) return { configured: false };
  return { configured: true, ...(await probe(() =>
    axios.post('https://accounts.spotify.com/api/token',
      new URLSearchParams({ grant_type: 'client_credentials' }),
      { auth: { username: id, password: secret }, timeout: T })
  )) };
}

async function checkYouTube(key) {
  if (!key) return { configured: false };
  return { configured: true, ...(await probe(() =>
    axios.get('https://www.googleapis.com/youtube/v3/i18nLanguages',
      { params: { part: 'snippet', key }, timeout: T })
  )) };
}

async function checkSetlist(key) {
  if (!key) return { configured: false };
  return { configured: true, ...(await probe(() =>
    axios.get('https://api.setlist.fm/rest/1.0/search/artists',
      { params: { artistName: 'test', p: 1 },
        headers: { 'x-api-key': key, Accept: 'application/json' }, timeout: T })
  )) };
}

async function checkOpenMeteo() {
  return { configured: true, ...(await probe(() =>
    axios.get('https://api.open-meteo.com/v1/forecast',
      { params: { latitude: 45.46, longitude: 9.19, daily: 'weather_code', forecast_days: 1 },
        timeout: T })
  )) };
}

async function checkGoogleMaps(key) {
  if (!key) return { configured: false };
  return { configured: true, ...(await probe(async () => {
    const r = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json',
      { params: { origins: 'Roma', destinations: 'Milano', key }, timeout: T });
    if (r.data?.status === 'REQUEST_DENIED') {
      const err = new Error('chiave non valida');
      err.response = { status: 403 };
      throw err;
    }
  })) };
}

async function runChecks() {
  const e = process.env;
  const tasks = [
    ['Ticketmaster', checkTicketmaster(e.TICKETMASTER_API_KEY)],
    ['Spotify',      checkSpotify(e.SPOTIFY_CLIENT_ID, e.SPOTIFY_CLIENT_SECRET)],
    ['YouTube',      checkYouTube(e.YOUTUBE_API_KEY)],
    ['Setlist.fm',   checkSetlist(e.SETLIST_API_KEY)],
    ['Open-Meteo',   checkOpenMeteo()],
    ['Google Maps',  checkGoogleMaps(e.GOOGLE_MAPS_KEY)],
  ];

  const settled = await Promise.allSettled(tasks.map(([, p]) => p));
  return tasks.map(([name], i) => ({
    name,
    ...(settled[i].status === 'fulfilled'
      ? settled[i].value
      : { configured: false, ok: false, detail: 'probe fallita' }),
  }));
}

module.exports = { runChecks };
