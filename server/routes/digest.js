import express from "express"
import Groq from "groq-sdk"
import Patient from "../models/Patient.js"
import Session from "../models/Session.js"
import Memory from "../models/Memory.js"
import PatientContext from "../models/PatientContext.js"
import protect from "../middleware/auth.js"
import { requirePatientAccessParam } from "../middleware/access.js"

const router = express.Router()
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

router.get("/:patientId/generate", protect, requirePatientAccessParam("patientId"), async (req, res) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [patient, context, todaySessions, recentMemories] = await Promise.all([
      Patient.findById(req.params.patientId),
      PatientContext.findOne({ patient: req.params.patientId }),
      Session.find({
        patient: req.params.patientId,
        createdAt: { $gte: today }
      }),
      Memory.find({ patient: req.params.patientId })
        .sort({ createdAt: -1 })
        .limit(5),
    ])

    // Today's stats
    const totalResponses = todaySessions.reduce((s, sess) => s + sess.responses.length, 0)
    const positiveResponses = todaySessions.reduce((s, sess) =>
      s + sess.responses.filter(r => ["smile", "word", "eye_contact"].includes(r.reaction)).length, 0
    )

    const bestMoment = todaySessions
      .flatMap(s => s.responses)
      .filter(r => ["smile", "word", "eye_contact"].includes(r.reaction))
      .sort(() => Math.random() - 0.5)[0]

    const topTags = context?.patterns?.topTriggerTags?.join(", ") || "family memories"
    const bestTime = context?.patterns?.bestTimeOfDay || "morning"
    const recallRate = context?.cognitive?.memoryRecallRate || 0

    // Generate digest with Groq
    const prompt = `Generate a warm, personal daily digest message for a family of a dementia patient named ${patient?.name}.

Today's data:
- Sessions today: ${todaySessions.length}
- Positive responses: ${positiveResponses}/${totalResponses}
- Best moment: ${bestMoment ? `"${bestMoment.prompt}" triggered a ${bestMoment.reaction}` : "No sessions today"}
- Top memory triggers: ${topTags}
- Best visit time: ${bestTime}
- Overall recall rate: ${recallRate}%

Write a warm, caring 3-4 sentence digest that:
1. Summarizes how the patient is doing
2. Mentions the best moment if any
3. Gives ONE specific suggestion for tomorrow
4. Ends with encouragement for the family

Keep it warm, personal, and under 100 words. No medical jargon.`

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
    })

    const digestText = response.choices[0]?.message?.content?.trim() || ""

    res.json({
      success: true,
      patientName: patient?.name,
      date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
      digest: digestText,
      stats: {
        sessionsToday: todaySessions.length,
        positiveResponses,
        totalResponses,
        recallRate,
        bestMoment: bestMoment || null,
      },
      tomorrowTip: context?.aiContext?.visitGuide || "Try playing a familiar song during your visit.",
      topTags: context?.patterns?.topTriggerTags || [],
    })
  } catch (e) {
    res.status(500).json({ message: e.message })
  }
})

export default router