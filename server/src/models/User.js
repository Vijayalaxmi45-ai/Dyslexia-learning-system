import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    /** Suggested difficulty for adaptive quizzes: easy | medium | hard */
    difficultyLevel: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    lastQuizAverage: { type: Number, default: null },
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
