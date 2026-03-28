import PatientContext from "../models/PatientContext.js"
import Memory from "../models/Memory.js"
import Session from "../models/Session.js"
import Assessment from "../models/Assessment.js"
import GameScore from "../models/GameScore.js"
import Groq from "groq-sdk"

const groqApiKey = process.env.GROQ_API_KEY
const groq = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null

// Tag categories
const categorizeTag = (tag) => {
  const animals = ["dog", "cat", "bird", "cow", "horse", "fish", "pet", "puppy", "kitten"]
  const people = ["beta", "beti", "son", "daughter", "wife", "husband", "mother", "father", "dada", "dadi", "nana", "nani", "friend", "sister", "brother"]
  const places = ["home", "ghar", "village", "gaon", "school", "temple", "mandir", "garden", "farm", "city"]
  const events = ["wedding", "shaadi", "birthday", "festival", "diwali", "holi", "eid", "christmas", "graduation"]
  const emotions = ["happy", "love", "joy", "peace", "proud", "nostalgic"]

  const t = tag.toLowerCase()
  if (animals.some(a => t.includes(a))) return "animals"
  if (people.some(p => t.includes(p))) return "people"
  if (places.some(p => t.includes(p))) return "places"
  if (events.some(e => t.includes(e))) return "events"
  if (emotions.some(e => t.includes(e))) return "emotions"
  return "objects"
}

// Generate music keywords from tags
const getMusicKeywords = (tags) => {
  const keywordMap = {
    dog: ["loyalty songs", "friendship songs", "pet songs"],
    cat: ["peaceful songs", "gentle melody"],
    wedding: ["wedding songs", "shaadi songs", "romantic songs"],
    shaadi: ["wedding songs", "bollywood romantic"],
    village: ["folk songs", "desi songs", "gaon songs"],
    gaon: ["folk music", "desi songs"],
    mother: ["maa songs", "mother songs", "emotional songs"],
    father: ["papa songs", "father songs"],
    garden: ["nature songs", "peaceful music"],
    temple: ["bhajan", "devotional songs", "aarti"],
    festival: ["festival songs", "celebration music"],
    diwali: ["diwali songs", "festive music"],
    holi: ["holi songs", "rang barse"],
  }

  const keywords = []
  tags.forEach(tag => {
    const t = tag.toLowerCase()
    Object.keys(keywordMap).forEach(key => {
      if (t.includes(key)) keywords.push(...keywordMap[key])
    })
  })
  return [...new Set(keywords)]
}

// Generate visit prompts from tags
const getPromptSuggestions = (tags) => {
  const promptMap = {
    dog: ["Tell me about your dog — what was its name?", "Did your dog do any funny things?", "What did you love most about your pet?"],
    cat: ["Did you have a cat? What was it like?", "Tell me about your pet."],
    wedding: ["Tell me about your wedding day — what do you remember?", "What was the most beautiful thing about your wedding?"],
    shaadi: ["Aapki shaadi ka koi khubsoorat yaad batao?", "Shaadi mein kaunsa gana bajaa tha?"],
    village: ["Aapke gaon mein kya hota tha?", "Gaon ki koi purani yaad batao."],
    garden: ["Did you have a garden at home?", "What flowers did you love most?"],
    temple: ["Aapko mandir jaana pasand tha?", "Kaunsa bhajan aapko pasand hai?"],
    mother: ["Aapki maa kaise thi?", "Maa ke haath ka khana kaisa tha?"],
    father: ["Papa ke baare mein kuch batao.", "Aapke papa kya karte the?"],
    school: ["School ke din kaisa tha?", "Koi dost tha school mein?"],
    festival: ["Festival mein kya karte the?", "Kaun sa festival aapko pasand tha?"],
  }

  const prompts = []
  tags.forEach(tag => {
    const t = tag.toLowerCase()
    Object.keys(promptMap).forEach(key => {
      if (t.includes(key)) prompts.push(...promptMap[key])
    })
  })
  return [...new Set(prompts)]
}

