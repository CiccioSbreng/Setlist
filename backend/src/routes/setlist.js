const router = require('express').Router();
const axios = require('axios');

router.get('/', async (req, res) => {
  const { artist } = req.query;
  const key = process.env.SETLIST_API_KEY;
  if (!key) return res.status(503).json({ error: 'not_configured' });
  if (!artist) return res.status(400).json({ error: 'artist required' });

  try {
    const r = await axios.get('https://api.setlist.fm/rest/1.0/search/setlists', {
      params: { artistName: artist, p: 1 },
      headers: { 'x-api-key': key, Accept: 'application/json' },
    });

    const countSongs = (s) =>
      (s.sets?.set || []).reduce(
        (acc, set) => acc + (set.song || []).filter((so) => so.name).length, 0
      );

    const allWithSongs = (r.data.setlist || []).filter((s) => countSongs(s) > 0);
    // Preferisce il più recente con almeno 4 canzoni; fallback al più recente con qualcosa
    const setlist = allWithSongs.find((s) => countSongs(s) >= 4) ?? allWithSongs[0] ?? null;
    if (!setlist) return res.json({ songs: [], event: null });

    // encore è proprietà del set (blocco), non della singola canzone
    const songs = setlist.sets.set
      .flatMap((set) => (set.song || []).map((song) => ({ ...song, _encore: !!set.encore })))
      .filter((s) => s.name)
      .slice(0, 15)
      .map((s) => ({ name: s.name, encore: s._encore }));

    res.json({
      songs,
      event: {
        date: setlist.eventDate,
        venue: setlist.venue?.name,
        city: setlist.venue?.city?.name,
      },
    });
  } catch (err) {
    const status = err.response?.status === 404 ? 404 : 502;
    res.status(status).json({ error: 'fetch failed' });
  }
});

module.exports = router;
