import mongoose, { Schema, Document } from 'mongoose';

export interface ITag {
  _id: string;
  name: string;
  color: string;
  isDefault: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ITagDocument extends Omit<ITag, '_id'>, Document {}

const tagSchema = new Schema<ITagDocument>(
  {
    name: {
      type: String,
      required: [true, 'Tag name is required'],
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: [30, 'Tag name cannot exceed 30 characters'],
      match: [/^[a-z0-9_-]+$/, 'Tag name can only contain letters, numbers, hyphens and underscores'],
    },
    color: {
      type: String,
      default: '#6366f1',
      match: [/^#[0-9a-fA-F]{6}$/, 'Color must be a valid hex color'],
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [100, 'Description cannot exceed 100 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
  },
);

tagSchema.index({ name: 1 }, { unique: true });
tagSchema.index({ isDefault: 1 });

const Tag = mongoose.model<ITagDocument>('Tag', tagSchema);

export default Tag;