export const updatePatientContext = async (patientId) => {
  try {
    const [memories, sessions, assessments] = await Promise.all([
      Memory.find({ patient: patientId }),
      Session.find({ patient: patientId }).sort({ createdAt: -1 }),
      Assessment.find({ patient: patientId }).sort({ createdAt: -1 }),
    ])

    let context = await PatientContext.findOne({ patient: patientId })
    if (!context) context = new PatientContext({ patient: patientId })

    // ── 1. TAG INTELLIGENCE ──────────────────────────────────
    const tagMap = {}

    memories.forEach(memory => {
      memory.tags.forEach(tag => {
        const t = tag.trim().toLowerCase()
        if (!t) return
        if (!tagMap[t]) {
          tagMap[t] = {
            tag: t,
            category: categorizeTag(t),
            uploadCount: 0,
            responseCount: 0,
            positiveResponseCount: 0,
            relatedSongs: getMusicKeywords([t]),
            relatedPrompts: getPromptSuggestions([t]),
            lastSeen: memory.createdAt,
          }
        }
        tagMap[t].uploadCount += 1
        tagMap[t].responseCount += memory.responseCount || 0
        if (memory.responseCount > 0) tagMap[t].positiveResponseCount += 1
      })
    })

    // Session responses se tag scores update karo
    sessions.forEach(session => {
      session.responses.forEach(response => {
        if (["smile", "word", "eye_contact"].includes(response.reaction)) {
          const prompt = response.prompt?.toLowerCase() || ""
          Object.keys(tagMap).forEach(tag => {
            if (prompt.includes(tag)) {
              tagMap[tag].positiveResponseCount += 1
            }
          })
        }
      })
    })

    // Trigger score calculate karo
    Object.values(tagMap).forEach(t => {
      const total = t.uploadCount + t.responseCount
      t.triggerScore = Math.min(
        Math.round(
          (t.uploadCount * 20) +
          (t.positiveResponseCount * 30) +
          (t.responseCount * 10)
        ),
        100
      )
    })

    context.tagIntelligence = Object.values(tagMap).sort((a, b) => b.triggerScore - a.triggerScore)

    // Top trigger tags
    context.patterns.topTriggerTags = context.tagIntelligence
      .slice(0, 5)
      .map(t => t.tag)

    // ── 2. MUSIC INTELLIGENCE ─────────────────────────────────
    const allTags = memories.flatMap(m => m.tags)
    const musicKeywords = getMusicKeywords(allTags)

    const decadeMap = {}
    memories.forEach(m => {
      if (m.decade) {
        if (!decadeMap[m.decade]) decadeMap[m.decade] = { count: 0, tags: [] }
        decadeMap[m.decade].count += 1
        decadeMap[m.decade].tags.push(...m.tags)
      }
    })

    context.musicIntelligence = Object.entries(decadeMap).map(([decade, data]) => ({
      decade,
      responseScore: data.count * 10,
      suggestedKeywords: [...getMusicKeywords(data.tags), ...musicKeywords].slice(0, 5),
    }))

    // ── 3. PROMPT INTELLIGENCE ────────────────────────────────
    const allPrompts = getPromptSuggestions(allTags)
    context.promptIntelligence = allPrompts.map(p => ({
      prompt: p,
      basedOnTags: allTags.filter(t => p.toLowerCase().includes(t.toLowerCase())),
      successCount: 0,
      failCount: 0,
    }))

    // ── 4. COGNITIVE DATA ─────────────────────────────────────
    if (assessments.length > 0) {
      context.cognitive.latestMMSE = assessments[0].totalScore
      context.cognitive.mmseHistory = assessments.map(a => ({
        score: a.totalScore,
        date: a.createdAt,
      }))

      if (assessments.length > 1) {
        const diff = assessments[0].totalScore - assessments[1].totalScore
        context.cognitive.mmsetrend = diff > 0 ? "improving" : diff < 0 ? "declining" : "stable"
      }
    }

    // Memory recall rate
    const totalResponses = sessions.reduce((s, sess) => s + sess.responses.length, 0)
    const positiveResponses = sessions.reduce((s, sess) =>
      s + sess.responses.filter(r => ["smile", "word", "eye_contact"].includes(r.reaction)).length, 0
    )
    context.cognitive.memoryRecallRate = totalResponses > 0
      ? Math.round((positiveResponses / totalResponses) * 100)
      : 0

    // Emotion history from sessions
    context.cognitive.emotionHistory = sessions
      .filter(s => s.mood)
      .slice(0, 20)
      .map(s => ({ emotion: s.mood, timestamp: s.createdAt }))

    // ── 5. BEST TIME ANALYSIS ─────────────────────────────────
    if (sessions.length > 0) {
      const hourMap = { morning: { pos: 0, total: 0 }, afternoon: { pos: 0, total: 0 }, evening: { pos: 0, total: 0 } }
      sessions.forEach(s => {
        const hour = new Date(s.createdAt).getHours()
        const bucket = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening"
        hourMap[bucket].total += 1
        hourMap[bucket].pos += s.responses.filter(r => ["smile", "word", "eye_contact"].includes(r.reaction)).length
      })

      let bestTime = "morning"
      let bestRate = 0
      Object.entries(hourMap).forEach(([time, data]) => {
        const rate = data.pos / (data.total || 1)
        if (rate > bestRate) { bestTime = time; bestRate = rate }
      })
      context.patterns.bestTimeOfDay = bestTime
    }

    // ── 6. AI SUMMARIES — Feed All Features ──────────────────
    const topTags = context.patterns.topTriggerTags.join(", ") || "family, memories"
    const topPrompts = context.promptIntelligence.slice(0, 3).map(p => p.prompt).join("; ")
    const musicKeywordStr = [...new Set(context.musicIntelligence.flatMap(m => m.suggestedKeywords))].slice(0, 5).join(", ")

    const fallbackAiContext = {
      patientSummary: `Patient shows strongest recall around ${topTags}.` ,
      visitGuide: topPrompts || "Start with familiar family memories and gentle follow-up questions.",
      musicGuide: musicKeywordStr || "Try familiar decade-based songs and devotional classics.",
      letterContext: `Include emotional anchors around ${topTags}.`,
      caregiverTips: "Use short prompts, visit at best response time, and repeat high-response topics.",
      clinicalSummary: `MMSE ${context.cognitive.latestMMSE || "N/A"}/30, recall ${context.cognitive.memoryRecallRate}%, trend ${context.cognitive.mmsetrend}.`,
    }

    if (!groq) {
      context.aiContext = fallbackAiContext
    } else {
      try {

      const aiPrompt = `You are analyzing a dementia patient's complete care data. Generate 5 different summaries.

Patient Data:
- Top memory tags: ${topTags}
- Memories uploaded: ${memories.length} (photos: ${memories.filter(m => m.type === "photo").length}, audio: ${memories.filter(m => m.type === "audio").length})
- MMSE Score: ${context.cognitive.latestMMSE || "Not assessed"}/30, Trend: ${context.cognitive.mmsetrend}
- Memory recall rate: ${context.cognitive.memoryRecallRate}%
- Best visit time: ${context.patterns.bestTimeOfDay}
- Total sessions: ${sessions.length}
- Successful prompts: ${topPrompts || "none yet"}
- Music keywords: ${musicKeywordStr || "hindi songs"}

Generate exactly this JSON (no other text):
{
  "patientSummary": "2-3 sentences about who this patient is based on their memories and data",
  "visitGuide": "2-3 specific conversation topics to try based on their tags and what worked",
  "musicGuide": "Specific music recommendations based on their decade and tags",
  "letterContext": "Key personal details and emotional connections to include in their last letter",
  "caregiverTips": "3 specific personalized tips for this patient based on what triggers responses",
  "clinicalSummary": "Clinical observation summary for doctor based on MMSE, recall rate, and trends"
}`

      const response = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: aiPrompt }],
        max_tokens: 800,
      })

      const raw = response.choices[0]?.message?.content || "{}"
      const clean = raw.replace(/```json|```/g, "").trim()
      const parsed = JSON.parse(clean)

      context.aiContext = {
        patientSummary: parsed.patientSummary || "",
        visitGuide: parsed.visitGuide || "",
        musicGuide: parsed.musicGuide || "",
        letterContext: parsed.letterContext || "",
        caregiverTips: parsed.caregiverTips || "",
        clinicalSummary: parsed.clinicalSummary || "",
      }
      } catch (e) {
        console.log("AI context generation skipped:", e.message)
        context.aiContext = fallbackAiContext
      }
    }

    context.lastUpdated = new Date()
    await context.save()

    console.log(`✅ Full context updated for patient ${patientId}`)
    console.log(`   Tags: ${context.tagIntelligence.length}, Top: ${context.patterns.topTriggerTags.join(", ")}`)
    return context

  } catch (e) {
    console.log("Context engine error:", e.message)
  }
}