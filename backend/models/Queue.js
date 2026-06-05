// ============================================================
// models/Queue.js
// This file defines the structure of a Queue Token.
// Every time a customer joins the queue, a new Queue
// document is created and stored in MongoDB.
// ============================================================

const mongoose = require('mongoose')

const queueSchema = new mongoose.Schema({

  // The name of the customer who joined the queue
  name: {
    type:     String,
    required: true
  },

  // The service the customer needs
  // e.g. 'General Service', 'Billing', 'Support'
  service: {
    type:     String,
    required: true
  },

  // Auto-generated token number
  // Each new token gets the next number in sequence (1, 2, 3...)
  tokenNumber: {
    type:     Number,
    required: true
  },

  // The current status of this token in the queue
  // 'waiting'   → customer is waiting their turn
  // 'serving'   → customer is currently being served
  // 'completed' → service is done
  status: {
    type:    String,
    default: 'waiting'
  },

  // Appointment time assigned by an agent
  // e.g. "14:30" or "2:30 PM"
  // null means no appointment time has been assigned yet
  // When an agent assigns a time, this field gets updated
  appointmentTime: {
    type:    String,
    default: null
  },

  // Which agent assigned the appointment time
  // Stores the agent's name for display purposes
  assignedBy: {
    type:    String,
    default: null
  }

}, {
  // Automatically adds createdAt and updatedAt fields
  timestamps: true
})

// Export the model
// 'Queue' is the model name, 'queues' will be the collection in MongoDB
module.exports = mongoose.model('Queue', queueSchema)