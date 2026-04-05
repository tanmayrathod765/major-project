import express from "express"
import Memory from "../models/Memory.js"
import GameScore from "../models/GameScore.js"
import protect from "../middleware/auth.js"
import { requirePatientAccessParam } from "../middleware/access.js"

const router = express.Router()

router.post("/:patientId/score", protect, requirePatientAccessParam("patientId"), async (req, res) => {
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

router.get("/:patientId/scores", protect, requirePatientAccessParam("patientId"), async (req, res) => {
  try {
    const scores = await GameScore.find({ patient: req.params.patientId })
      .sort({ createdAt: -1 })
      .limit(20)
    res.json(scores)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

router.get("/:patientId/photos", protect, requirePatientAccessParam("patientId"), async (req, res) => {
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