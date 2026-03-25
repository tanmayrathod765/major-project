import mongoose from "mongoose"

const answerSchema = new mongoose.Schema({
  questionId: { type: Number },
  question: { type: String },
  category: { type: String },
  answer: { type: String },
  correct: { type: Boolean },
  points: { type: Number, default: 0 },
  maxPoints: { type: Number, default: 1 },
})

const assessmentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  conductedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  answers: [answerSchema],
  totalScore: { type: Number, default: 0 },
  maxScore: { type: Number, default: 30 },
  severity: { type: String, enum: ["normal", "mild", "moderate", "severe"] },
  notes: { type: String },
}, { timestamps: true })

export default mongoose.model("Assessment", assessmentSchema)
