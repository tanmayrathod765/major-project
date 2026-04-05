import express from "express"
import multer from "multer"
import path from "path"
import fs from "fs"
import Memory from "../models/Memory.js"
import protect from "../middleware/auth.js"
import { requireMemoryAccess, requirePatientAccessParam } from "../middleware/access.js"
import fetch from "node-fetch"
import FormData from "form-data"
import { updatePatientContext } from "../services/contextEngine.js"
const uploadsDir = path.resolve(process.cwd(), "uploads")
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const MAX_UPLOAD_MB = Number(process.env.MAX_UPLOAD_MB || 25)
const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "audio/mpeg",
  "audio/wav",
  "audio/mp4",
  "audio/x-m4a",
  "video/mp4",
  "video/webm",
  "text/plain",
  "application/pdf",
])

const parseTags = (value) => {
  if (!value || typeof value !== "string") return []
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 50)
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
})

const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!allowedMimeTypes.has(file.mimetype)) {
      return cb(new Error("Unsupported file type"))
    }
    return cb(null, true)
  },
})
const router = express.Router()
const AI_BASE_URL = process.env.AI_URL || "http://127.0.0.1:8000"

router.post("/:patientId", protect, requirePatientAccessParam("patientId"), upload.single("file"), async (req, res) => {
  try {
    if (!req.body.type || !["photo", "audio", "video", "letter"].includes(req.body.type)) {
      return res.status(400).json({ message: "Invalid memory type" })
    }

    const filePath = req.file ? `uploads/${req.file.filename}` : null

    const memory = await Memory.create({
      patient: req.params.patientId,
      type: req.body.type,
      filePath,
      tags: parseTags(req.body.tags),
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

router.get("/:patientId", protect, requirePatientAccessParam("patientId"), async (req, res) => {
  try {
    const page = Math.max(Number(req.query.page || 1), 1)
    const limit = Math.min(Math.max(Number(req.query.limit || 25), 1), 100)
    const skip = (page - 1) * limit

    const [memories, total] = await Promise.all([
      Memory.find({ patient: req.params.patientId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Memory.countDocuments({ patient: req.params.patientId }),
    ])

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      memories,
    })
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

router.delete("/:id", protect, requireMemoryAccess, async (req, res) => {
  await Memory.findByIdAndDelete(req.params.id)
  res.json({ message: "Memory deleted" })
})

export default router
