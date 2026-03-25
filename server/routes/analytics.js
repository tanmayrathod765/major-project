import express from "express"
import Session from "../models/Session.js"
import Memory from "../models/Memory.js"
import protect from "../middleware/auth.js"

const router = express.Router()

// Spark Score — relationship strength per caregiver
router.get("/spark/:patientId", protect, async (req, res) => {
  try {
    const sessions = await Session.find({ patient: req.params.patientId })
      .populate("caregiver", "name email role")

    const caregiverMap = {}

    sessions.forEach((session) => {
      const cId = session.caregiver?._id?.toString()
      if (!cId) return

      if (!caregiverMap[cId]) {
        caregiverMap[cId] = {
          id: cId,
          name: session.caregiver.name,
          role: session.caregiver.role,
          totalSessions: 0,
          totalDuration: 0,
          positiveResponses: 0,
          totalResponses: 0,
          sparkScore: 0,
        }
      }

      caregiverMap[cId].totalSessions += 1
      caregiverMap[cId].totalDuration += session.duration || 0

      session.responses.forEach((r) => {
        caregiverMap[cId].totalResponses += 1
        if (["smile", "word", "eye_contact"].includes(r.reaction)) {
          caregiverMap[cId].positiveResponses += 1
        }
      })
    })

    // Calculate spark score (0-100)
    Object.values(caregiverMap).forEach((c) => {
      const sessionScore = Math.min(c.totalSessions * 10, 40)
      const responseRate = c.totalResponses > 0
        ? (c.positiveResponses / c.totalResponses) * 40
        : 0
      const durationScore = Math.min(c.totalDuration / 60, 20)
      c.sparkScore = Math.round(sessionScore + responseRate + durationScore)
    })

    res.json({ sparkData: Object.values(caregiverMap) })
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// Memory Health — which memories still trigger responses
router.get("/memory-health/:patientId", protect, async (req, res) => {
  try {
    const memories = await Memory.find({ patient: req.params.patientId })
      .sort({ responseCount: -1 })

    const health = memories.map((m) => ({
      id: m._id,
      type: m.type,
      decade: m.decade,
      tags: m.tags,
      responseCount: m.responseCount,
      relevanceScore: m.relevanceScore,
      healthScore: Math.min(m.responseCount * 20, 100),
    }))

    res.json({ memoryHealth: health })
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// Good Day Predictor — based on session history
router.get("/predict/:patientId", protect, async (req, res) => {
  try {
    const sessions = await Session.find({ patient: req.params.patientId })
      .sort({ createdAt: -1 })
      .limit(20)

    if (sessions.length === 0) {
      return res.json({
        prediction: "unknown",
        confidence: 0,
        message: "Not enough session data yet. Start a few visits first!",
        bestTime: "Morning (10am - 12pm)",
        tip: "Start with music therapy to warm up the session."
      })
    }

    // Analyze patterns
    const recentSessions = sessions.slice(0, 5)
    const avgPositive = recentSessions.reduce((sum, s) => {
      const positive = s.responses.filter(r =>
        ["smile", "word", "eye_contact"].includes(r.reaction)
      ).length
      const total = s.responses.length || 1
      return sum + (positive / total)
    }, 0) / recentSessions.length

    const hourCounts = {}
    sessions.forEach((s) => {
      const hour = new Date(s.createdAt).getHours()
      const bucket = hour < 12 ? "Morning" : hour < 17 ? "Afternoon" : "Evening"
      if (!hourCounts[bucket]) hourCounts[bucket] = { total: 0, positive: 0 }
      hourCounts[bucket].total += 1
      const pos = s.responses.filter(r => ["smile", "word", "eye_contact"].includes(r.reaction)).length
      hourCounts[bucket].positive += pos
    })

    let bestTime = "Morning (10am - 12pm)"
    let bestRate = 0
    Object.entries(hourCounts).forEach(([bucket, data]) => {
      const rate = data.positive / (data.total || 1)
      if (rate > bestRate) { bestRate = rate; bestTime = bucket }
    })

    const isGoodDay = avgPositive > 0.4
    const confidence = Math.round(Math.min(sessions.length * 5, 95))

    res.json({
      prediction: isGoodDay ? "good" : "challenging",
      confidence,
      message: isGoodDay
        ? "Patient has been responsive lately. Great time for a visit!"
        : "Patient has been less responsive. Keep visit short and use music.",
      bestTime,
      tip: isGoodDay
        ? "Try emotional memories and conversation today."
        : "Stick to music therapy and familiar songs. Avoid complex questions."
    })
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

export default router
