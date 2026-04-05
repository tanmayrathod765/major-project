import express from "express"
import fetch from "node-fetch"
import FormData from "form-data"
import fs from "fs"
import path from "path"
import protect from "../middleware/auth.js"
import Memory from "../models/Memory.js"
import { requirePatientAccessParam } from "../middleware/access.js"

const router = express.Router()
const AI_BASE_URL = (process.env.AI_URL || (process.env.NODE_ENV === "production" ? "" : "http://127.0.0.1:8000")).replace(/\/+$/, "")
const uploadsDir = path.resolve(process.cwd(), "uploads")

router.post("/:patientId/generate", protect, requirePatientAccessParam("patientId"), async (req, res) => {
  try {
    if (!AI_BASE_URL) {
      return res.status(500).json({ message: "AI service URL is not configured. Set AI_URL in server environment variables." })
    }

    const { text, memoryId, language } = req.body

    // Get reference audio from memory
    const memory = await Memory.findById(memoryId)
    if (!memory || !memory.filePath) {
      return res.status(400).json({ message: "Audio memory not found" })
    }

    let sourcePath = memory.filePath
    let hasReferenceAudio = true
    if (!fs.existsSync(sourcePath)) {
      const normalized = path.basename(String(memory.filePath).replace(/\\/g, "/"))
      const fallbackPath = path.join(uploadsDir, normalized)
      if (fs.existsSync(fallbackPath)) {
        sourcePath = fallbackPath
      } else {
        hasReferenceAudio = false
      }
    }

    const formData = new FormData()
    if (hasReferenceAudio) {
      formData.append("audio", fs.createReadStream(sourcePath))
    }
    formData.append("text", text)
    if (language) formData.append("language", language)

    const aiRes = await fetch(`${AI_BASE_URL}/ai/clone-voice`, {
      method: "POST",
      body: formData,
      headers: formData.getHeaders(),
    })

    if (!aiRes.ok) {
      let message = "Voice generation failed"
      try {
        const err = await aiRes.json()
        message = err.error || err.message || err.detail || message
      } catch {}
      return res.status(500).json({ message })
    }

    const contentType = aiRes.headers.get("content-type") || ""
    if (contentType.includes("application/json")) {
      const payload = await aiRes.json()
      return res.status(500).json({ message: payload.error || payload.message || payload.detail || "Voice generation failed" })
    }

    const audioBuffer = await aiRes.buffer()
    res.set("Content-Type", contentType || "audio/mpeg")
    res.send(audioBuffer)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

export default router
