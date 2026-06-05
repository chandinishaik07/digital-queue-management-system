// ============================================================
// App.jsx
// This is the root component of the entire React application.
// It sets up client-side routing using React Router.
//
// Responsibilities:
//   1. Stores global authentication state (isLoggedIn, role, user)
//   2. Persists login state across page refreshes using localStorage
//   3. Defines all routes and which component renders for each URL
//   4. Protects certain routes based on login status and role
//
// Role-based routing:
//   admin    → /admin (Admin Dashboard)
//   agent    → /agent (Agent Dashboard)
//   customer → /dashboard (Customer Dashboard)
// ============================================================

import React, { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// Import all page components
import Home              from './pages/Home'
import Dashboard         from './pages/Dashboard'          // Admin analytics view
import CustomerDashboard from './pages/CustomerDashboard'  // Customer token view
import AgentDashboard    from './pages/AgentDashboard'     // Agent work view
import Monitoring        from './pages/Monitoring'
import Token             from './pages/Token'
import Notifications     from './pages/Notifications'
import Login             from './pages/Login'
import Register          from './pages/Register'
import Settings          from './pages/Settings'
import Admin             from './pages/Admin'

export default function App() {

  // ── GLOBAL AUTH STATE ──────────────────────────────────
  // These state variables track who is logged in
  // and what role they have across the entire app

  const [isLoggedIn, setIsLoggedIn] = useState(false)  // Is anyone logged in?
  const [isAdmin,    setIsAdmin]    = useState(false)   // Is the user an admin?
  const [isAgent,    setIsAgent]    = useState(false)   // Is the user an agent?
  const [user,       setUser]       = useState(null)    // The logged-in user object

  // ── PERSIST LOGIN ACROSS REFRESH ───────────────────────
  // useEffect runs once when the app first loads
  // It checks localStorage to see if a user was previously logged in
  // If yes, restore their session so they don't have to log in again
  useEffect(() => {
    // Try to get saved user data from localStorage
    const savedUser = localStorage.getItem('user')
    const savedRole = localStorage.getItem('role')

    // If saved user data exists, restore the login state
    if (savedUser) {
      const parsed = JSON.parse(savedUser)   // Convert JSON string back to object
      setIsLoggedIn(true)
      setUser(parsed)
      setIsAdmin(savedRole === 'admin')
      setIsAgent(savedRole === 'agent')
    }
  }, [])  // Empty array means this only runs once on app load

  // ── LOGOUT HANDLER ─────────────────────────────────────
  // Clears all auth state and removes data from localStorage
  // Called from Settings page when user clicks Logout
  const handleLogout = () => {
    localStorage.removeItem('user')   // Remove saved user data
    localStorage.removeItem('role')   // Remove saved role
    setIsLoggedIn(false)
    setIsAdmin(false)
    setIsAgent(false)
    setUser(null)
  }

  return (
    // BrowserRouter enables client-side routing
    // All Route definitions must be inside this
    <BrowserRouter>
      <Routes>

        {/* ── PUBLIC ROUTES ────────────────────────────── */}
        {/* These pages are accessible without logging in */}

        {/* Home page — landing page */}
        <Route path="/" element={<Home />} />

        {/* Monitoring — public, anyone can view live queue status */}
        <Route path="/monitoring" element={<Monitoring />} />

        {/* Token page — customers can join queue without logging in */}
        <Route path="/token" element={<Token />} />

        {/* Notifications — live queue alerts */}
        <Route path="/notifications" element={<Notifications />} />

        {/* Login page — passes setters so Login can update global state */}
        <Route
          path="/login"
          element={
            <Login
              setIsLoggedIn={setIsLoggedIn}
              setIsAdmin={setIsAdmin}
              setIsAgent={setIsAgent}
              setUser={setUser}
            />
          }
        />

        {/* Register page — create a new account */}
        <Route path="/register" element={<Register />} />

        {/* Settings — passes user data and logout handler */}
        <Route
          path="/settings"
          element={
            <Settings
              user={user}
              onLogout={handleLogout}
            />
          }
        />

        {/* ── PROTECTED ROUTES ─────────────────────────── */}
        {/* These pages require login and check role */}

        {/* Dashboard — shows different content based on role:
            admin    → full analytics Dashboard
            customer → CustomerDashboard with their token info
            not logged in → redirect to login page */}
        <Route
          path="/dashboard"
          element={
            !isLoggedIn
              ? <Navigate to="/login" replace />      // Not logged in → go to login
              : isAdmin
                ? <Dashboard />                        // Admin → analytics dashboard
                : <CustomerDashboard user={user} />    // Customer → token dashboard
          }
        />

        {/* Agent Dashboard — only accessible to agents and admins */}
        <Route
          path="/agent"
          element={
            !isLoggedIn
              ? <Navigate to="/login" replace />
              : (isAgent || isAdmin)
                ? <AgentDashboard user={user} />
                : <Navigate to="/dashboard" replace />  // Non-agents go to dashboard
          }
        />

        {/* Admin page — only accessible to admins */}
        <Route
          path="/admin"
          element={
            isLoggedIn && isAdmin
              ? <Admin />
              : <Navigate to="/login" replace />   // Non-admins redirected to login
          }
        />

      </Routes>
    </BrowserRouter>
  )
}