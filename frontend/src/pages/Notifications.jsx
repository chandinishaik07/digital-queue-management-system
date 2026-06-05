// ============================================================
// pages/Notifications.jsx
// The Notifications page — shows live alerts based on queue activity.
//
// Instead of storing notifications in a separate collection,
// notifications are generated dynamically from queue data.
// The backend route GET /api/queue/notifications reads the queue
// and generates appropriate alerts based on token status and age.
//
// Notification types:
//   Serving      → token is currently being called (green)
//   High Priority → token waiting over 10 minutes (red)
//   Completed    → token service finished (purple)
//   Queued       → token recently joined queue (cyan)
//
// Auto-refreshes every 15 seconds to show latest alerts.
// ============================================================

import React, { useEffect, useState } from 'react'
import Layout from '../components/Layout'

export default function Notifications() {

  // ── STATE ──────────────────────────────────────────────
  const [notifications, setNotifications] = useState([])    // Notification list
  const [loading,       setLoading]       = useState(true)  // Loading state

  // ── FETCH NOTIFICATIONS ────────────────────────────────
  // Fetches notifications from the backend
  // These are generated from real queue data, not stored separately
  const fetchNotifications = () => {
    fetch('http://localhost:5000/api/queue/notifications')
      .then(res => res.json())
      .then(data => {
        // Make sure data is an array before setting state
        setNotifications(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))  // Stop loading even if fetch fails
  }

  // ── AUTO-REFRESH ───────────────────────────────────────
  // Fetch on load and refresh every 15 seconds
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 15000)
    return () => clearInterval(interval)  // Cleanup on unmount
  }, [])

  // Count how many high-priority or serving notifications exist
  // This drives the alert badge count in the header
  const highPriority = notifications.filter(
    n => n.tag === 'High Priority' || n.tag === 'Serving'
  ).length

  return (
    <Layout>
      <div className="space-y-6">

        {/* ── HEADER ───────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <h1 className="text-white text-5xl font-bold">Notifications</h1>

          <div className="flex items-center gap-4">

            {/* Manual refresh button — in case user doesn't want to wait */}
            <button
              onClick={fetchNotifications}
              className="px-5 py-3 rounded-2xl bg-white/10 border border-white/10 text-white/70 text-lg hover:bg-white/15 transition-colors"
            >
              Refresh
            </button>

            {/* Alert badge — only shown when there are urgent notifications */}
            {highPriority > 0 && (
              <div className="px-6 py-3 rounded-2xl bg-cyan-400/20 border border-cyan-300/20 text-cyan-300 text-xl font-medium">
                {highPriority} New {highPriority === 1 ? 'Alert' : 'Alerts'}
              </div>
            )}
          </div>
        </div>

        {/* ── LOADING STATE ────────────────────────────── */}
        {/* Shown while the fetch request is in progress */}
        {loading && (
          <div className="text-white/50 text-xl text-center py-10">
            Loading notifications...
          </div>
        )}

        {/* ── EMPTY STATE ──────────────────────────────── */}
        {/* Shown when there are no notifications to display */}
        {!loading && notifications.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/10 p-12 text-center shadow-xl">
            <p className="text-white/50 text-2xl">No notifications yet</p>
            <p className="text-white/30 text-lg mt-2">
              Notifications appear as tokens are generated and served
            </p>
          </div>
        )}

        {/* ── NOTIFICATION CARDS ───────────────────────── */}
        {/* Rendered only when data has loaded and notifications exist */}
        {!loading && notifications.length > 0 && (
          <div className="space-y-5">
            {notifications.map(notif => (
              <div
                key={notif._id}  // Unique key for each notification
                className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl"
              >
                <div className="flex items-start justify-between gap-6">

                  {/* Left side — message and time */}
                  <div>
                    {/* Notification message text */}
                    <h2 className="text-white text-3xl font-semibold">
                      {notif.message}
                    </h2>
                    {/* Time ago text */}
                    <p className="text-white/50 text-xl mt-2">{notif.time}</p>
                  </div>

                  {/* Right side — colored tag badge */}
                  {/* Style comes from the backend (e.g. bg-emerald-400/20 text-emerald-300) */}
                  <div className={`px-5 py-2 rounded-full text-lg font-medium whitespace-nowrap ${notif.style}`}>
                    {notif.tag}
                  </div>

                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </Layout>
  )
}