require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

// Initialize database on startup
const db = require('./db/database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
const allowedOrigins = [
  'http://localhost:5173',
  'https://my-gymplanner-client-4jq9cdp43-devtzis-projects.vercel.app',
  'https://mygymplanner.vercel.app',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    // Check if origin is in allowed list or is a Vercel preview URL
    if (allowedOrigins.includes(origin) || origin.includes('.vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const exerciseRoutes = require('./routes/exercises');
const planRoutes = require('./routes/plans');
const workoutRoutes = require('./routes/workouts');
const workoutSessionRoutes = require('./routes/workoutSessions');
const userRoutes = require('./routes/users');

app.use('/api/exercises', exerciseRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/workout-sessions', workoutSessionRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'MyGymPlanner API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error occurred:', err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Client URL: ${process.env.CLIENT_URL}`);
  console.log(`💾 Database initialized successfully`);
});
