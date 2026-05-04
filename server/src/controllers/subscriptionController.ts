import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Subscription } from '../models/Subscription.js';
import { subscriptionSchema } from '../types/subscription.js';

export const getSubscriptions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const subscriptions = await Subscription.find({ userId: req.userId }).sort({ nextBillingDate: 1 });
    res.json({ success: true, data: subscriptions, count: subscriptions.length });
  } catch (error) {
    next(error);
  }
};

export const createSubscription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = subscriptionSchema.parse(req.body);
    const subscription = await Subscription.create({ ...validated, userId: req.userId });
    res.status(201).json({ success: true, data: subscription });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.issues.map((e) => ({ field: String(e.path.join('.')), message: e.message })),
      });
      return;
    }
    next(error);
  }
};

export const updateSubscription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const validated = subscriptionSchema.partial().parse(req.body);
    const subscription = await Subscription.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: validated },
      { new: true, runValidators: true },
    );

    if (!subscription) {
      res.status(404).json({ success: false, error: 'Subscription not found' });
      return;
    }

    res.json({ success: true, data: subscription });
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.issues.map((e) => ({ field: String(e.path.join('.')), message: e.message })),
      });
      return;
    }
    next(error);
  }
};

export const deleteSubscription = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const subscription = await Subscription.findOneAndDelete({ _id: req.params.id, userId: req.userId });

    if (!subscription) {
      res.status(404).json({ success: false, error: 'Subscription not found' });
      return;
    }

    res.json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

export const toggleActive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const subscription = await Subscription.findOne({ _id: req.params.id, userId: req.userId });

    if (!subscription) {
      res.status(404).json({ success: false, error: 'Subscription not found' });
      return;
    }

    subscription.isActive = !subscription.isActive;
    await subscription.save();

    res.json({ success: true, data: subscription });
  } catch (error) {
    next(error);
  }
};
