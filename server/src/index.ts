import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { toNodeHandler } from 'better-auth/node';
import connectDB from './config/db.js';
import { auth } from './lib/auth.js';
import taskRoutes from './routes/taskRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import tagRoutes from './routes/tagRoutes.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

dotenv.config();

// Create __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

// Handle uncaught exceptions immediately
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message, err.stack);
  process.exit(1);
});

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  }),
);

// Payload size limit to prevent OOM
app.use(express.json({ limit: '10kb' }));

// Basic Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
// app.use('/api', limiter);

// Auth handler — must be before other /api routes
app.all('/api/auth/*', toNodeHandler(auth));

// Routes
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/tasks', taskRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/tags', tagRoutes);

// ---------------------------------------------------------
// NEW: SERVE THE REACT FRONTEND (Vite uses 'dist')
// ---------------------------------------------------------
const isProduction =
  __dirname.includes('dist') || __dirname.includes('app.asar');

// In dev, look up two folders to the client. In prod, look for the 'public' folder.
const clientDistPath = isProduction
  ? path.join(__dirname, '../public')
  : path.join(__dirname, '../../client/dist');

app.use(express.static(clientDistPath));

app.get(/(.*)/, (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'));
});
// ---------------------------------------------------------

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const start = async () => {
  await connectDB();
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });

  // Handle unhandled promise rejections gracefully
  process.on('unhandledRejection', (err: Error) => {
    console.error('UNHANDLED REJECTION! 💥 Shutting down...');
    console.error(err.name, err.message);
    server.close(() => {
      process.exit(1);
    });
  });

  // Graceful shutdown on SIGINT/SIGTERM (e.g., from hosting platforms)
  const shutdown = () => {
    console.log('👋 Termination signal received. Shutting down gracefully...');
    server.close(async () => {
      console.log('🛑 HTTP server closed.');
      await mongoose.disconnect();
      console.log('🔌 MongoDB disconnected.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

start();
