import express from "express"
import Memory from "../models/Memory.js"
import protect from "../middleware/auth.js"
import mongoose from "mongoose"

const router = express.Router()

// Save game score
const gameSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  playedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  gameType: { type: String, enum: ["memory_match", "word_recall", "number_sequence", "photo_puzzle"] },
  score: { type: Number, default: 0 },
  maxScore: { type: Number, default: 0 },
  duration: { type: Number, default: 0 },
  difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "easy" },
}, { timestamps: true })

const GameScore = mongoose.model("GameScore", gameSchema)

router.post("/:patientId/score", protect, async (req, res) => {
  try {
    const score = await GameScore.create({
      patient: req.params.patientId,
      playedBy: req.user.id,
      ...req.body,
    })
    res.status(201).json(score)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

router.get("/:patientId/scores", protect, async (req, res) => {
  try {
    const scores = await GameScore.find({ patient: req.params.patientId })
      .sort({ createdAt: -1 })
      .limit(20)
    res.json(scores)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

router.get("/:patientId/photos", protect, async (req, res) => {
  try {
    const memories = await Memory.find({
      patient: req.params.patientId,
      type: "photo"
    }).limit(8)
    res.json(memories)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

export default router