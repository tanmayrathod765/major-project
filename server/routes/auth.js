import express from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import User from "../models/User.js"

const router = express.Router()

const allowedRoles = ["family", "caregiver", "doctor"]

const isValidEmail = (email) => {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

router.post("/register", async (req, res) => {
  const { name, email, password, role } = req.body
  const normalizedEmail = String(email || "").trim().toLowerCase()
  const normalizedName = String(name || "").trim()
  const normalizedRole = allowedRoles.includes(role) ? role : "family"

  if (!normalizedName || normalizedName.length < 2) {
    return res.status(400).json({ message: "Name must be at least 2 characters" })
  }

  if (!isValidEmail(normalizedEmail)) {
    return res.status(400).json({ message: "Invalid email" })
  }

  if (typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters" })
  }

  const exists = await User.findOne({ email: normalizedEmail })
  if (exists) return res.status(400).json({ message: "User already exists" })
  const hashed = await bcrypt.hash(password, 10)
  const user = await User.create({ name: normalizedName, email: normalizedEmail, password: hashed, role: normalizedRole })
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" })
  res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } })
})

router.post("/login", async (req, res) => {
  const { email, password } = req.body
  const normalizedEmail = String(email || "").trim().toLowerCase()

  if (!isValidEmail(normalizedEmail) || typeof password !== "string" || password.length === 0) {
    return res.status(400).json({ message: "Invalid credentials" })
  }

  const user = await User.findOne({ email: normalizedEmail })
  if (!user) return res.status(400).json({ message: "Invalid credentials" })
  const match = await bcrypt.compare(password, user.password)
  if (!match) return res.status(400).json({ message: "Invalid credentials" })
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" })
  res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } })
})

export default router
