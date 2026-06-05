// ============================================================
// routes/analyticsRoutes.js
// This file handles all analytics-related API routes.
// Analytics data powers the charts and satisfaction ratings
// in the Admin Dashboard and Dashboard pages.
//
// Base URL: /api/analytics
// Routes:
//   GET  /api/analytics         → Get summary + 7-day history
//   POST /api/analytics/update  → Update today's analytics from queue data
//   POST /api/analytics/rate    → Submit a customer satisfaction rating
// ============================================================

const express        = require('express')
const router         = express.Router()
const QueueAnalytics = require('../models/QueueAnalytics')  // Analytics model
const Queue          = require('../models/Queue')            // Queue model
const auth = require('../middleware/auth')
const admin = require('../middleware/admin')

// ─────────────────────────────────────────────────────────────
// GET ANALYTICS SUMMARY
// Route:  GET /api/analytics
// Access: Admin
// What it does:
//   1. Fetches all analytics records from the database
//   2. Adds up all the values (total customers, ratings etc.)
//      across all records to get overall totals
//   3. Calculates averages for service time and performance
//   4. Returns the last 7 days of records for the bar chart
// ─────────────────────────────────────────────────────────────
router.get('/',auth,admin, async (req, res) => {
  try {
    // Get all analytics records, most recent first
    const all = await QueueAnalytics.find().sort({ date: -1 })

    // If no analytics data exists yet, return zeros
    if (all.length === 0) {
      return res.json({
        totalCustomers:     0,
        averageServiceTime: 0,
        poor:               0,
        average:            0,
        good:               0,
        excellent:          0,
        queuePerformance:   0,
        history:            []
      })
    }

    // Add up all values across every analytics record
    // reduce() loops through each record and accumulates totals
    const totals = all.reduce((acc, record) => {
      acc.totalCustomers     += record.totalCustomers
      acc.averageServiceTime += record.averageServiceTime
      acc.poor               += record.poor
      acc.average            += record.average
      acc.good               += record.good
      acc.excellent          += record.excellent
      acc.queuePerformance   += record.queuePerformance
      return acc
    }, {
      // Start with all zeros
      totalCustomers: 0, averageServiceTime: 0,
      poor: 0, average: 0, good: 0, excellent: 0, queuePerformance: 0
    })

    // Calculate averages for time and performance (not counts)
    totals.averageServiceTime = Math.round(totals.averageServiceTime / all.length)
    totals.queuePerformance   = Math.round(totals.queuePerformance   / all.length)

    // Include last 7 days in reverse order (oldest to newest)
    // for the bar chart in the dashboard
    totals.history = all.slice(0, 7).reverse()

    res.json(totals)

  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch analytics', error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────
// UPDATE TODAY'S ANALYTICS
// Route:  POST /api/analytics/update
// Access: Admin / System
// What it does:
//   Recalculates and updates today's analytics record based
//   on the current state of the queue collection.
//   Called after queue events like completing a token.
//   Uses upsert: true which means:
//     - If today's record exists → update it
//     - If today's record doesn't exist → create it
// ─────────────────────────────────────────────────────────────
router.post('/update',auth,admin,async (req, res) => {
  try {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0]

    // Get all tokens from the queue
    const queue = await Queue.find()

    const total     = queue.length
    const completed = queue.filter(q => q.status === 'completed').length

    // Calculate average service time from completed tokens
    // Measures how long each token took from creation to completion
    const completedTokens = queue.filter(q => q.status === 'completed')
    const avgTime = completedTokens.length > 0
      ? Math.round(
          completedTokens.reduce((sum, q) => {
            // updatedAt is when status changed to completed
            // createdAt is when token was generated
            return sum + (new Date(q.updatedAt) - new Date(q.createdAt)) / 60000
          }, 0) / completedTokens.length
        )
      : 0

    // Performance score = percentage of tokens that were completed
    const performance = total > 0
      ? Math.round((completed / total) * 100)
      : 0

    // Update today's record or create it if it doesn't exist
    const updated = await QueueAnalytics.findOneAndUpdate(
      { date: today },          // Find record for today
      {
        date:               today,
        totalCustomers:     total,
        averageServiceTime: avgTime,
        queuePerformance:   performance
      },
      { upsert: true, new: true }  // Create if not found, return updated doc
    )

    res.json(updated)

  } catch (err) {
    res.status(500).json({ message: 'Failed to update analytics', error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────
// SUBMIT SATISFACTION RATING
// Route:  POST /api/analytics/rate
// Access: Customer (after being served)
// What it does:
//   Allows customers to rate their experience after service.
//   Increments the count for the chosen rating category
//   (poor / average / good / excellent) in today's record.
//   $inc is a MongoDB operator that increments a field by 1.
// ─────────────────────────────────────────────────────────────
router.post('/rate', async (req, res) => {
  try {
    // rating must be one of: 'poor', 'average', 'good', 'excellent'
    const { rating } = req.body

    // Validate that rating is one of the allowed values
    const validRatings = ['poor', 'average', 'good', 'excellent']
    if (!validRatings.includes(rating)) {
      return res.status(400).json({ message: 'Invalid rating value' })
    }

    // Get today's date
    const today = new Date().toISOString().split('T')[0]

    // Build the increment object dynamically
    // e.g. if rating is 'good', inc = { good: 1 }
    const inc = {}
    inc[rating] = 1

    // Find today's record and increment the rating count
    // $inc adds 1 to the specified field
    const updated = await QueueAnalytics.findOneAndUpdate(
      { date: today },          // Find today's record
      { $inc: inc },            // Increment the rating field by 1
      { upsert: true, new: true }  // Create if not found
    )

    res.json(updated)

  } catch (err) {
    res.status(500).json({ message: 'Failed to submit rating', error: err.message })
  }
})

// Export the router so server.js can use it
module.exports = router