// ============================================================
// models/User.js
// This file defines the structure of a User in the database.
// Every person who registers on QueuePro is stored here.
// We use Mongoose to define the schema (structure/shape of data).
// ============================================================

const mongoose = require('mongoose')

// Define the shape of a User document in MongoDB
const userSchema = new mongoose.Schema({

  // The full name of the user
  name: {
    type:     String,
    required: true   // Name is mandatory
  },

  // Email is used for login — must be unique so two users
  // cannot register with the same email
  email: {
    type:     String,
    required: true,
    unique:   true
  },

  // Password is stored as plain text here for simplicity
  // In production apps this would be hashed using bcrypt
  password: {
    type:     String,
    required: true
  },

  // Role decides what the user can see and do in the app
  // 'customer' → can join queue, see their token
  // 'agent'    → can call next token, manage their counter
  // 'admin'    → full access to everything
  role: {
    type:    String,
    default: 'customer'   // If no role is given, default to customer
  }

}, {
  // Automatically adds createdAt and updatedAt fields
  // to every document so we know when it was made/updated
  timestamps: true
})

// Export the model so other files (like routes) can use it
// 'User' is the model name, 'users' will be the collection name in MongoDB
module.exports = mongoose.model('User', userSchema)