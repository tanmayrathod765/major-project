import mongoose from "mongoose"

const memorySchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  type: { type: String, enum: ["photo", "audio", "video", "letter"], required: true },
  filePath: { type: String },
  transcript: { type: String },
  tags: [String],
  people: [String],
  emotions: [String],
  decade: { type: String },
  relevanceScore: { type: Number, default: 0 },
  responseCount: { type: Number, default: 0 },
}, { timestamps: true })

export default mongoose.model("Memory", memorySchema)
