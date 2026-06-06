// ============================================================
// pages/CustomerDashboard.jsx
// The Customer Dashboard — shown to users with role 'customer'
// when they visit /dashboard after logging in.
//
// This is completely different from the Admin Dashboard.
// Customers only see information relevant to them:
//   - Who is currently being served
//   - Their own token (if they have one)
//   - Their position in the queue
//   - Live list of waiting tokens
//   - Queue statistics (waiting count, avg wait, current token)
//
// Props:
//   user → the logged-in customer's data (from App.jsx)
//
// Data source: GET /api/queue (auto-refreshes every 10 seconds)
// ============================================================

import React, { useEffect, useState } from 'react'
import Layout from '../components/Layout'

export default function CustomerDashboard({ user }) {

  // ── STATE ──────────────────────────────────────────────
  const [queue, setQueue] = useState([])  // All tokens from the queue API

  // ── FETCH AND AUTO-REFRESH ─────────────────────────────
  // Fetch queue data when page loads and refresh every 10 seconds
  // so the customer sees live updates without manually refreshing
  useEffect(() => {
    const fetchQueue = () => {
      fetch('https://queuepro-backend-2pl7.onrender.com/api/queue')
        .then(r => r.json())
        .then(data => setQueue(Array.isArray(data) ? data : []))
    }

    fetchQueue()  // Fetch immediately on load

    // setInterval runs fetchQueue every 10,000ms (10 seconds)
    const interval = setInterval(fetchQueue, 10000)

    // Cleanup — stop the interval when the component unmounts
    // This prevents memory leaks when navigating away
    return () => clearInterval(interval)
  }, [])

  // ── DERIVED DATA FROM QUEUE ────────────────────────────

  // The token currently being served at the counter
  const servingToken = queue.find(q => q.status === 'serving')

  // All tokens still waiting in the queue
  const waitingTokens = queue.filter(q => q.status === 'waiting')

  // Find this customer's token in the queue
  // Matches by name and excludes completed tokens
  const myToken = user
    ? queue.find(q =>
        q.name === user.name &&
        q.status !== 'completed'
      )
    : null

  // Calculate this customer's position in the waiting line
  // findIndex returns the position (0-based), +1 to make it 1-based
  const myPosition = myToken
    ? waitingTokens.findIndex(q => q._id === myToken._id) + 1
    : null

  // Calculate average wait time for all waiting tokens
  const avgWaitMin = (() => {
    if (!waitingTokens.length) return 0
    const now = Date.now()
    const avgMs = waitingTokens.reduce((sum, q) => {
      const diff = now - new Date(q.createdAt).getTime()
      if (diff < 0 || diff > 86400000) return sum  // Skip bad dates
      return sum + diff
    }, 0) / waitingTokens.length
    return Math.floor(avgMs / 60000)  // Convert ms to minutes
  })()

  // Helper to get text color based on token status
  const statusColor = (status) => {
    if (status === 'serving')   return 'text-emerald-300'
    if (status === 'waiting')   return 'text-cyan-300'
    if (status === 'completed') return 'text-violet-300'
    return 'text-white'
  }

  return (
    <Layout>
      <div className="space-y-6">

        {/* Page title — personalized greeting */}
        <h1 className="text-white text-5xl font-bold">
          Welcome{user?.name ? `, ${user.name}` : ''}
        </h1>

        {/* ── NOW SERVING BANNER ───────────────────────── */}
        {/* Shows which token the counter is currently serving */}
        <div className="rounded-3xl border border-white/10 bg-white/10 px-8 py-6 flex items-center justify-between shadow-xl">
          <div>
            <p className="text-white/60 text-lg">Now Serving</p>
            <h2 className="text-white text-4xl font-bold mt-1">
              {servingToken
                ? `Token #${servingToken.tokenNumber} — ${servingToken.name}`
                : 'No one is being served right now'}
            </h2>
          </div>
          <div className="text-right">
            <p className="text-white/60 text-lg">Service</p>
            <p className="text-cyan-300 text-2xl font-semibold mt-1">
              {servingToken ? servingToken.service : '—'}
            </p>
          </div>
        </div>

        {/* ── MY TOKEN SECTION ─────────────────────────── */}
        {/* Shows customer's own token details if they have one */}
        {myToken ? (
          // Token found — show the customer's token details
          <div className="rounded-3xl border border-cyan-400/30 bg-cyan-400/10 p-8 shadow-xl">
            <p className="text-cyan-300 text-lg font-semibold mb-4">Your Token</p>

            <div className="grid grid-cols-3 gap-6">

              {/* Token number */}
              <div className="text-center">
                <p className="text-white/60 text-lg">Token Number</p>
                <h2 className="text-white text-7xl font-bold mt-2">
                  #{myToken.tokenNumber}
                </h2>
              </div>

              {/* Queue position or serving indicator */}
              <div className="text-center">
                <p className="text-white/60 text-lg">Your Position</p>
                <h2 className="text-white text-7xl font-bold mt-2">
                  {/* Show celebration emoji if being served, else show position number */}
                  {myToken.status === 'serving' ? '🎉' : myPosition || '—'}
                </h2>
              </div>

              {/* Current status of the token */}
              <div className="text-center">
                <p className="text-white/60 text-lg">Status</p>
                <h2 className={`text-5xl font-bold mt-2 capitalize ${statusColor(myToken.status)}`}>
                  {myToken.status}
                </h2>
              </div>

            </div>
          </div>
        ) : (
          // No token found — tell the customer to get one
          <div className="rounded-3xl border border-white/10 bg-white/10 p-8 text-center shadow-xl">
            <p className="text-white/50 text-2xl">You have no active token</p>
            <p className="text-white/30 text-lg mt-2">
              Go to the Token page to join the queue
            </p>
          </div>
        )}

        {/* ── QUEUE STATS ──────────────────────────────── */}
        {/* Three summary cards showing general queue info */}
        <div className="grid grid-cols-3 gap-6">
          {[
            ['People Waiting', waitingTokens.length],
            ['Avg Wait Time',  avgWaitMin < 1 ? '<1 min' : `${avgWaitMin} min`],
            ['Serving Now',    servingToken ? `#${servingToken.tokenNumber}` : '—']
          ].map(([title, value]) => (
            <div
              key={title}
              className="rounded-3xl border border-white/10 bg-white/10 p-6 text-center shadow-xl"
            >
              <p className="text-white/70 text-xl">{title}</p>
              <h2 className="text-white text-6xl font-bold mt-3">{value}</h2>
            </div>
          ))}
        </div>

        {/* ── LIVE QUEUE LIST ──────────────────────────── */}
        {/* Shows up to 8 waiting tokens so customer can see their place */}
        {waitingTokens.length > 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/10 p-8 shadow-xl">
            <h2 className="text-white text-3xl font-semibold mb-5">Live Queue</h2>

            <div className="space-y-3">
              {/* Show first 8 waiting tokens */}
              {waitingTokens.slice(0, 8).map((token, i) => (
                <div
                  key={token._id}
                  // Highlight the customer's own token in the list
                  className={`rounded-2xl px-6 py-4 flex items-center justify-between ${
                    myToken?._id === token._id
                      ? 'bg-cyan-400/20 border border-cyan-400/30'  // Highlighted style
                      : 'bg-white/5 border border-white/10'          // Normal style
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Position number */}
                    <span className="text-white/40 text-lg w-6">{i + 1}</span>

                    {/* Token number */}
                    <span className="text-white text-xl font-semibold">
                      Token #{token.tokenNumber}
                    </span>

                    {/* "You" indicator for the customer's own token */}
                    {myToken?._id === token._id && (
                      <span className="text-cyan-300 text-sm font-semibold">← You</span>
                    )}
                  </div>

                  {/* Service type on the right */}
                  <span className="text-white/60 text-lg">{token.service}</span>
                </div>
              ))}

              {/* Show count of remaining tokens if more than 8 */}
              {waitingTokens.length > 8 && (
                <p className="text-white/40 text-center text-lg mt-2">
                  +{waitingTokens.length - 8} more in queue
                </p>
              )}
            </div>
          </div>
        )}

      </div>
    </Layout>
  )
}