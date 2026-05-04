import type { Request, Response } from 'express';
import { Subscription } from '../models/Subscription.js';
import { subscriptionSchema } from '../types/subscription.js';

export const getSubscriptions = async (req: Request, res: Response) => {
  try {
    const subscriptions = await Subscription.find({ userId: req.userId }).sort({ nextBillingDate: 1 });
    res.json({ success: true, data: subscriptions, count: subscriptions.length });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSubscription = async (req: Request, res: Response) => {
  try {
    const validated = subscriptionSchema.parse(req.body);
    const subscription = await Subscription.create({
      ...validated,
      userId: req.userId,
    });
    res.status(201).json({ success: true, data: subscription });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateSubscription = async (req: Request, res: Response) => {
  try {
    const validated = subscriptionSchema.partial().parse(req.body);
    const subscription = await Subscription.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { $set: validated },
      { new: true }
    );

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    res.json({ success: true, data: subscription });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ success: false, errors: error.errors });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSubscription = async (req: Request, res: Response) => {
  try {
    const subscription = await Subscription.findOneAndDelete({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    res.json({ success: true, data: {} });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleActive = async (req: Request, res: Response) => {
  try {
    const subscription = await Subscription.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    subscription.isActive = !subscription.isActive;
    await subscription.save();

    res.json({ success: true, data: subscription });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
