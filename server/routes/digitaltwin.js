import express from "express"
import PatientContext from "../models/PatientContext.js"
import Patient from "../models/Patient.js"
import Session from "../models/Session.js"
import Memory from "../models/Memory.js"
import Assessment from "../models/Assessment.js"
import protect from "../middleware/auth.js"
import { requirePatientAccessParam } from "../middleware/access.js"

const router = express.Router()

router.get("/:patientId", protect, requirePatientAccessParam("patientId"), async (req, res) => {
  try {
    const [patient, context, sessions, memories, assessments] = await Promise.all([
      Patient.findById(req.params.patientId),
      PatientContext.findOne({ patient: req.params.patientId }),
      Session.find({ patient: req.params.patientId }).sort({ createdAt: -1 }),
      Memory.find({ patient: req.params.patientId }),
      Assessment.find({ patient: req.params.patientId }).sort({ createdAt: -1 }),
    ])

    // Weekly response trend
    const weeklyTrend = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dayStr = date.toLocaleDateString("en-IN", { weekday: "short" })
      const daySessions = sessions.filter(s => {
        const sDate = new Date(s.createdAt)
        return sDate.toDateString() === date.toDateString()
      })
      const positive = daySessions.reduce((sum, s) =>
        sum + s.responses.filter(r => ["smile", "word", "eye_contact"].includes(r.reaction)).length, 0
      )
      const total = daySessions.reduce((sum, s) => sum + s.responses.length, 0)
      weeklyTrend.push({
        day: dayStr,
        positive,
        total,
        rate: total > 0 ? Math.round((positive / total) * 100) : 0,
      })
    }

    // MMSE trend
    const mmseTrend = assessments.slice(0, 6).reverse().map((a, i) => ({
      assessment: `Test ${i + 1}`,
      score: a.totalScore,
      date: new Date(a.createdAt).toLocaleDateString("en-IN"),
      severity: a.severity,
    }))

    // Tag intelligence top 8
    const topTags = context?.tagIntelligence?.slice(0, 8) || []

    // Emotion distribution from sessions
    const emotionMap = {}
    sessions.forEach(s => {
      if (s.mood) {
        emotionMap[s.mood] = (emotionMap[s.mood] || 0) + 1
      }
    })
    const emotionData = Object.entries(emotionMap).map(([emotion, count]) => ({
      emotion,
      count,
    }))

    // Memory breakdown
    const memoryBreakdown = {
      photo: memories.filter(m => m.type === "photo").length,
      audio: memories.filter(m => m.type === "audio").length,
      video: memories.filter(m => m.type === "video").length,
      letter: memories.filter(m => m.type === "letter").length,
    }

    // Cognitive health score (0-100)
    const mmseScore = assessments[0] ? (assessments[0].totalScore / 30) * 40 : 20
    const recallScore = (context?.cognitive?.memoryRecallRate || 0) * 0.3
    const engagementScore = Math.min(sessions.length * 2, 30)
    const cognitiveHealthScore = Math.round(mmseScore + recallScore + engagementScore)

    res.json({
      patient,
      context,
      weeklyTrend,
      mmseTrend,
      topTags,
      emotionData,
      memoryBreakdown,
      cognitiveHealthScore,
      totalSessions: sessions.length,
      totalMemories: memories.length,
      latestMMSE: assessments[0]?.totalScore || null,
      mmsetrend: context?.cognitive?.mmsetrend || "stable",
    })
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

export default router