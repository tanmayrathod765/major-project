import express from "express"
import multer from "multer"
import path from "path"
import fs from "fs"
import Memory from "../models/Memory.js"
import protect from "../middleware/auth.js"
import fetch from "node-fetch"
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
})

const upload = multer({ storage })
const router = express.Router()
const AI_BASE_URL = process.env.AI_URL || "http://127.0.0.1:8000"

router.post("/:patientId", protect, upload.single("file"), async (req, res) => {
  const memory = await Memory.create({
    patient: req.params.patientId,
    type: req.body.type,
    filePath: req.file ? req.file.path : null,
    tags: req.body.tags ? req.body.tags.split(",") : [],
    decade: req.body.decade,
  })

  // Auto transcribe audio files
if (req.body.type === "audio" && req.file) {
    try {
      console.log("Starting transcription for:", req.file.path)
      
      const fileBuffer = fs.readFileSync(req.file.path)
      const blob = new Blob([fileBuffer], { type: "audio/mpeg" })
      const formData = new FormData()
      formData.append("file", blob, req.file.filename)

      console.log("Sending to AI server...")
      
      const aiRes = await fetch(`${AI_BASE_URL}/ai/transcribe`, {
        method: "POST",
        body: formData,
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
})

router.get("/:patientId", protect, async (req, res) => {
  const memories = await Memory.find({ patient: req.params.patientId })
  res.json(memories)
})

router.delete("/:id", protect, async (req, res) => {
  await Memory.findByIdAndDelete(req.params.id)
  res.json({ message: "Memory deleted" })
})

export default router
