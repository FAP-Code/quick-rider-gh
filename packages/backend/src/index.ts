import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { initSocketServer } from './services/socket.service';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import riderRoutes from './routes/rider.routes';
import orderRoutes from './routes/order.routes';
import adminRoutes from './routes/admin.routes';

const app = express();
const httpServer = http.createServer(app);

// Security & utility middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (same-origin proxy, curl, mobile apps)
    if (!origin) return callback(null, true);
    // Allow configured frontend + any ngrok tunnel
    const allowed = [config.frontendUrl, /\.ngrok(-free)?\.(app|dev|io)$/, /\.ngrok\.io$/];
    const ok = allowed.some(p => typeof p === 'string' ? p === origin : p.test(origin));
    callback(ok ? null : new Error('CORS blocked'), ok);
  },
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(config.isDevelopment ? 'dev' : 'combined'));

// Global rate limiter
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many requests, please try again later' },
  })
);

// Stricter rate limiter on auth endpoints
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: config.env });
});

// API routes
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/riders', riderRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/admin', adminRoutes);

// 404 + error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize Socket.io
initSocketServer(httpServer);

// Start server
httpServer.listen(config.port, () => {
  logger.info(`🚀 Quick Rider GH API running on port ${config.port} [${config.env}]`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received — shutting down gracefully');
  httpServer.close(() => process.exit(0));
});

export { app, httpServer };
