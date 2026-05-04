import { fileURLToPath } from 'url';
import path from 'path';
import { config as dotenvConfig } from 'dotenv';

// Resolve __dirname first so dotenv gets the explicit path to server/.env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenvConfig({ path: path.join(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import tagRoutes from './routes/tagRoutes.js';
import focusRoutes from './routes/focusRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, error: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
// app.use('/api', limiter);

// Routes
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/focus', focusRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

// Serve React frontend
const isProduction = __dirname.includes('dist') || __dirname.includes('app.asar');
const clientDistPath = isProduction
  ? path.join(__dirname, '../public')
  : path.join(__dirname, '../../client/dist');

app.use(express.static(clientDistPath));

app.get(/(.*)/, (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

app.use(notFound);
app.use(errorHandler);

const start = async () => {
  await connectDB();
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });

  process.on('unhandledRejection', (err: Error) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    server.close(() => process.exit(1));
  });

  const shutdown = () => {
    console.log('👋 Shutting down gracefully...');
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

start();
