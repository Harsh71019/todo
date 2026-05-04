import mongoose, { Schema, Document } from 'mongoose';

export interface IFocusSession extends Document {
  taskId: mongoose.Types.ObjectId;
  startedAt: Date;
  endedAt?: Date;
  durationSeconds: number;
  isPomodoro: boolean;
  status: 'active' | 'completed' | 'abandoned';
  createdAt: Date;
  updatedAt: Date;
}

const focusSessionSchema = new Schema<IFocusSession>(
  {
    taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
    startedAt: { type: Date, required: true, default: Date.now },
    endedAt: { type: Date },
    durationSeconds: { type: Number, default: 0 },
    isPomodoro: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'completed', 'abandoned'], default: 'active' },
  },
  { timestamps: true },
);

focusSessionSchema.index({ taskId: 1, startedAt: -1 });
focusSessionSchema.index({ status: 1 });
focusSessionSchema.index({ startedAt: -1 });

export default mongoose.model<IFocusSession>('FocusSession', focusSessionSchema);
