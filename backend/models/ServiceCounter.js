// ============================================================
// models/ServiceCounter.js
// This file defines the structure of a Service Counter.
// A service counter is a physical desk/window where an agent
// sits and serves customers (e.g. Counter 1, Counter 2).
// The admin can manage counters from the Admin Dashboard.
// ============================================================

const mongoose = require('mongoose')

// Define the shape of a ServiceCounter document in MongoDB
const serviceCounterSchema = new mongoose.Schema({

  // The display name of the counter
  // e.g. 'Counter 1', 'Counter 2'
  counterName: {
    type:     String,
    required: true
  },

  // Reference to which agent is currently assigned to this counter
  // ObjectId links to a document in the 'users' collection
  // null means no agent is assigned yet
  assignedAgent: {
    type:    mongoose.Schema.Types.ObjectId,
    ref:     'User',    // This refers to the User model
    default: null
  },

  // Current availability status of the counter
  // 'open'  → counter is available and serving customers
  // 'busy'  → counter is occupied / agent is with a customer
  // 'break' → counter is temporarily closed (agent on break)
  status: {
    type:    String,
    default: 'open'
  }

}, {
  // Automatically adds createdAt and updatedAt timestamps
  timestamps: true
})

// Export the model
// Maps to 'ServiceCounters' collection in MongoDB Atlas
module.exports = mongoose.model('ServiceCounter', serviceCounterSchema, 'ServiceCounters')