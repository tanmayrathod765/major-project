import express from "express"
import Session from "../models/Session.js"
import Memory from "../models/Memory.js"
import protect from "../middleware/auth.js"
import fetch from "node-fetch"

const router = express.Router()

// Start new session
router.post("/:patientId/start", protect, async (req, res) => {
  const session = await Session.create({
    patient: req.params.patientId,
    caregiver: req.user.id,
    mood: req.body.mood || "calm",
  })
  res.status(201).json(session)
})

// Get all sessions for patient
router.get("/:patientId", protect, async (req, res) => {
  const sessions = await Session.find({ patient: req.params.patientId })
    .sort({ createdAt: -1 })
  res.json(sessions)
})

// Log response during session
router.post("/:sessionId/response", protect, async (req, res) => {
  const session = await Session.findById(req.params.sessionId)
  if (!session) return res.status(404).json({ message: "Session not found" })
  session.responses.push(req.body)
  await session.save()

  // Update memory response count
  if (req.body.memoryId && req.body.reaction !== "no_response") {
    await Memory.findByIdAndUpdate(req.body.memoryId, {
      $inc: { responseCount: 1 }
    })
  }
  res.json(session)
})

// End session
router.put("/:sessionId/end", protect, async (req, res) => {
  const session = await Session.findByIdAndUpdate(
    req.params.sessionId,
    { duration: req.body.duration, notes: req.body.notes },
    { new: true }
  )
  res.json(session)
})

// AI suggest next prompt
// Top pe add karo
import Groq from "groq-sdk"

// Suggest route replace karo
router.post("/:patientId/suggest", protect, async (req, res) => {
  try {
    const memories = await Memory.find({ patient: req.params.patientId })
      .sort({ responseCount: -1 })
      .limit(10)

    const { mood, usedPrompts = [] } = req.body

    const memorySummary = memories.map(m =>
      `- Type: ${m.type}, Decade: ${m.decade}, Tags: ${m.tags.join(", ")}, Responses: ${m.responseCount}`
    ).join("\n")

    const prompt = `You are a dementia care expert.
Patient mood: ${mood}
Already tried: ${usedPrompts.join(", ") || "nothing"}
Available memories:
${memorySummary}
Suggest ONE specific conversation prompt. Be warm and simple. Under 2 sentences. Write only the prompt.`

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
    })

    const suggestion = response.choices[0]?.message?.content || "Ask them about their favorite childhood memory."
    res.json({ success: true, suggestion })
  } catch (e) {
    res.json({ success: false, suggestion: "Ask them about their favorite childhood memory." })
  }
})

export default router
