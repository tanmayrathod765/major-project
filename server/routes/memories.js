import express from "express"
import multer from "multer"
import path from "path"
import fs from "fs"
import Memory from "../models/Memory.js"
import protect from "../middleware/auth.js"
import fetch from "node-fetch"
import FormData from "form-data"
import { updatePatientContext } from "../services/contextEngine.js"
const uploadsDir = path.resolve(process.cwd(), "uploads")
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
})

const upload = multer({ storage })
const router = express.Router()
const AI_BASE_URL = process.env.AI_URL || "http://127.0.0.1:8000"

router.post("/:patientId", protect, upload.single("file"), async (req, res) => {
  try {
    const filePath = req.file ? `uploads/${req.file.filename}` : null

    const memory = await Memory.create({
      patient: req.params.patientId,
      type: req.body.type,
      filePath,
      tags: req.body.tags ? req.body.tags.split(",") : [],
      decade: req.body.decade,
    })

    // Auto transcribe audio files
if (req.body.type === "audio" && req.file) {
    try {
      const absoluteFilePath = path.join(uploadsDir, req.file.filename)
      console.log("Starting transcription for:", absoluteFilePath)

      const formData = new FormData()
      formData.append("file", fs.createReadStream(absoluteFilePath), req.file.filename)

      console.log("Sending to AI server...")
      
      const aiRes = await fetch(`${AI_BASE_URL}/ai/transcribe`, {
        method: "POST",
        body: formData,
        headers: formData.getHeaders(),
      })

      const aiData = await aiRes.json()
      console.log("AI Response:", JSON.stringify(aiData))

      if (aiData.success && aiData.transcript) {
        memory.transcript = aiData.transcript
        await memory.save()
        console.log("✅ Transcript saved!")
      } else {
        console.log("❌ No transcript in response:", aiData)
      }
    } catch (e) {
      console.log("❌ Transcription error:", e.message)
    }
  }

    res.status(201).json(memory)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
  updatePatientContext(req.params.patientId).catch(console.error)
})

router.get("/:patientId", protect, async (req, res) => {
  try {
    const memories = await Memory.find({ patient: req.params.patientId })
    res.json(memories)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

router.delete("/:id", protect, async (req, res) => {
  await Memory.findByIdAndDelete(req.params.id)
  res.json({ message: "Memory deleted" })
})

export default router
