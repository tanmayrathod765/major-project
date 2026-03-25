import mongoose from "mongoose"

const patientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  dementiaType: { type: String, enum: ["primary", "secondary", "reversible"], required: true },
  dementiaStage: { type: String, enum: ["mild", "moderate", "severe"], required: true },
  language: { type: String, default: "hindi" },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  caregivers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
}, { timestamps: true })

export default mongoose.model("Patient", patientSchema)
