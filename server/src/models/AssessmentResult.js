import mongoose from 'mongoose';

const assessmentResultSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    score: { type: Number, required: true },
    interpretation: { type: String, required: true },
    prediction: { type: Number, default: null },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const AssessmentResult = mongoose.model('AssessmentResult', assessmentResultSchema);
