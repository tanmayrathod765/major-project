import express from "express"
import fetch from "node-fetch"
import Session from "../models/Session.js"
import Memory from "../models/Memory.js"
import Patient from "../models/Patient.js"
import protect from "../middleware/auth.js"
import { requirePatientAccessParam } from "../middleware/access.js"

const router = express.Router()
const AI_BASE_URL = process.env.AI_URL || "http://127.0.0.1:8000"

router.get("/:patientId/generate", protect, requirePatientAccessParam("patientId"), async (req, res) => {
  try {
    const [patient, memories, sessions] = await Promise.all([
      Patient.findById(req.params.patientId),
      Memory.find({ patient: req.params.patientId }),
      Session.find({ patient: req.params.patientId }),
    ])

    const payload = {
      patientName: patient.name,
      patientAge: patient.age,
      dementiaType: patient.dementiaType,
      memories: memories.map(m => ({
        type: m.type,
        tags: m.tags,
        decade: m.decade,
        transcript: m.transcript,
      })),
      sessions: sessions.map(s => ({
        responses: s.responses,
        duration: s.duration,
      })),
    }

    const aiRes = await fetch(`${AI_BASE_URL}/ai/life-story`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (!aiRes.ok) {
      const err = await aiRes.text()
      console.log("AI Error:", err)
      return res.status(500).json({ message: "PDF generation failed" })
    }

    const contentType = aiRes.headers.get("content-type")
    console.log("Content-Type from AI:", contentType)

    const buffer = await aiRes.arrayBuffer()
    const pdfBuffer = Buffer.from(buffer)

    console.log("PDF buffer size:", pdfBuffer.length)

    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", `attachment; filename="${patient.name}_Life_Story.pdf"`)
    res.setHeader("Content-Length", pdfBuffer.length)
    res.end(pdfBuffer)

  } catch (e) {
    console.log("Life Story Error:", e.message)
    res.status(500).json({ message: e.message })
  }
})

export default router