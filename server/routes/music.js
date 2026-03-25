import express from "express"
import fetch from "node-fetch"
import protect from "../middleware/auth.js"

const router = express.Router()

const DECADE_KEYWORDS = {
  "1950s": "1950s hindi songs old classics",
  "1960s": "1960s hindi film songs evergreen",
  "1970s": "1970s hindi bollywood songs hits",
  "1980s": "1980s hindi songs superhits",
  "1990s": "1990s hindi songs popular",
  "2000s": "2000s hindi pop songs",
  "2010s": "2010s bollywood hits",
  "2020s": "2020s bollywood songs latest",
}

router.get("/search/:decade", protect, async (req, res) => {
  try {
    const keyword = DECADE_KEYWORDS[req.params.decade] || "hindi songs"
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(keyword)}&type=video&maxResults=6&key=${process.env.YOUTUBE_API_KEY}`
    const response = await fetch(url)
    const data = await response.json()

    if (!data.items) return res.json({ videos: [] })

    const videos = data.items.map((item) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium.url,
      channel: item.snippet.channelTitle,
    }))

    res.json({ videos })
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

router.get("/search", protect, async (req, res) => {
  try {
    const { query } = req.query
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=6&key=${process.env.YOUTUBE_API_KEY}`
    const response = await fetch(url)
    const data = await response.json()

    if (!data.items) return res.json({ videos: [] })

    const videos = data.items.map((item) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium.url,
      channel: item.snippet.channelTitle,
    }))

    res.json({ videos })
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

export default router
