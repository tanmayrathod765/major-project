import express from "express"
import PatientContext from "../models/PatientContext.js"
import { updatePatientContext } from "../services/contextEngine.js"
import protect from "../middleware/auth.js"

const router = express.Router()

// Get patient context
router.get("/:patientId", protect, async (req, res) => {
  try {
    let context = await PatientContext.findOne({ patient: req.params.patientId })
    if (!context) {
      context = await updatePatientContext(req.params.patientId)
    }
    res.json(context)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

// Force refresh context
router.post("/:patientId/refresh", protect, async (req, res) => {
  try {
    const context = await updatePatientContext(req.params.patientId)
    res.json(context)
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

export default router