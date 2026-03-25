import mongoose from "mongoose"

const responseSchema = new mongoose.Schema({
  memoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Memory" },
  prompt: { type: String },
  reaction: { type: String, enum: ["smile", "word", "eye_contact", "no_response", "agitated"] },
  notes: { type: String },
  timestamp: { type: Date, default: Date.now }
})

const sessionSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  caregiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  mood: { type: String, enum: ["calm", "agitated", "happy", "confused", "sleepy"], default: "calm" },
  responses: [responseSchema],
  goodDay: { type: Boolean, default: true },
  notes: { type: String },
  duration: { type: Number, default: 0 },
}, { timestamps: true })

export default mongoose.model("Session", sessionSchema)
