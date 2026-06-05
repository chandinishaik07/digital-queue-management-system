// ============================================================
// routes/authRoutes.js
// This file handles all authentication-related API routes.
// It manages user registration, login, profile update,
// and password change functionality.
//
// Base URL: /api/auth
// Routes:
//   POST   /api/auth/register          → Create new account
//   POST   /api/auth/login             → Login to account
//   PUT    /api/auth/update/:id        → Update name/email
//   PUT    /api/auth/change-password/:id → Change password
// ============================================================

const express = require('express')
const router  = express.Router()
const User    = require('../models/User')  // Import the User model to interact with MongoDB
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')


// ─────────────────────────────────────────────────────────────
// REGISTER
// Route:  POST /api/auth/register
// Access: Public (anyone can register)
// What it does:
//   1. Receives name, email, password from the request body
//   2. Checks if the email is already registered
//   3. Creates a new User document in MongoDB
//   4. Returns a success message
// ─────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    // Destructure the fields sent from the frontend form
    const { name, email, password, role } = req.body

    // Check if a user with this email already exists in the database
    const existing = await User.findOne({ email })
    if (existing) {
      // If email is taken, return an error — don't create duplicate accounts
      return res.status(400).json({ message: 'Email already registered' })
    }

    // Create a new User object with the received data
    // Role defaults to 'customer' if not provided
    const hashedPassword = await bcrypt.hash(password, 10)

    const user = new User({
    name,
    email,
    password: hashedPassword,
    role: role || 'customer'
    })

    // Save the new user to MongoDB
    await user.save()

    // Send success response back to the frontend
    res.json({ message: 'Registered successfully' })

  } catch (err) {
    // If anything goes wrong (e.g. database error), send error response
    res.status(500).json({ message: 'Registration failed', error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────
// LOGIN
// Route:  POST /api/auth/login
// Access: Public (anyone can attempt to login)
// What it does:
//   1. Receives email and password from the frontend
//   2. Searches for a user with that email in the database
//   3. Compares the password directly
//   4. If match, returns the user object to the frontend
//   5. Frontend uses the role to decide which page to show
// ─────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    // Get email and password from the request body
    const { email, password } = req.body

    // Search for a user in MongoDB with the given email
    const user = await User.findOne({ email })

    // If no user found with that email, return error
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    // Compare the entered password with the stored password directly
    const isMatch = await bcrypt.compare(
      password,
      user.password
    )

    if (!isMatch) {
      return res.status(401).json({
        message: 'Invalid credentials'
      })
    }
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '7d'
      }
    )

    // Login successful — send back user data (without password for safety)
    // The frontend will use the role field to route:
    //   admin    → /admin page
    //   agent    → /agent page
    //   customer → /dashboard page
    res.json({
      message: 'Login successful',
      token,
      user: {
        _id:   user._id,
        name:  user.name,
        email: user.email,
        role:  user.role
      }
    })

  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message })
  }
})

// ─────────────────────────────────────────────────────────────
// UPDATE PROFILE
// Route:  PUT /api/auth/update/:id
// Access: Logged in users
// What it does:
//   1. Receives new name and email from the Settings page
//   2. Finds the user by their MongoDB _id
//   3. Updates the name and email fields
//   4. Returns the updated user data
// ─────────────────────────────────────────────────────────────
router.put('/update/:id', async (req, res) => {
  try {
    // Get the new name and email from the request body
    const { name, email } = req.body

    // Find the user by ID and update their name and email
    // { new: true } means return the updated document, not the old one
    const updated = await User.findByIdAndUpdate(
      req.params.id,    // The user's MongoDB _id from the URL
      { name, email },  // Fields to update
      { new: true }     // Return updated document
    )

    // If no user found with that ID, return error
    if (!updated) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Return updated user data (without password)
    res.json({
      message: 'Profile updated successfully',
      user: {
        _id:   updated._id,
        name:  updated.name,
        email: updated.email,
        role:  updated.role
      }
    })

  } catch (err) {
    res.status(500).json({ message: 'Failed to update profile' })
  }
})

// ─────────────────────────────────────────────────────────────
// CHANGE PASSWORD
// Route:  PUT /api/auth/change-password/:id
// Access: Logged in users
// What it does:
//   1. Receives current password and new password
//   2. Finds the user by ID
//   3. Verifies the current password matches what is stored
//   4. Updates the password to the new one if verification passes
// ─────────────────────────────────────────────────────────────
router.put('/change-password/:id', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    // Find the user by their ID
    const user = await User.findById(req.params.id)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Check if the entered current password matches the stored password
    if (user.password !== currentPassword) {
      return res.status(400).json({ message: 'Current password is incorrect' })
    }

    // Basic validation — password must be at least 6 characters
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' })
    }

    // Update the password to the new one
    user.password = newPassword
    await user.save()

    res.json({ message: 'Password changed successfully' })

  } catch (err) {
    res.status(500).json({ message: 'Failed to change password' })
  }
})

// Export the router so server.js can use it
module.exports = router