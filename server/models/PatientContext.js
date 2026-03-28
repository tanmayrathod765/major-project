import mongoose from "mongoose"

const patientContextSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true, unique: true },

  // ALL tags ever uploaded — with scores
  tagIntelligence: [{
    tag: { type: String },
    category: { type: String }, // people, places, animals, objects, emotions, events
    uploadCount: { type: Number, default: 0 },
    responseCount: { type: Number, default: 0 },
    positiveResponseCount: { type: Number, default: 0 },
    triggerScore: { type: Number, default: 0 }, // 0-100
    relatedSongs: [String],
    relatedPrompts: [String],
    lastSeen: { type: Date },
  }],

  // Known people
  knownPeople: [{
    name: { type: String },
    relationship: { type: String },
    triggerScore: { type: Number, default: 0 },
    photoCount: { type: Number, default: 0 },
  }],

  // Music intelligence
  musicIntelligence: [{
    decade: { type: String },
    responseScore: { type: Number, default: 0 },
    suggestedKeywords: [String], // based on tags
  }],

  // Visit prompts intelligence
  promptIntelligence: [{
    prompt: { type: String },
    basedOnTags: [String],
    successCount: { type: Number, default: 0 },
    failCount: { type: Number, default: 0 },
  }],

  // Behavioral patterns
  patterns: {
    bestTimeOfDay: { type: String, default: "morning" },
    bestDayOfWeek: { type: String, default: "tuesday" },
    avgSessionMood: { type: String, default: "calm" },
    agitationTriggers: [String],
    calmingFactors: [String],
    topTriggerTags: [String], // top 5 tags that work best
  },

  // Cognitive summary
  cognitive: {
    latestMMSE: { type: Number },
    mmseHistory: [{ score: Number, date: Date }],
    mmsetrend: { type: String, enum: ["improving", "stable", "declining"], default: "stable" },
    speechComplexityScore: { type: Number, default: 100 },
    memoryRecallRate: { type: Number, default: 100 },
    gameScores: [{ gameType: String, score: Number, date: Date }],
    emotionHistory: [{ emotion: String, timestamp: Date }],
  },

  // AI generated summaries — used by ALL features
  aiContext: {
    patientSummary: { type: String }, // 2-3 sentences about patient
    visitGuide: { type: String }, // what to talk about
    musicGuide: { type: String }, // what music works
    letterContext: { type: String }, // what to include in last letter
    caregiverTips: { type: String }, // personalized tips
    clinicalSummary: { type: String }, // for doctor
  },

  lastUpdated: { type: Date, default: Date.now },
}, { timestamps: true })

export default mongoose.model("PatientContext", patientContextSchema)