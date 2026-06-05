// ============================================================
// server.js
// This is the main entry point of the backend application.
// It sets up the Express server, connects to MongoDB Atlas,
// and registers all the API routes.
//
// To start the server: node server.js
// The server will run on the port defined in .env (default 5000)
// ============================================================

const express  = require('express')
const mongoose = require('mongoose')
const cors     = require('cors')
require('dotenv').config()   // Load environment variables from .env file

// Create the Express application
const app = express()

// ─────────────────────────────────────────────────────────────
// MIDDLEWARE SETUP
// Middleware runs on every request before it reaches the routes
// ─────────────────────────────────────────────────────────────

// cors() allows the frontend (React on port 5173) to communicate
// with the backend (Node on port 5000) without being blocked
// by the browser's same-origin policy
app.use(cors())

// express.json() allows the server to read JSON data sent
// in request bodies (e.g. from login forms, token generation)
app.use(express.json())

// ─────────────────────────────────────────────────────────────
// ROUTES
// Each route file handles a specific part of the application
// All routes are prefixed with /api/ to indicate they are API endpoints
// ─────────────────────────────────────────────────────────────

// Authentication routes — register, login, update profile, change password
app.use('/api/auth', require('./routes/authRoutes'))

// Queue routes — add token, get queue, call next, update status, notifications
app.use('/api/queue', require('./routes/queueRoutes'))

// Counter routes — get counters, assign agents, toggle counter status
app.use('/api/counters', require('./routes/counterRoutes'))

// Analytics routes — get analytics summary, update stats, submit rating
app.use('/api/analytics', require('./routes/analyticsRoutes'))

// ─────────────────────────────────────────────────────────────
// DATABASE CONNECTION
// Connect to MongoDB Atlas using the URI from the .env file
// mongoose.connect() returns a promise:
//   .then() runs if connection is successful
//   .catch() runs if connection fails
// ─────────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch(err => console.log('❌ MongoDB Connection Error:', err))

// ─────────────────────────────────────────────────────────────
// START SERVER
// Listen for incoming requests on the specified port
// process.env.PORT comes from .env file
// || 5000 means: use 5000 if PORT is not defined in .env
// ─────────────────────────────────────────────────────────────
app.listen(process.env.PORT || 5000, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${process.env.PORT || 5000}`)
})