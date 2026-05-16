const express = require('express')
const axios = require('axios')
const NodeCache = require('node-cache')

const router = express.Router()
const cache = new NodeCache({ stdTTL: 60 * 30 }) // 30 min (quota YouTube limitata)
const YT_BASE = 'https://www.googleapis.com/youtube/v3'
const API_KEY = process.env.YOUTUBE_API_KEY

async function resolveChannelId(ytUrl) {
  const channelMatch = ytUrl.match(/youtube\.com\/channel\/(UC[\w-]+)/)
  if (channelMatch) return channelMatch[1]

  const handleMatch = ytUrl.match(/youtube\.com\/@([\w.-]+)/)
  if (handleMatch) {
    const { data } = await axios.get(`${YT_BASE}/channels`, {
      params: { key: API_KEY, forHandle: handleMatch[1], part: 'id' }
    })
    return data.items?.[0]?.id || null
  }

  const userMatch = ytUrl.match(/youtube\.com\/user\/([\w.-]+)/)
  if (userMatch) {
    const { data } = await axios.get(`${YT_BASE}/channels`, {
      params: { key: API_KEY, forUsername: userMatch[1], part: 'id' }
    })
    return data.items?.[0]?.id || null
  }

  return null
}

// GET /api/youtube/channel-videos?name=<artist name>
router.get('/channel-videos', async (req, res) => {
  const { name } = req.query
  if (!name) return res.status(400).json({ error: 'name richiesto' })
  if (!API_KEY) return res.status(503).json({ error: 'YouTube API key non configurata' })

  const cacheKey = `yt:${name}`
  if (cache.has(cacheKey)) return res.json(cache.get(cacheKey))

  try {
    // Cerca il canale ufficiale per nome artista
    const channelSearch = await axios.get(`${YT_BASE}/search`, {
      params: { key: API_KEY, q: `${name} official`, type: 'channel', maxResults: 1, part: 'snippet' }
    })
    const channelId = channelSearch.data.items?.[0]?.id?.channelId || null

    if (!channelId) return res.status(404).json({ error: 'Canale non trovato' })

    const { data } = await axios.get(`${YT_BASE}/search`, {
      params: {
        key: API_KEY,
        channelId,
        part: 'snippet',
        type: 'video',
        order: 'date',
        maxResults: 3
      }
    })

    const videos = (data.items || []).map(i => ({
      id: i.id.videoId,
      title: i.snippet.title,
      thumb: i.snippet.thumbnails?.medium?.url || i.snippet.thumbnails?.default?.url
    }))

    const out = { channelId, videos }
    cache.set(cacheKey, out)
    res.json(out)
  } catch (err) {
    const status = err.response?.status || 500
    res.status(status).json({ error: 'YouTube API error', details: err.response?.data || err.message })
  }
})

module.exports = router
