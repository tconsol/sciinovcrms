const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const { Server } = require('socket.io');

const config = require('./config');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const socketManager = require('./socket');

// Routes
const authRoutes = require('./routes/authRoutes');
const clientRoutes = require('./routes/clientRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const followUpRoutes = require('./routes/followUpRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const activityLogRoutes = require('./routes/activityLogRoutes');
const sciinovRoutes = require('./routes/sciinovRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const httpServer = http.createServer(app);

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', config.uploadDir);
try {
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  console.log(`[${new Date().toISOString()}] Uploads directory ready: ${uploadDir}`);
} catch (err) {
  console.warn(`[${new Date().toISOString()}] Could not create uploads directory: ${err.message}. File uploads may not work.`);
}

// Security middleware
app.use(helmet());

// CORS configuration with multiple origins
const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map(origin => origin.trim());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});
socketManager.setIo(io);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// Static files
app.use('/uploads', express.static(uploadDir));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/follow-ups', followUpRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/sciinov', sciinovRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Start server
let dbConnected = false;

const startServer = () => {
  const port = process.env.PORT || config.port;

  const server = httpServer.listen(port, '0.0.0.0', () => {
    console.log(`[${new Date().toISOString()}] Server running on port ${port}`);
  });

  server.on('error', (err) => {
    console.error(`[${new Date().toISOString()}] Server error:`, err);
    process.exit(1);
  });

  // Connect to DB asynchronously
  connectDB()
    .then(() => {
      dbConnected = true;
      console.log(`[${new Date().toISOString()}] Database connected successfully`);
    })
    .catch((error) => {
      console.error(`[${new Date().toISOString()}] Database connection failed:`, error.message);
      // Don't exit, server can still serve health checks
      console.warn(`[${new Date().toISOString()}] Server will continue without database connection`);
    });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log(`[${new Date().toISOString()}] SIGTERM received, shutting down`);
    server.close(() => {
      console.log(`[${new Date().toISOString()}] Server closed`);
      process.exit(0);
    });
  });
};

startServer();

module.exports = app;
