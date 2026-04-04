import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    moduleId: { type: String, required: true },
    percentComplete: { type: Number, default: 0, min: 0, max: 100 },
    meta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

progressSchema.index({ userId: 1, moduleId: 1 }, { unique: true });

export const Progress = mongoose.model('Progress', progressSchema);
