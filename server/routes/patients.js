import express from "express"
import Patient from "../models/Patient.js"
import protect from "../middleware/auth.js"
import Memory from "../models/Memory.js"
import Session from "../models/Session.js"
import Assessment from "../models/Assessment.js"
import GameScore from "../models/GameScore.js"
import PatientContext from "../models/PatientContext.js"
import { canManagePatient, requirePatientAccessParam, resolveUserRole } from "../middleware/access.js"

const router = express.Router()

router.post("/", protect, async (req, res) => {
  const patient = await Patient.create({ ...req.body, createdBy: req.user.id })
  res.status(201).json(patient)
})

router.get("/", protect, async (req, res) => {
  const role = await resolveUserRole(req)
  const query = role === "doctor"
    ? {}
    : { $or: [{ createdBy: req.user.id }, { caregivers: req.user.id }] }

  const patients = await Patient.find(query).sort({ createdAt: -1 })
  res.json(patients)
})

router.get("/:id", protect, requirePatientAccessParam("id"), async (req, res) => {
  res.json(req.patientAccess)
})

router.put("/:id", protect, requirePatientAccessParam("id"), async (req, res) => {
  if (!canManagePatient(req.accessRole, req.patientAccess, req.user.id)) {
    return res.status(403).json({ message: "Only owner or doctor can update patient" })
  }

  const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true })
  res.json(patient)
})

router.delete("/:id", protect, requirePatientAccessParam("id"), async (req, res) => {
  if (!canManagePatient(req.accessRole, req.patientAccess, req.user.id)) {
    return res.status(403).json({ message: "Only owner or doctor can delete patient" })
  }

  const patientId = req.patientAccess._id

  await Promise.all([
    Memory.deleteMany({ patient: patientId }),
    Session.deleteMany({ patient: patientId }),
    Assessment.deleteMany({ patient: patientId }),
    GameScore.deleteMany({ patient: patientId }),
    PatientContext.deleteMany({ patient: patientId }),
  ])

  await Patient.findByIdAndDelete(patientId)
  res.json({ message: "Patient deleted" })
})

export default router
