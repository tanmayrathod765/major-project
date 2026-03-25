import express from "express"
import fetch from "node-fetch"
import FormData from "form-data"
import fs from "fs"
import protect from "../middleware/auth.js"
import Memory from "../models/Memory.js"

const router = express.Router()

router.post("/:patientId/generate", protect, async (req, res) => {
  try {
    const { text, memoryId } = req.body

    // Get reference audio from memory
    const memory = await Memory.findById(memoryId)
    if (!memory || !memory.filePath) {
      return res.status(400).json({ message: "Audio memory not found" })
    }

    const formData = new FormData()
    formData.append("audio", fs.createReadStream(memory.filePath))
    formData.append("text", text)

    const aiRes = await fetch("http://localhost:8000/ai/clone-voice", {
      method: "POST",
      body: formData,
      headers: formData.getHeaders(),
    })

    if (!aiRes.ok) {
      const err = await aiRes.json()
      return res.status(500).json({ message: err.error })
    }

    const audioBuffer = await aiRes.buffer()
    res.set("Content-Type", "audio/wav")
    res.send(audioBuffer)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

export default router
