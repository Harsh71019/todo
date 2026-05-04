import { Schema, model, Document, Types } from 'mongoose';

export interface ISubscription extends Document {
  userId: Types.ObjectId;
  name: string;
  amount: number;
  currency: 'USD' | 'INR' | 'EUR' | 'GBP';
  billingCycle: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: Date;
  nextBillingDate: Date;
  category: string;
  color: string;
  url?: string;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, enum: ['USD', 'INR', 'EUR', 'GBP'], default: 'INR' },
    billingCycle: { type: String, enum: ['weekly', 'monthly', 'quarterly', 'yearly'], required: true },
    startDate: { type: Date, default: Date.now },
    nextBillingDate: { type: Date, required: true },
    category: { type: String, required: true, trim: true },
    color: { type: String, required: true },
    url: { type: String, trim: true },
    notes: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Indexes
subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ nextBillingDate: 1 });

export const Subscription = model<ISubscription>('Subscription', subscriptionSchema);
