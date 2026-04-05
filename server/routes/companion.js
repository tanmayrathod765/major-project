import express from "express"
import Groq from "groq-sdk"
import PatientContext from "../models/PatientContext.js"
import Patient from "../models/Patient.js"
import Memory from "../models/Memory.js"
import protect from "../middleware/auth.js"
import { requirePatientAccessParam } from "../middleware/access.js"

const router = express.Router()
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

router.post("/:patientId/chat", protect, requirePatientAccessParam("patientId"), async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body

    const [patient, context, memories] = await Promise.all([
      Patient.findById(req.params.patientId),
      PatientContext.findOne({ patient: req.params.patientId }),
      Memory.find({ patient: req.params.patientId }).limit(10),
    ])

    const topTags = context?.patterns?.topTriggerTags?.join(", ") || "family, memories"
    const patientSummary = context?.aiContext?.patientSummary || ""
    const visitGuide = context?.aiContext?.visitGuide || ""
    const memoryHighlights = memories
      .filter(m => m.transcript || m.tags.length > 0)
      .map(m => `${m.decade}: ${m.tags.join(", ")}${m.transcript ? ` — "${m.transcript.slice(0, 80)}"` : ""}`)
      .join("\n")

    const systemPrompt = `You are a warm, gentle AI companion for ${patient?.name}, a person living with dementia.

What you know about ${patient?.name}:
${patientSummary}

Their most important memories and triggers:
${topTags}

Memory details:
${memoryHighlights || "Family and life memories"}

Conversation guide:
${visitGuide}

CRITICAL RULES:
- Speak in SIMPLE, SHORT sentences — max 1-2 sentences per response
- Be WARM, GENTLE, PATIENT like a caring friend
- Reference their actual memories naturally (dog, family, places etc.)
- NEVER mention dementia, illness, or memory problems
- If they seem confused, gently redirect to a happy memory
- Speak in Hindi if they use Hindi, English if they use English
- Always end with a gentle question or positive statement
- Keep responses under 50 words
- You are their friend who knows their whole life story`

    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.slice(-10),
      { role: "user", content: message }
    ]

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages,
      max_tokens: 150,
      temperature: 0.7,
    })

    const reply = response.choices[0]?.message?.content?.trim() || "Aap kaisa feel kar rahe hain aaj?"

    res.json({
      success: true,
      reply,
      patientName: patient?.name,
    })
  } catch (e) {
    res.status(500).json({
      success: false,
      reply: "Main yahaan hoon. Aap theek hain?",
      error: e.message
    })
  }
})

export default router