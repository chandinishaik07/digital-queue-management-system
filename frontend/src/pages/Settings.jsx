// ============================================================
// pages/Settings.jsx
// The Settings page — accessible to all logged-in users.
// Allows users to update their profile and manage their account.
//
// Sections:
//   1. Profile — update name and email (saved to MongoDB)
//   2. Preferences — display-only settings (Dark Mode, Language etc.)
//   3. Security — Change Password, 2FA (coming soon), Logout
//
// Props received from App.jsx:
//   user      → the currently logged-in user object
//   onLogout  → function that clears state and localStorage
//
// API calls:
//   PUT /api/auth/update/:id         → update name and email
//   PUT /api/auth/change-password/:id → verify old and set new password
// ============================================================

import React, { useState } from 'react'
import { useNavigate }     from 'react-router-dom'
import Layout              from '../components/Layout'

export default function Settings({ user, onLogout }) {

  const navigate = useNavigate()

  // ── STATE ──────────────────────────────────────────────
  // Pre-fill name and email from the logged-in user object
  const [name,            setName]            = useState(user?.name  || '')
  const [email,           setEmail]           = useState(user?.email || '')

  // Password change form state
  const [showPassForm,    setShowPassForm]    = useState(false)  // Toggle form visibility
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword,     setNewPassword]     = useState('')
  const [confirmNew,      setConfirmNew]      = useState('')

  // Toast notification state — msg is the text, type controls color
  const [toast, setToast] = useState({ msg: '', type: 'success' })

  // ── SHOW TOAST ─────────────────────────────────────────
  // type = 'success' → cyan, type = 'error' → rose/red
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3000)
  }

  // ── SAVE PROFILE CHANGES ───────────────────────────────
  // Sends updated name and email to the backend
  const handleSave = async () => {

    // Basic validation
    if (!name || !email) {
      showToast('Name and email cannot be empty', 'error')
      return
    }

    // Must be logged in to update profile
    if (!user?._id) {
      showToast('Please log in to save changes', 'error')
      return
    }

    try {
      // PUT request to update the user's name and email in MongoDB
      const res = await fetch(`http://localhost:5000/api/auth/update/${user._id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name, email })
      })

      const data = await res.json()

      if (res.ok) {
        showToast(data.message || 'Profile updated!')
        // Update localStorage so the new name persists on refresh
        localStorage.setItem('user', JSON.stringify({ ...user, name, email }))
      } else {
        showToast(data.message || 'Failed to update', 'error')
      }

    } catch {
      showToast('Something went wrong', 'error')
    }
  }

  // ── CHANGE PASSWORD ────────────────────────────────────
  // Verifies the current password then updates to new password
  const handleChangePassword = async () => {

    // All fields must be filled
    if (!currentPassword || !newPassword || !confirmNew) {
      showToast('Please fill all password fields', 'error')
      return
    }

    // New password and confirmation must match
    if (newPassword !== confirmNew) {
      showToast('New passwords do not match', 'error')
      return
    }

    // Minimum password length check
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters', 'error')
      return
    }

    if (!user?._id) {
      showToast('Please log in first', 'error')
      return
    }

    try {
      const res = await fetch(
        `http://localhost:5000/api/auth/change-password/${user._id}`,
        {
          method:  'PUT',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ currentPassword, newPassword })
        }
      )

      const data = await res.json()

      if (res.ok) {
        showToast(data.message || 'Password changed!')
        // Clear the form and hide it after success
        setCurrentPassword('')
        setNewPassword('')
        setConfirmNew('')
        setShowPassForm(false)
      } else {
        showToast(data.message || 'Failed to change password', 'error')
      }

    } catch {
      showToast('Something went wrong', 'error')
    }
  }

  // ── LOGOUT ─────────────────────────────────────────────
  // Calls the logout handler from App.jsx which clears
  // both React state and localStorage, then redirects to login
  const handleLogout = () => {
    onLogout()           // Clear global state and localStorage
    navigate('/login')   // Redirect to login page
  }

  // Preferences — display only for now
  // These labels show current settings but toggling is not implemented
  const preferences = [
    ['Dark Mode',     'On'     ],
    ['Email Alerts',  'Enabled'],
    ['Language',      'English'],
    ['Notifications', 'All'    ]
  ]

  return (
    <Layout>

      {/* Toast notification — shown at top right of screen */}
      {toast.msg && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl font-semibold text-lg shadow-2xl ${
          toast.type === 'error'
            ? 'bg-rose-400 text-white'        // Red for errors
            : 'bg-cyan-400 text-slate-900'    // Cyan for success
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="space-y-6">

        <h1 className="text-white text-5xl font-bold">Settings</h1>

        {/* ── TOP GRID: Profile + Preferences ──────────── */}
        <div className="grid grid-cols-2 gap-6">

          {/* Profile Section */}
          <section className="rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl">
            <h2 className="text-white text-3xl font-semibold mb-6">Profile</h2>

            <div className="space-y-5">

              {/* Name input — pre-filled with current user name */}
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-5 py-5 rounded-2xl bg-white/10 border border-white/10 text-white placeholder:text-white/50 text-xl outline-none"
              />

              {/* Email input — pre-filled with current user email */}
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-5 py-5 rounded-2xl bg-white/10 border border-white/10 text-white placeholder:text-white/50 text-xl outline-none"
              />

              <div className="flex items-center gap-4">
                {/* Save button — sends update to backend */}
                <button
                  onClick={handleSave}
                  className="px-8 py-4 rounded-2xl bg-cyan-400 text-[#111827] text-xl font-bold hover:bg-cyan-300 transition-colors"
                >
                  Save Changes
                </button>

                {/* Role badge — shows the user's role (admin/agent/customer) */}
                {user?.role && (
                  <span className="px-4 py-2 rounded-full bg-violet-400/20 text-violet-300 text-sm font-semibold capitalize">
                    {user.role}
                  </span>
                )}
              </div>
            </div>
          </section>

          {/* Preferences Section — display only */}
          <section className="rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl">
            <h2 className="text-white text-3xl font-semibold mb-6">Preferences</h2>
            <div className="space-y-5">
              {preferences.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between text-xl">
                  <span className="text-white/80">{label}</span>
                  <span className="text-cyan-300 font-medium">{value}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ── SECURITY SECTION ─────────────────────────── */}
        <section className="rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl">
          <h2 className="text-white text-3xl font-semibold mb-6">Security</h2>

          <div className="grid grid-cols-3 gap-5">

            {/* Change Password toggle button — shows/hides the form below */}
            <button
              onClick={() => setShowPassForm(p => !p)}
              className="py-5 rounded-2xl border bg-white/10 border-white/10 text-white text-xl font-medium hover:bg-white/15 transition-colors"
            >
              Change Password
            </button>

            {/* 2FA Setup — not implemented yet, shows coming soon toast */}
            <button
              onClick={() => showToast('2FA setup coming soon!')}
              className="py-5 rounded-2xl border bg-white/10 border-white/10 text-white text-xl font-medium hover:bg-white/15 transition-colors"
            >
              2FA Setup
            </button>

            {/* Logout button — red style to indicate destructive action */}
            <button
              onClick={handleLogout}
              className="py-5 rounded-2xl border bg-rose-500/20 border-rose-400/20 text-rose-300 text-xl font-medium hover:bg-rose-500/30 transition-colors"
            >
              Logout
            </button>
          </div>

          {/* Change Password Form — only shown when showPassForm is true */}
          {showPassForm && (
            <div className="mt-6 rounded-2xl bg-white/5 border border-white/10 p-6 space-y-4">
              <h3 className="text-white text-2xl font-semibold mb-2">
                Change Password
              </h3>

              {/* Current password — verified on backend before changing */}
              <input
                type="password"
                placeholder="Current Password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl bg-white/10 border border-white/10 text-white placeholder:text-white/50 text-xl outline-none"
              />

              {/* New password */}
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl bg-white/10 border border-white/10 text-white placeholder:text-white/50 text-xl outline-none"
              />

              {/* Confirm new password — must match new password */}
              <input
                type="password"
                placeholder="Confirm New Password"
                value={confirmNew}
                onChange={e => setConfirmNew(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl bg-white/10 border border-white/10 text-white placeholder:text-white/50 text-xl outline-none"
              />

              <div className="flex gap-4 pt-2">
                {/* Submit new password */}
                <button
                  onClick={handleChangePassword}
                  className="px-8 py-4 rounded-2xl bg-cyan-400 text-slate-900 text-xl font-bold hover:bg-cyan-300 transition-colors"
                >
                  Update Password
                </button>

                {/* Cancel — hides form and clears fields */}
                <button
                  onClick={() => {
                    setShowPassForm(false)
                    setCurrentPassword('')
                    setNewPassword('')
                    setConfirmNew('')
                  }}
                  className="px-8 py-4 rounded-2xl bg-white/10 text-white text-xl hover:bg-white/15 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </Layout>
  )
}