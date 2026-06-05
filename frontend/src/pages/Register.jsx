// ============================================================
// pages/Register.jsx
// The registration page where new users create an account.
//
// How it works:
//   1. User fills in name, email, password, confirm password
//   2. Frontend validates all fields before sending to server
//   3. Sends POST request to /api/auth/register
//   4. Backend creates a new user in MongoDB
//   5. Shows success toast and redirects to Login page
//
// All new accounts are created with role 'customer' by default.
// Agent accounts are created separately through the seed script
// or directly in MongoDB by the admin.
// ============================================================

import React, { useState } from 'react'
import { useNavigate }     from 'react-router-dom'
import Layout              from '../components/Layout'

export default function Register() {

  // useNavigate for redirecting after registration
  const navigate = useNavigate()

  // ── STATE ──────────────────────────────────────────────
  const [name,            setName]            = useState('')  // Full name input
  const [email,           setEmail]           = useState('')  // Email input
  const [password,        setPassword]        = useState('')  // Password input
  const [confirmPassword, setConfirmPassword] = useState('')  // Confirm password input
  const [toast,           setToast]           = useState('')  // Toast notification message

  // ── SHOW TOAST ─────────────────────────────────────────
  // Displays a notification message for 3 seconds then hides it
  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)  // Clear toast after 3 seconds
  }

  // ── HANDLE REGISTER ────────────────────────────────────
  // Called when the Create Account button is clicked
  const handleRegister = async () => {

    // Validation — check all fields are filled
    if (!name || !email || !password || !confirmPassword) {
      showToast('Please fill all fields')
      return
    }

    // Validation — passwords must match
    if (password !== confirmPassword) {
      showToast('Passwords do not match')
      return
    }

    // Validation — password must be at least 6 characters
    if (password.length < 6) {
      showToast('Password must be at least 6 characters')
      return
    }

    try {
      // Send POST request to backend register route
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, email, password })
        // role is not sent — backend defaults it to 'customer'
      })

      const data = await res.json()

      if (!res.ok) {
        // Registration failed — show error from server
        showToast(data.message || 'Registration failed')
        return
      }

      // Registration successful
      showToast('Account created successfully! Redirecting to login...')

      // Wait 1.5 seconds so user can see the success message
      // then redirect to the login page
      setTimeout(() => navigate('/login'), 1500)

    } catch (err) {
      console.error(err)
      showToast('Error registering. Is the server running?')
    }
  }

  return (
    <Layout>

      {/* Toast notification — fixed at top right, only shown when toast has a message */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl bg-cyan-400 text-slate-900 font-semibold text-lg shadow-2xl">
          {toast}
        </div>
      )}

      {/* Two-column layout — left panel (info) + right panel (form) */}
      <div className="max-w-7xl mx-auto grid grid-cols-2 rounded-[28px] overflow-hidden border border-white/10 shadow-2xl">

        {/* ── LEFT PANEL ───────────────────────────────── */}
        {/* Decorative panel with app info — no interactive elements */}
        <div className="p-12 bg-gradient-to-br from-violet-500 via-fuchsia-600 to-cyan-500 flex flex-col justify-center">
          <p className="text-white/70 tracking-[8px] text-lg mb-4">CREATE ACCOUNT</p>

          <h1 className="text-white text-7xl font-bold leading-tight">
            Join QueuePro
          </h1>

          <p className="text-white/85 text-2xl mt-6 leading-relaxed max-w-2xl">
            Register to book tokens faster, receive notifications, manage your
            queue experience, and access smart digital queue services.
          </p>

          <div className="mt-8 rounded-3xl bg-white/15 border border-white/20 p-6 text-white text-xl">
            One account. Faster queues. Better experience.
          </div>
        </div>

        {/* ── RIGHT PANEL ──────────────────────────────── */}
        {/* Registration form */}
        <div className="bg-white/10 backdrop-blur-xl p-12">
          <h2 className="text-white text-5xl font-bold mb-8">Sign Up</h2>

          <div className="space-y-5">

            {/* Full name input */}
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-5 py-5 rounded-2xl bg-white/10 border border-white/10 text-white placeholder:text-white/50 text-xl outline-none"
            />

            {/* Email input */}
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-5 py-5 rounded-2xl bg-white/10 border border-white/10 text-white placeholder:text-white/50 text-xl outline-none"
            />

            {/* Password input */}
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-5 py-5 rounded-2xl bg-white/10 border border-white/10 text-white placeholder:text-white/50 text-xl outline-none"
            />

            {/* Confirm password input */}
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-5 py-5 rounded-2xl bg-white/10 border border-white/10 text-white placeholder:text-white/50 text-xl outline-none"
            />

            {/* Submit button */}
            <button
              onClick={handleRegister}
              className="w-full py-5 rounded-2xl bg-cyan-400 text-[#111827] text-2xl font-bold shadow-lg hover:bg-cyan-300 transition-colors"
            >
              Create Account
            </button>

            {/* Divider text */}
            <div className="text-center text-white/50 text-lg">
              or continue with
            </div>

            {/* Social login buttons — show coming soon toast since OAuth not implemented */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => showToast('Google login coming soon!')}
                className="py-4 rounded-2xl bg-white/10 border border-white/10 text-white text-lg hover:bg-white/15 transition-colors"
              >
                Continue with Google
              </button>

              <button
                onClick={() => showToast('Apple login coming soon!')}
                className="py-4 rounded-2xl bg-white/10 border border-white/10 text-white text-lg hover:bg-white/15 transition-colors"
              >
                Continue with Apple
              </button>
            </div>

            {/* Link to Login page for existing users */}
            <p className="text-center text-white/60 text-lg pt-2">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-cyan-300 hover:text-cyan-200 font-semibold transition-colors"
              >
                Login
              </button>
            </p>

          </div>
        </div>
      </div>
    </Layout>
  )
}