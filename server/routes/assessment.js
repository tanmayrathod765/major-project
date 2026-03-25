import express from "express"
import Assessment from "../models/Assessment.js"
import protect from "../middleware/auth.js"

const router = express.Router()

// Save assessment
router.post("/:patientId", protect, async (req, res) => {
  const { answers, notes } = req.body

  const totalScore = answers.reduce((sum, a) => sum + (a.points || 0), 0)

  let severity = "normal"
  if (totalScore >= 24) severity = "normal"
  else if (totalScore >= 18) severity = "mild"
  else if (totalScore >= 10) severity = "moderate"
  else severity = "severe"

  const assessment = await Assessment.create({
    patient: req.params.patientId,
    conductedBy: req.user.id,
    answers,
    totalScore,
    maxScore: 30,
    severity,
    notes,
  })

  res.status(201).json(assessment)
})

// Get all assessments for patient
router.get("/:patientId", protect, async (req, res) => {
  const assessments = await Assessment.find({ patient: req.params.patientId })
    .sort({ createdAt: -1 })
    .populate("conductedBy", "name role")
  res.json(assessments)
})

// Get latest assessment
router.get("/:patientId/latest", protect, async (req, res) => {
  const assessment = await Assessment.findOne({ patient: req.params.patientId })
    .sort({ createdAt: -1 })
    .populate("conductedBy", "name role")
  res.json(assessment)
})

export default router
