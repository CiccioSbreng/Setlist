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

    const setlist = (r.data.setlist || []).find((s) =>
      s.sets?.set?.some((set) => set.song?.length > 0)
    );
    if (!setlist) return res.json({ songs: [], event: null });

    const songs = setlist.sets.set
      .flatMap((s) => s.song || [])
      .filter((s) => s.name)
      .slice(0, 8)
      .map((s) => ({ name: s.name, encore: !!s.encore }));

    res.json({
      songs,
      event: {
        date: setlist.eventDate,
        venue: setlist.venue?.name,
        city: setlist.venue?.city?.name,
      },
    });
  } catch {
    res.status(500).json({ error: 'fetch failed' });
  }
});

module.exports = router;
