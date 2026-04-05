import express from "express"
import fetch from "node-fetch"
import Session from "../models/Session.js"
import Memory from "../models/Memory.js"
import PatientContext from "../models/PatientContext.js"
import protect from "../middleware/auth.js"
import { requirePatientAccessParam } from "../middleware/access.js"

const router = express.Router()
const AI_BASE_URL = (process.env.AI_URL || (process.env.NODE_ENV === "production" ? "" : "http://127.0.0.1:8000")).replace(/\/+$/, "")

router.post("/:patientId", protect, requirePatientAccessParam("patientId"), async (req, res) => {
  try {
    if (!AI_BASE_URL) {
      return res.status(500).json({
        success: false,
        message: "AI service URL is not configured. Set AI_URL in server environment variables.",
      })
    }

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

    if (!aiRes.ok) {
      let message = "Last letter generation failed"
      try {
        const err = await aiRes.json()
        message = err.error || err.message || err.detail || message
      } catch {
        const text = await aiRes.text()
        if (text) message = text
      }
      return res.status(502).json({ success: false, message })
    }

    const data = await aiRes.json()
    res.json(data)
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
})

export default router
