import express from "express"
import Patient from "../models/Patient.js"
import Session from "../models/Session.js"
import Memory from "../models/Memory.js"
import Assessment from "../models/Assessment.js"
import User from "../models/User.js"
import protect from "../middleware/auth.js"

const router = express.Router()

// Get all patients doctor can see
router.get("/patients", protect, async (req, res) => {
  try {
    const patients = await Patient.find()
      .populate("createdBy", "name email role")
      .sort({ createdAt: -1 })

    const patientsWithStats = await Promise.all(
      patients.map(async (p) => {
        const [sessions, memories, assessments] = await Promise.all([
          Session.find({ patient: p._id }),
          Memory.find({ patient: p._id }),
          Assessment.find({ patient: p._id }).sort({ createdAt: -1 }).limit(1),
        ])

        const latestAssessment = assessments[0]
        const totalPositive = sessions.reduce((sum, s) =>
          sum + s.responses.filter(r =>
            ["smile", "word", "eye_contact"].includes(r.reaction)
          ).length, 0)

        return {
          ...p.toObject(),
          totalSessions: sessions.length,
          totalMemories: memories.length,
          latestMMSE: latestAssessment?.totalScore ?? null,
          mmseSevertiy: latestAssessment?.severity ?? null,
          totalPositiveResponses: totalPositive,
        }
      })
    )

    res.json(patientsWithStats)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// Get detailed patient stats for doctor
router.get("/patient/:patientId", protect, async (req, res) => {
  try {
    const [patient, sessions, memories, assessments] = await Promise.all([
      Patient.findById(req.params.patientId).populate("createdBy", "name email"),
      Session.find({ patient: req.params.patientId }).sort({ createdAt: -1 }),
      Memory.find({ patient: req.params.patientId }),
      Assessment.find({ patient: req.params.patientId }).sort({ createdAt: -1 }),
    ])

    // MMSE trend
    const mmseTrend = assessments.map(a => ({
      date: a.createdAt,
      score: a.totalScore,
      severity: a.severity,
    }))

    // Response trend
    const responseTrend = sessions.map(s => ({
      date: s.createdAt,
      positive: s.responses.filter(r =>
        ["smile", "word", "eye_contact"].includes(r.reaction)
      ).length,
      total: s.responses.length,
      mood: s.mood,
    }))

    // Memory stats
    const memoryStats = {
      total: memories.length,
      photos: memories.filter(m => m.type === "photo").length,
      audio: memories.filter(m => m.type === "audio").length,
      video: memories.filter(m => m.type === "video").length,
      letter: memories.filter(m => m.type === "letter").length,
    }

    res.json({
      patient,
      mmseTrend,
      responseTrend,
      memoryStats,
      totalSessions: sessions.length,
      latestAssessment: assessments[0] || null,
    })
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// Overall stats for doctor dashboard
router.get("/stats", protect, async (req, res) => {
  try {
    const [totalPatients, totalSessions, totalAssessments, users] = await Promise.all([
      Patient.countDocuments(),
      Session.countDocuments(),
      Assessment.countDocuments(),
      User.countDocuments(),
    ])

    const assessments = await Assessment.find()
    const severityBreakdown = {
      normal: assessments.filter(a => a.severity === "normal").length,
      mild: assessments.filter(a => a.severity === "mild").length,
      moderate: assessments.filter(a => a.severity === "moderate").length,
      severe: assessments.filter(a => a.severity === "severe").length,
    }

    res.json({
      totalPatients,
      totalSessions,
      totalAssessments,
      totalUsers: users,
      severityBreakdown,
    })
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

export default router