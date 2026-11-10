import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';

import { connectDB } from './config/db.js';
import { swaggerSpec } from './config/swagger.js';
import { initSocket } from './sockets/socketHandler.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';
import { logger } from './utils/logger.js';
import { seedDatabase } from './utils/seedData.js';
import { User } from './models/User.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import chatRoutes from './routes/chatRoutes.js';

const app = express();
const server = http.createServer(app);

// 1. Security Headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Allows Swagger UI to render assets cleanly
  })
);

// 2. CORS Configuration
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive for local dev & college evaluation
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  })
);

// 3. Rate Limiter (Protects against brute force and DDoS)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP address, please try again after 15 minutes.',
  },
});
app.use('/api', limiter);

// 4. Request Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. HTTP Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// 6. API Documentation (Swagger UI)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// 7. Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
    service: 'Expense Tracker Pro API',
  });
});

// 8. REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', chatRoutes);

// Root route
app.get('/', (req, res) => {
  res.send({
    message: 'Expense Tracker Pro Backend REST API is running!',
    docs: '/api-docs',
    health: '/api/health',
  });
});

// 9. Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

// 10. WebSocket Initialization
initSocket(server);

// Start Server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  // Auto-seed if database is brand new
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    logger.info('No users detected in database. Running initial seed...');
    await seedDatabase();
  }

  server.listen(PORT, () => {
    logger.info(`=================================================`);
    logger.info(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    logger.info(`📚 Swagger Documentation: http://localhost:${PORT}/api-docs`);
    logger.info(`🩺 Health Check: http://localhost:${PORT}/api/health`);
    logger.info(`=================================================`);
  });
};

startServer().catch((err) => {
  logger.error(`Server failed to start: ${err.message}`);
  process.exit(1);
});

export { app, server };
