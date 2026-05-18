const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');

const router = express.Router();
const tokenCache = new NodeCache({ stdTTL: 3500 }); // token Spotify dura ~1h
const artistCache = new NodeCache({ stdTTL: 60 * 60 }); // 1h

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

async function getAccessToken() {
  const cached = tokenCache.get('token');
  if (cached) return cached;

  const res = await axios.post(
    'https://accounts.spotify.com/api/token',
    'grant_type=client_credentials',
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
      },
    }
  );

  const token = res.data.access_token;
  tokenCache.set('token', token);
  return token;
}

// GET /api/spotify/artist?name=<artist name>
router.get('/artist', async (req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'name richiesto' });
  if (!CLIENT_ID || !CLIENT_SECRET)
    return res.status(503).json({ error: 'Spotify API non configurata' });

  const cacheKey = `sp:${name.toLowerCase()}`;
  if (artistCache.has(cacheKey)) return res.json(artistCache.get(cacheKey));

  try {
    const token = await getAccessToken();

    const { data } = await axios.get('https://api.spotify.com/v1/search', {
      params: { q: name, type: 'artist', limit: 1, market: 'IT' },
      headers: { Authorization: `Bearer ${token}` },
    });

    const artist = data.artists?.items?.[0];
    if (!artist) return res.status(404).json({ error: 'Artista non trovato' });

    const out = {
      id: artist.id,
      name: artist.name,
      genres: artist.genres?.slice(0, 3) || [],
      followers: artist.followers?.total || 0,
      popularity: artist.popularity || 0,
      image: artist.images?.[0]?.url || null,
      embedUrl: `https://open.spotify.com/embed/artist/${artist.id}?utm_source=generator&theme=0`,
      externalUrl: artist.external_urls?.spotify || null,
      topTracks: [],
    };

    try {
      const { data: tt } = await axios.get(
        `https://api.spotify.com/v1/artists/${artist.id}/top-tracks`,
        { params: { market: 'IT' }, headers: { Authorization: `Bearer ${token}` } }
      );
      out.topTracks = (tt.tracks || []).slice(0, 5).map((t) => ({
        id: t.id,
        name: t.name,
        preview: t.preview_url || null,
        url: t.external_urls?.spotify || null,
        image: t.album?.images?.slice(-1)[0]?.url || null,
      }));
    } catch {
      // top-tracks opzionale: se fallisce, lasciamo l'array vuoto
    }

    artistCache.set(cacheKey, out);
    res.json(out);
  } catch (err) {
    const status = err.response?.status || 500;
    res.status(status).json({ error: 'Spotify API error', details: err.response?.data || err.message });
  }
});

module.exports = router;
