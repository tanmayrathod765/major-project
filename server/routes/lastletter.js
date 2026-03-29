import express from "express"
import fetch from "node-fetch"
import Session from "../models/Session.js"
import Memory from "../models/Memory.js"
import PatientContext from "../models/PatientContext.js"
import protect from "../middleware/auth.js"

const router = express.Router()
const AI_BASE_URL = process.env.AI_URL || "http://127.0.0.1:8000"

router.post("/:patientId", protect, async (req, res) => {
  try {
    const { patientName, recipientName, relationship } = req.body

    const [sessions, memories, context] = await Promise.all([
      Session.find({ patient: req.params.patientId }).limit(20),
      Memory.find({ patient: req.params.patientId }).limit(10),
      PatientContext.findOne({ patient: req.params.patientId }),
    ])

    const aiRes = await fetch(`${AI_BASE_URL}/ai/last-letter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientName,
        recipientName,
        relationship,
        sessionData: sessions.map(s => ({ responses: s.responses, mood: s.mood })),
        memories: memories.map(m => ({ type: m.type, tags: m.tags, decade: m.decade, transcript: m.transcript })),
        // Context inject karo
        contextSummary: context?.aiContext?.letterContext || "",
        topTags: context?.patterns?.topTriggerTags || [],
        knownPeople: context?.knownPeople || [],
      }),
    })

    const data = await aiRes.json()
    res.json(data)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

export default router
