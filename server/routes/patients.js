import express from "express"
import Patient from "../models/Patient.js"
import protect from "../middleware/auth.js"

const router = express.Router()

router.post("/", protect, async (req, res) => {
  const patient = await Patient.create({ ...req.body, createdBy: req.user.id })
  res.status(201).json(patient)
})

router.get("/", protect, async (req, res) => {
  const patients = await Patient.find({ createdBy: req.user.id })
  res.json(patients)
})

router.get("/:id", protect, async (req, res) => {
  const patient = await Patient.findById(req.params.id)
  if (!patient) return res.status(404).json({ message: "Patient not found" })
  res.json(patient)
})

router.put("/:id", protect, async (req, res) => {
  const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true })
  res.json(patient)
})

router.delete("/:id", protect, async (req, res) => {
  await Patient.findByIdAndDelete(req.params.id)
  res.json({ message: "Patient deleted" })
})

export default router
