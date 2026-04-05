import User from "../models/User.js"
import Patient from "../models/Patient.js"
import Memory from "../models/Memory.js"
import Session from "../models/Session.js"

const toId = (value) => String(value || "")

export const resolveUserRole = async (req) => {
  if (req.accessRole) return req.accessRole
  if (req.user?.role) {
    req.accessRole = req.user.role
    return req.accessRole
  }

  const user = await User.findById(req.user?.id).select("role").lean()
  req.accessRole = user?.role || "family"
  return req.accessRole
}

export const canManagePatient = (role, patient, userId) => {
  if (role === "doctor") return true
  return toId(patient?.createdBy) === toId(userId)
}

const canAccessPatient = (role, patient, userId) => {
  if (role === "doctor") return true
  if (toId(patient?.createdBy) === toId(userId)) return true
  return (patient?.caregivers || []).some((id) => toId(id) === toId(userId))
}

const attachPatientAndAuthorize = async (req, res, patientId) => {
  const patient = await Patient.findById(patientId)
  if (!patient) return res.status(404).json({ message: "Patient not found" })

  const role = await resolveUserRole(req)
  if (!canAccessPatient(role, patient, req.user.id)) {
    return res.status(403).json({ message: "Access denied" })
  }

  req.patientAccess = patient
  return null
}

export const requireDoctor = async (req, res, next) => {
  const role = await resolveUserRole(req)
  if (role !== "doctor") {
    return res.status(403).json({ message: "Doctor access required" })
  }
  return next()
}

export const requirePatientAccessParam = (paramName = "patientId") => async (req, res, next) => {
  const denied = await attachPatientAndAuthorize(req, res, req.params[paramName])
  if (denied) return denied
  return next()
}

export const requireMemoryAccess = async (req, res, next) => {
  const memory = await Memory.findById(req.params.id).select("patient")
  if (!memory) return res.status(404).json({ message: "Memory not found" })

  const denied = await attachPatientAndAuthorize(req, res, memory.patient)
  if (denied) return denied
  req.memoryAccess = memory
  return next()
}

export const requireSessionAccess = async (req, res, next) => {
  const session = await Session.findById(req.params.sessionId).select("patient")
  if (!session) return res.status(404).json({ message: "Session not found" })

  const denied = await attachPatientAndAuthorize(req, res, session.patient)
  if (denied) return denied
  req.sessionAccess = session
  return next()
}
