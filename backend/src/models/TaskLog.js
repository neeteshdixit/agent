import mongoose from 'mongoose';

const taskLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    command: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    action: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['completed', 'failed', 'blocked'],
      required: true,
    },
    progress: {
      type: [String],
      default: [],
    },
    result: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  { timestamps: true },
);

export const TaskLog = mongoose.model('TaskLog', taskLogSchema);
