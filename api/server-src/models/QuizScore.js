import mongoose from 'mongoose';

const quizScoreSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    quizId: { type: String, required: true },
    score: { type: Number, required: true },
    total: { type: Number, required: true },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

export const QuizScore = mongoose.model('QuizScore', quizScoreSchema);
