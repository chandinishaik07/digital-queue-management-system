// ============================================================
// models/QueueAnalytics.js
// This file defines the structure of Queue Analytics data.
// Every day, one analytics document is created/updated
// to track how the queue performed that day.
// This data powers the charts in the Admin Dashboard.
// ============================================================

const mongoose = require('mongoose')

// Define the shape of a QueueAnalytics document in MongoDB
const queueAnalyticsSchema = new mongoose.Schema({

  // The date this analytics record is for
  // Stored as a string in 'YYYY-MM-DD' format
  // e.g. '2025-04-21'
  date: {
    type:     String,
    required: true
  },

  // Total number of customers who joined the queue that day
  totalCustomers: {
    type:    Number,
    default: 0
  },

  // Average time (in minutes) taken to serve one customer
  averageServiceTime: {
    type:    Number,
    default: 0
  },

  // Customer satisfaction ratings
  // These are submitted by customers after being served
  // Each field counts how many customers gave that rating
  poor: {
    type:    Number,
    default: 0
  },
  average: {
    type:    Number,
    default: 0
  },
  good: {
    type:    Number,
    default: 0
  },
  excellent: {
    type:    Number,
    default: 0
  },

  // Overall performance score for the day (0-100)
  // Calculated as: (completed tokens / total tokens) * 100
  queuePerformance: {
    type:    Number,
    default: 0
  }

}, {
  // Automatically adds createdAt and updatedAt timestamps
  timestamps: true
})

// Export the model
// Maps to 'QueueAnalytics' collection in MongoDB Atlas
module.exports = mongoose.model('QueueAnalytics', queueAnalyticsSchema, 'QueueAnalytics')