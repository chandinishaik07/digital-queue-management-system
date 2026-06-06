// ============================================================
// pages/Login.jsx
// The login page where users sign in to their QueuePro account.
//
// How it works:
//   1. User enters email and password
//   2. Sends a POST request to /api/auth/login
//   3. Backend checks email and password against MongoDB
//   4. If correct, backend returns the user object with their role
//   5. Frontend saves user to localStorage (persists on refresh)
//   6. Redirects to different pages based on role:
//        admin    → /admin
//        agent    → /agent
//        customer → /dashboard
//
// Props received from App.jsx:
//   setIsLoggedIn → updates global login state
//   setIsAdmin    → updates global admin state
//   setIsAgent    → updates global agent state
//   setUser       → stores the logged-in user object globally
// ============================================================

import React, { useState } from 'react'
import { useNavigate }     from 'react-router-dom'
import Layout              from '../components/Layout'

export default function Login({ setIsLoggedIn, setIsAdmin, setIsAgent, setUser }) {

  // useNavigate lets us redirect the user after successful login
  const navigate = useNavigate()

  // ── STATE ──────────────────────────────────────────────
  const [email,    setEmail]    = useState('')     // Email input value
  const [password, setPassword] = useState('')     // Password input value
  const [error,    setError]    = useState('')     // Error message to show user
  const [loading,  setLoading]  = useState(false)  // Loading state for button

  // ── HANDLE LOGIN ───────────────────────────────────────
  // Called when the Login button is clicked
  const handleLogin = async () => {

    // Basic validation — don't send empty request to server
    if (!email || !password) {
      setError('Please fill all fields')
      return
    }

    setLoading(true)   // Show loading state on button
    setError('')       // Clear any previous error messages

    try {
      // Send POST request to backend login route
      const res = await fetch('https://queuepro-backend-2pl7.onrender.com/api/auth/login', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },  // Tell server we're sending JSON
        body:    JSON.stringify({ email, password })        // Convert object to JSON string
      })

      // Parse the JSON response from the server
      const data = await res.json()

      // If server returned an error status or no user, show error
      if (!res.ok || !data.user) {
        setError(data.message || 'Invalid credentials')
        setLoading(false)
        return
      }

      // ── LOGIN SUCCESSFUL ─────────────────────────────
      // Save user data to localStorage so login persists on page refresh
      localStorage.setItem('user', JSON.stringify(data.user))
      localStorage.setItem('token', data.token)
      localStorage.setItem('role', data.user.role)

      // Update global state in App.jsx
      setIsLoggedIn(true)
      setUser(data.user)

      // Route user to the correct page based on their role
      if (data.user.role === 'admin') {
        setIsAdmin(true)
        setIsAgent(false)
        navigate('/admin')           // Admins go to Admin Dashboard

      } else if (data.user.role === 'agent') {
        setIsAdmin(false)
        setIsAgent(true)
        navigate('/agent')           // Agents go to Agent Dashboard

      } else {
        // Default — customer role
        setIsAdmin(false)
        setIsAgent(false)
        navigate('/dashboard')       // Customers go to their Dashboard
      }

    } catch (err) {
      // Network error — server might not be running
      console.error(err)
      setError('Login failed. Is the server running?')
    } finally {
      setLoading(false)   // Always stop loading, success or fail
    }
  }

  return (
    <Layout isAdmin={false}>
      <div className="max-w-xl mx-auto mt-20 rounded-3xl bg-white/10 p-8 shadow-2xl">

        {/* Page title */}
        <h1 className="text-white text-5xl font-bold mb-2 text-center">Login</h1>
        <p className="text-white/40 text-center text-lg mb-8">
          Sign in to your QueuePro account
        </p>

        <div className="space-y-4">

          {/* Email input field */}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}  // Update state on every keystroke
            className="w-full p-4 rounded-2xl bg-white/10 text-white placeholder:text-white/40 outline-none border border-white/10 focus:border-cyan-400/50 transition-colors text-xl"
          />

          {/* Password input field */}
          {/* onKeyDown allows pressing Enter to submit the form */}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}  // Submit on Enter key
            className="w-full p-4 rounded-2xl bg-white/10 text-white placeholder:text-white/40 outline-none border border-white/10 focus:border-cyan-400/50 transition-colors text-xl"
          />

          {/* Error message — only shown when error state is not empty */}
          {error && (
            <p className="text-rose-400 text-lg">{error}</p>
          )}

          {/* Login button — disabled and shows loading text while request is in progress */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className={`w-full py-4 rounded-2xl font-bold text-xl transition-colors ${
              loading
                ? 'bg-cyan-300 text-black/50 cursor-not-allowed'  // Disabled style
                : 'bg-cyan-400 text-black hover:bg-cyan-300'       // Normal style
            }`}
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>

          {/* Link to Register page */}
          <p className="text-center text-white/60 text-lg pt-2">
            Don't have an account?{' '}
            <button
              onClick={() => navigate('/register')}
              className="text-cyan-300 hover:text-cyan-200 font-semibold transition-colors"
            >
              Register
            </button>
          </p>

        </div>
      </div>
    </Layout>
  )
}