import express from "express"
import Session from "../models/Session.js"
import Memory from "../models/Memory.js"
import protect from "../middleware/auth.js"
import fetch from "node-fetch"
import Groq from "groq-sdk"
import PatientContext from "../models/PatientContext.js"
import { requirePatientAccessParam, requireSessionAccess } from "../middleware/access.js"
import { updatePatientContext } from "../services/contextEngine.js"
const router = express.Router()

// Start new session
router.post("/:patientId/start", protect, requirePatientAccessParam("patientId"), async (req, res) => {
  const session = await Session.create({
    patient: req.params.patientId,
    caregiver: req.user.id,
    mood: req.body.mood || "calm",
  })
  res.status(201).json(session)
})

// Get all sessions for patient
router.get("/:patientId", protect, requirePatientAccessParam("patientId"), async (req, res) => {
  const sessions = await Session.find({ patient: req.params.patientId })
    .sort({ createdAt: -1 })
  res.json(sessions)
})

// Log response during session
router.post("/:sessionId/response", protect, requireSessionAccess, async (req, res) => {
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
    updatePatientContext(session.patient).catch(console.error)
})

// End session
router.put("/:sessionId/end", protect, requireSessionAccess, async (req, res) => {
  const session = await Session.findByIdAndUpdate(
    req.params.sessionId,
    { duration: req.body.duration, notes: req.body.notes },
    { new: true }
  )
  res.json(session)
})

router.post("/:patientId/suggest", protect, requirePatientAccessParam("patientId"), async (req, res) => {
  try {
    const [memories, context] = await Promise.all([
      Memory.find({ patient: req.params.patientId }).sort({ responseCount: -1 }).limit(10),
      PatientContext.findOne({ patient: req.params.patientId })
    ])

    const { mood, usedPrompts = [] } = req.body

    // Context se ready-made prompts use karo
    const tagPrompts = context?.promptIntelligence
      ?.filter(p => !usedPrompts.includes(p.prompt))
      ?.slice(0, 5)
      ?.map(p => p.prompt)
      ?.join("; ") || ""

    const topTags = context?.patterns?.topTriggerTags?.join(", ") || ""
    const visitGuide = context?.aiContext?.visitGuide || ""

    const prompt = `You are a dementia care expert who knows this patient deeply.

What you know about this patient:
${visitGuide}
Top memory triggers: ${topTags}
Suggested prompts based on their memories: ${tagPrompts}

Current mood: ${mood}
Already tried: ${usedPrompts.slice(-3).join(", ") || "nothing"}

Pick or adapt ONE prompt from the suggestions, or create a better one.
Be warm, specific, personal. Under 2 sentences. Just the prompt.`

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 100,
    })

    const suggestion = response.choices[0]?.message?.content?.trim() || tagPrompts.split(";")[0] || "Ask them about their favorite memory."
    res.json({ success: true, suggestion, topTags })
  } catch (e) {
    res.json({ success: false, suggestion: "Ask them about their favorite childhood memory." })
  }
})

export default router
