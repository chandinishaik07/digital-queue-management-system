// ============================================================
// routes/counterRoutes.js
// This file handles all service counter related API routes.
// Service counters are the physical desks where agents sit
// and serve customers. Admin can manage them from the dashboard.
//
// Base URL: /api/counters
// Routes:
//   GET  /api/counters              → Get all counters with agent info
//   GET  /api/counters/agents       → Get all agents (users with role 'agent')
//   PUT  /api/counters/:id/status   → Change counter status (open/busy/break)
//   PUT  /api/counters/:id/assign   → Assign an agent to a counter
// ============================================================

const express        = require('express')
const router         = express.Router()
const ServiceCounter = require('../models/ServiceCounter')  // Counter model
const User           = require('../models/User')            // User model (for agents)
const auth = require('../middleware/auth')
const admin = require('../middleware/admin')

// ─────────────────────────────────────────────────────────────
// GET ALL COUNTERS
// Route:  GET /api/counters
// Access: Public
// What it does:
//   Retrieves all service counters from the database.
//   Uses .populate() to replace the assignedAgent ObjectId
//   with the actual agent's name and email from the users collection.
//   This way the frontend gets full agent info, not just an ID.
// ─────────────────────────────────────────────────────────────
router.get('/',auth,admin, async (req, res) => {
  try {
    // Find all counters and populate the assignedAgent field
    // .populate('assignedAgent') automatically fetches the User document
    // that matches the assignedAgent ObjectId
    const counters = await ServiceCounter.find().populate('assignedAgent')
    res.json(counters)
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch counters', error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────
// GET ALL AGENTS
// Route:  GET /api/counters/agents
// Access: Admin
// What it does:
//   Retrieves all users who have the role of 'agent'
//   Used to populate the "Assign Agent" dropdown in Admin page
// ─────────────────────────────────────────────────────────────
router.get('/agents', async (req, res) => {
  try {
    // Find all users where role is 'agent'
    const agents = await User.find({ role: 'agent' })
    res.json(agents)
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch agents', error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────
// UPDATE COUNTER STATUS
// Route:  PUT /api/counters/:id/status
// Access: Admin
// What it does:
//   Changes the status of a specific counter.
//   Status cycles: open → busy → break → open
//   Admin clicks the status badge in Counter Overview to toggle it.
// ─────────────────────────────────────────────────────────────
router.put('/:id/status',auth,admin, async (req, res) => {
  try {
    // Update the counter's status with the new value from request body
    const updated = await ServiceCounter.findByIdAndUpdate(
      req.params.id,                    // Counter's MongoDB _id from URL
      { status: req.body.status },      // New status (open/busy/break)
      { new: true }                     // Return the updated document
    ).populate('assignedAgent')         // Include agent info in response

    if (!updated) {
      return res.status(404).json({ message: 'Counter not found' })
    }

    res.json(updated)
  } catch (err) {
    res.status(500).json({ message: 'Failed to update counter status', error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────
// ASSIGN AGENT TO COUNTER
// Route:  PUT /api/counters/:id/assign
// Access: Admin
// What it does:
//   1. Removes the agent from any counter they are currently assigned to
//      (an agent can only be at one counter at a time)
//   2. Assigns the agent to the selected counter
//   3. Returns the updated counter with agent info
// ─────────────────────────────────────────────────────────────
router.put('/:id/assign',auth,admin, async (req, res) => {
  try {
    const { agentId } = req.body  // The agent's user ID from request body

    // Step 1: Remove this agent from any counter they're currently assigned to
    // This prevents the same agent from appearing at two counters
    await ServiceCounter.updateMany(
      { assignedAgent: agentId },   // Find counters where this agent is assigned
      { assignedAgent: null }       // Remove them (set to null)
    )

    // Step 2: Assign the agent to the selected counter
    const counter = await ServiceCounter.findByIdAndUpdate(
      req.params.id,                        // Counter ID from URL
      { assignedAgent: agentId },           // Set the new agent
      { new: true }                         // Return updated document
    ).populate('assignedAgent')             // Include full agent details

    if (!counter) {
      return res.status(404).json({ message: 'Counter not found' })
    }

    res.json(counter)
  } catch (err) {
    res.status(500).json({ message: 'Failed to assign agent', error: err.message })
  }
})

// Export the router so server.js can use it
module.exports = router