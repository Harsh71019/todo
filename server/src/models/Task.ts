import mongoose, { Schema, Document } from 'mongoose';
import { ITask, TaskPriorityType, TaskStatusType } from '../types/task.js';

export interface ITaskDocument extends Omit<ITask, '_id'>, Document {}

const taskSchema = new Schema<ITaskDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
      default: '',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'] satisfies TaskPriorityType[],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['pending', 'completed'] satisfies TaskStatusType[],
      default: 'pending',
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (v: string[]) => v.length <= 5,
        message: 'A task can have at most 5 tags',
      },
    },
    estimatedMinutes: {
      type: Number,
      default: 0,
      min: [0, 'Estimated minutes cannot be negative'],
    },
    subtasks: {
      type: [
        {
          title: { type: String, required: true, trim: true },
          isCompleted: { type: Boolean, default: false },
        },
      ],
      default: [],
    },
    isLongTerm: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    totalFocusSeconds: {
      type: Number,
      default: 0,
    },
    completedPomodoros: {
      type: Number,
      default: 0,
    },
    lastFocusedAt: {
      type: Date,
      default: null,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  },
);

// Indexes for efficient queries
taskSchema.index({ userId: 1, isDeleted: 1, status: 1 });
taskSchema.index({ userId: 1, isDeleted: 1, createdAt: -1 });
taskSchema.index({ userId: 1, isArchived: 1 });
taskSchema.index({ userId: 1, createdAt: -1 });
taskSchema.index({ userId: 1, completedAt: -1 });
taskSchema.index({ userId: 1, priority: 1 });
taskSchema.index({ userId: 1, tags: 1 });
taskSchema.index({ userId: 1, title: 1 }); // prefix-match support for search

const Task = mongoose.model<ITaskDocument>('Task', taskSchema);

export default Task;
