import mongoose from "mongoose"

const gameScoreSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  playedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  gameType: { type: String, enum: ["memory_match", "word_recall", "number_sequence", "photo_puzzle"] },
  score: { type: Number, default: 0 },
  maxScore: { type: Number, default: 0 },
  duration: { type: Number, default: 0 },
  difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "easy" },
}, { timestamps: true })

gameScoreSchema.index({ patient: 1, createdAt: -1 })
gameScoreSchema.index({ patient: 1, gameType: 1, createdAt: -1 })

export default mongoose.model("GameScore", gameScoreSchema)