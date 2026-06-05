// ============================================================
// routes/queueRoutes.js
// This file handles all queue-related API routes.
//
// Base URL: /api/queue
// Routes:
//   POST   /api/queue/add                → Generate a new token
//   GET    /api/queue                    → Get all tokens
//   PUT    /api/queue/next               → Call the next waiting token
//   GET    /api/queue/notifications      → Get live notifications
//   PUT    /api/queue/:id/appointment    → Assign appointment time to a token
//   PUT    /api/queue/:id                → Update a token's status
//   DELETE /api/queue/:id                → Delete a token
// ============================================================

const express = require('express')
const router  = express.Router()
const Queue   = require('../models/Queue')

// ─────────────────────────────────────────────────────────────
// ADD TOKEN
// Route:  POST /api/queue/add
// What it does:
//   Finds the last token number and increments by 1
//   Creates a new token with status 'waiting'
// ─────────────────────────────────────────────────────────────
router.post('/add', async (req, res) => {
  try {
    // Find the highest token number currently in the database
    const last = await Queue.findOne().sort({ tokenNumber: -1 })

    // If tokens exist increment by 1, otherwise start at 1
    const newToken = last ? last.tokenNumber + 1 : 1

    const token = new Queue({
      name:        req.body.name,
      service:     req.body.service,
      tokenNumber: newToken
      // status defaults to 'waiting'
      // appointmentTime defaults to null
    })

    await token.save()
    res.json(token)

  } catch (err) {
    res.status(500).json({ message: 'Failed to add token', error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────
// GET QUEUE
// Route:  GET /api/queue
// What it does:
//   Returns all tokens sorted by tokenNumber ascending
// ─────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const data = await Queue.find().sort({ tokenNumber: 1 })
    res.json(data)
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch queue', error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────
// CALL NEXT TOKEN
// Route:  PUT /api/queue/next
// What it does:
//   1. Marks all currently 'serving' tokens as 'completed'
//   2. Finds the next 'waiting' token (lowest number)
//   3. Changes its status to 'serving'
// ─────────────────────────────────────────────────────────────
router.put('/next', async (req, res) => {
  try {
    // Complete any currently serving tokens first
    await Queue.updateMany(
      { status: 'serving' },
      { status: 'completed' }
    )

    // Find the next waiting token (first in, first out)
    const next = await Queue.findOne({ status: 'waiting' })
      .sort({ tokenNumber: 1 })

    if (!next) {
      return res.json({ message: 'No users waiting' })
    }

    next.status = 'serving'
    await next.save()

    res.json(next)

  } catch (err) {
    res.status(500).json({ message: 'Failed to call next token', error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────
// GET NOTIFICATIONS
// Route:  GET /api/queue/notifications
// What it does:
//   Generates real-time notifications from queue data
//   Different notification types based on token status and age
// ─────────────────────────────────────────────────────────────
router.get('/notifications', async (req, res) => {
  try {
    const queue         = await Queue.find().sort({ createdAt: -1 })
    const now           = Date.now()
    const notifications = []

    queue.forEach(token => {
      const ageInMinutes = Math.floor(
        (now - new Date(token.createdAt).getTime()) / 60000
      )

      if (token.status === 'serving') {
        // Token currently being served
        notifications.push({
          _id:      token._id + '_serving',
          message:  `Token #${token.tokenNumber} — ${token.name} is now being served`,
          time:     'Now',
          tag:      'Serving',
          style:    'bg-emerald-400/20 text-emerald-300',
          priority: 1
        })

      } else if (token.status === 'waiting' && token.appointmentTime) {
        // Token has an appointment time assigned by agent
        notifications.push({
          _id:      token._id + '_appointment',
          message:  `Token #${token.tokenNumber} — ${token.name} has appointment at ${token.appointmentTime}`,
          time:     ageInMinutes < 1 ? 'Just now' : `${ageInMinutes} min ago`,
          tag:      'Scheduled',
          style:    'bg-blue-400/20 text-blue-300',
          priority: 2
        })

      } else if (token.status === 'waiting' && ageInMinutes >= 10) {
        // Waiting too long — high priority
        notifications.push({
          _id:      token._id + '_urgent',
          message:  `Token #${token.tokenNumber} — ${token.name} has been waiting ${ageInMinutes} min`,
          time:     `${ageInMinutes} min ago`,
          tag:      'High Priority',
          style:    'bg-rose-400/20 text-rose-300',
          priority: 3
        })

      } else if (token.status === 'waiting' && ageInMinutes < 10) {
        // Recently joined
        notifications.push({
          _id:      token._id + '_queued',
          message:  `Token #${token.tokenNumber} — ${token.name} joined the queue (${token.service})`,
          time:     ageInMinutes < 1 ? 'Just now' : `${ageInMinutes} min ago`,
          tag:      'Queued',
          style:    'bg-cyan-400/20 text-cyan-300',
          priority: 4
        })

      } else if (token.status === 'completed') {
        // Service completed
        notifications.push({
          _id:      token._id + '_done',
          message:  `Token #${token.tokenNumber} — ${token.name} completed (${token.service})`,
          time:     ageInMinutes < 1 ? 'Just now' : `${ageInMinutes} min ago`,
          tag:      'Completed',
          style:    'bg-violet-400/20 text-violet-300',
          priority: 5
        })
      }
    })

    // Sort by priority — most urgent first
    notifications.sort((a, b) => a.priority - b.priority)

    res.json(notifications)

  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch notifications', error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────
// ASSIGN APPOINTMENT TIME
// Route:  PUT /api/queue/:id/appointment
// Access: Agent / Admin
// What it does:
//   Allows an agent to assign a specific time to a waiting token
//   e.g. "Come at 2:30 PM"
//   Saves the appointmentTime and the agent's name to the token
// ─────────────────────────────────────────────────────────────
router.put('/:id/appointment', async (req, res) => {
  try {
    const { appointmentTime, assignedBy } = req.body

    // Validate that a time was provided
    if (!appointmentTime) {
      return res.status(400).json({ message: 'Appointment time is required' })
    }

    // Find the token and update its appointmentTime and assignedBy fields
    const updated = await Queue.findByIdAndUpdate(
      req.params.id,
      {
        appointmentTime,          // The time string e.g. "14:30"
        assignedBy: assignedBy || 'Agent'  // Who assigned it
      },
      { new: true }               // Return the updated document
    )

    if (!updated) {
      return res.status(404).json({ message: 'Token not found' })
    }

    res.json({
      message: `Appointment set for Token #${updated.tokenNumber} at ${appointmentTime}`,
      token:   updated
    })

  } catch (err) {
    res.status(500).json({ message: 'Failed to assign appointment', error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────
// UPDATE TOKEN STATUS
// Route:  PUT /api/queue/:id
// What it does:
//   Updates a specific token's status
//   e.g. 'serving' → 'completed'
// ─────────────────────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const updated = await Queue.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    )

    if (!updated) {
      return res.status(404).json({ message: 'Token not found' })
    }

    res.json(updated)

  } catch (err) {
    res.status(500).json({ message: 'Failed to update token', error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────
// DELETE TOKEN
// Route:  DELETE /api/queue/:id
// What it does: Permanently removes a token from the database
// ─────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    await Queue.findByIdAndDelete(req.params.id)
    res.json({ message: 'Token deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete token', error: err.message })
  }
})

module.exports = router