// ============================================================
// pages/AgentDashboard.jsx
// The Agent Dashboard — shown to users with role 'agent'.
//
// Key feature added: Appointment Time Assignment
//   Agents can assign a specific time to any waiting customer.
//   e.g. "Your appointment is at 2:30 PM"
//   This is saved to the token in MongoDB and shows in
//   the Notifications page as a 'Scheduled' alert.
//
// Other features:
//   - Shows agent's assigned counter
//   - Currently serving token with Mark Complete button
//   - Call Next Token button
//   - Counter status toggle (Available / On Break)
//   - Waiting queue list with appointment time assignment
//   - Count of tokens served today
//
// Props:
//   user → the logged-in agent's data (from App.jsx)
// ============================================================

import React, { useEffect, useState, useCallback } from 'react'
import Layout from '../components/Layout'
import { CheckCircle2, Clock3, Users, Activity } from 'lucide-react'

export default function AgentDashboard({ user }) {

  // ── STATE ──────────────────────────────────────────────
  const [queue,         setQueue]         = useState([])    // All queue tokens
  const [myCounter,     setMyCounter]     = useState(null)  // Agent's assigned counter
  const [toast,         setToast]         = useState('')    // Toast message
  const [counterStatus, setCounterStatus] = useState('open') // open or break

  // appointmentTimes stores the time input value for each token
  // It's a key-value object: { tokenId: "14:30", tokenId2: "15:00" }
  // This lets each token in the list have its own time input
  const [appointmentTimes, setAppointmentTimes] = useState({})

  // ── SHOW TOAST ─────────────────────────────────────────
  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  // ── FETCH DATA ─────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      // Fetch all queue tokens
      const qRes = await fetch('http://https://queuepro-backend-2pl7.onrender.com/api/queue')
      const q    = await qRes.json()
      setQueue(Array.isArray(q) ? q : [])

      // Fetch all counters to find which one is assigned to this agent
      const cRes     = await fetch('http://https://queuepro-backend-2pl7.onrender.com/api/counters')
      const counters = await cRes.json()

      if (Array.isArray(counters) && user) {
        // Find the counter where assignedAgent ID matches this agent's ID
        const mine = counters.find(c =>
          c.assignedAgent?._id === user._id ||
          c.assignedAgent      === user._id
        )
        setMyCounter(mine || null)

        // Keep counterStatus in sync with what's stored in the database
        if (mine) setCounterStatus(mine.status)
      }
    } catch (err) {
      console.error('Failed to fetch agent data', err)
    }
  }, [user])

  // Auto-refresh every 10 seconds
  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [fetchData])

  // ── DERIVED DATA ───────────────────────────────────────

  // Token currently being served
  const servingToken  = queue.find(q => q.status === 'serving')

  // All tokens still waiting
  const waitingTokens = queue.filter(q => q.status === 'waiting')

  // Count tokens completed today
  const today       = new Date().toDateString()
  const servedToday = queue.filter(q =>
    q.status === 'completed' &&
    new Date(q.updatedAt).toDateString() === today
  ).length

  // ── CALL NEXT TOKEN ────────────────────────────────────
  const callNext = async () => {
    try {
      const res  = await fetch('http://https://queuepro-backend-2pl7.onrender.com/api/queue/next', { method: 'PUT' })
      const data = await res.json()
      showToast(data.message || `Now serving Token #${data.tokenNumber} — ${data.name}`)
      fetchData()
    } catch {
      showToast('Failed to call next token')
    }
  }

  // ── MARK COMPLETE ──────────────────────────────────────
  // Marks the currently serving token as completed
  const markComplete = async () => {
    if (!servingToken) {
      showToast('No token is currently being served')
      return
    }
    try {
      await fetch(`http://https://queuepro-backend-2pl7.onrender.com/api/queue/${servingToken._id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: 'completed' })
      })
      showToast(`Token #${servingToken.tokenNumber} marked as completed`)
      fetchData()
    } catch {
      showToast('Failed to mark as complete')
    }
  }

  // ── TOGGLE COUNTER STATUS ──────────────────────────────
  // Agent can set themselves as Available or On Break
  const toggleStatus = async () => {
    if (!myCounter) {
      showToast('No counter assigned to you')
      return
    }

    // Toggle between open and break
    const newStatus = counterStatus === 'open' ? 'break' : 'open'

    try {
      await fetch(`http://https://queuepro-backend-2pl7.onrender.com/api/counters/${myCounter._id}/status`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ status: newStatus })
      })
      setCounterStatus(newStatus)
      showToast(`Status updated to ${newStatus}`)
      fetchData()
    } catch {
      showToast('Failed to update status')
    }
  }

  // ── ASSIGN APPOINTMENT TIME ────────────────────────────
  // This is the new feature — agent sets a time for a specific token
  // tokenId → which token to assign
  // The time value comes from appointmentTimes[tokenId] state
  const assignAppointment = async (tokenId, tokenNumber) => {
    // Get the time the agent typed for this specific token
    const time = appointmentTimes[tokenId]

    // Validate that a time was entered
    if (!time) {
      showToast('Please enter a time before assigning')
      return
    }

    try {
      // Send PUT request to the appointment route
      const res = await fetch(
        `http://https://queuepro-backend-2pl7.onrender.com/api/queue/${tokenId}/appointment`,
        {
          method:  'PUT',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            appointmentTime: time,
            assignedBy:      user?.name || 'Agent'  // Record who assigned it
          })
        }
      )

      const data = await res.json()

      if (res.ok) {
        showToast(`Appointment set for Token #${tokenNumber} at ${time}`)

        // Clear this token's time input after successful assignment
        setAppointmentTimes(prev => ({ ...prev, [tokenId]: '' }))

        fetchData()  // Refresh to show updated appointment time
      } else {
        showToast(data.message || 'Failed to assign appointment')
      }

    } catch {
      showToast('Failed to assign appointment')
    }
  }

  // ── CLEAR APPOINTMENT ──────────────────────────────────
  // Allows agent to remove a previously set appointment time
  const clearAppointment = async (tokenId, tokenNumber) => {
    try {
      await fetch(
        `http://https://queuepro-backend-2pl7.onrender.com/api/queue/${tokenId}/appointment`,
        {
          method:  'PUT',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            appointmentTime: null,
            assignedBy:      null
          })
        }
      )
      showToast(`Appointment cleared for Token #${tokenNumber}`)
      fetchData()
    } catch {
      showToast('Failed to clear appointment')
    }
  }

  return (
    <Layout>

      {/* Toast notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl bg-cyan-400 text-slate-900 font-semibold text-lg shadow-2xl">
          {toast}
        </div>
      )}

      <div className="space-y-6">

        {/* ── HEADER ───────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-cyan-300 uppercase tracking-[0.35em] text-sm">
              Agent Panel
            </p>
            <h1 className="text-white text-5xl font-bold mt-2">
              {user?.name || 'Agent'}'s Dashboard
            </h1>
          </div>

          {/* Availability toggle button */}
          <button
            onClick={toggleStatus}
            className={`px-6 py-3 rounded-2xl font-bold text-lg transition-colors ${
              counterStatus === 'open'
                ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/20 hover:bg-emerald-400/30'
                : 'bg-amber-400/20 text-amber-300 border border-amber-400/20 hover:bg-amber-400/30'
            }`}
          >
            {counterStatus === 'open' ? '✓ Available' : '⏸ On Break'}
          </button>
        </div>

        {/* ── STATS ROW ────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-5">
          {[
            ['My Counter',   myCounter?.counterName || 'Not Assigned',           Users       ],
            ['Now Serving',  servingToken ? `#${servingToken.tokenNumber}` : '—', Activity   ],
            ['Waiting',      waitingTokens.length,                                Clock3     ],
            ['Served Today', servedToday,                                         CheckCircle2]
          ].map(([title, value, Icon]) => (
            <div
              key={title}
              className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl"
            >
              <div className="flex justify-between items-center">
                <p className="text-white/70 text-lg">{title}</p>
                <Icon className="text-cyan-300" size={20} />
              </div>
              <h2 className="text-white text-4xl font-bold mt-3">{value}</h2>
            </div>
          ))}
        </div>

        {/* ── MAIN WORK AREA ───────────────────────────── */}
        <div className="grid grid-cols-2 gap-6">

          {/* Currently Serving + Action Buttons */}
          <section className="rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl">
            <h2 className="text-white text-3xl font-semibold mb-6">
              Currently Serving
            </h2>

            {servingToken ? (
              <div className="space-y-4">
                {/* Serving token info card */}
                <div className="rounded-2xl bg-emerald-400/10 border border-emerald-400/20 p-6 text-center">
                  <p className="text-emerald-300 text-lg">Token Number</p>
                  <h2 className="text-white text-8xl font-bold mt-2">
                    #{servingToken.tokenNumber}
                  </h2>
                  <p className="text-white/70 text-2xl mt-3">{servingToken.name}</p>
                  <p className="text-cyan-300 text-xl mt-1">{servingToken.service}</p>
                  {/* Show appointment time if one was set */}
                  {servingToken.appointmentTime && (
                    <p className="text-blue-300 text-lg mt-2">
                      📅 Appointment: {servingToken.appointmentTime}
                    </p>
                  )}
                </div>

                {/* Mark Complete button */}
                <button
                  onClick={markComplete}
                  className="w-full py-4 rounded-2xl bg-emerald-400 text-slate-900 font-bold text-xl hover:bg-emerald-300 transition-colors"
                >
                  ✓ Mark as Complete
                </button>
              </div>
            ) : (
              // No one being served
              <div className="rounded-2xl bg-white/5 border border-white/10 p-8 text-center">
                <p className="text-white/40 text-2xl">No one being served</p>
                <p className="text-white/25 text-lg mt-2">
                  Click "Call Next" to serve the next customer
                </p>
              </div>
            )}

            {/* Call Next button — always visible */}
            <button
              onClick={callNext}
              className="w-full mt-4 py-4 rounded-2xl bg-cyan-400 text-slate-900 font-bold text-xl hover:bg-cyan-300 transition-colors"
            >
              Call Next Token
            </button>
          </section>

          {/* Waiting Queue with Appointment Assignment */}
          <section className="rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl">
            <h2 className="text-white text-3xl font-semibold mb-2">
              Waiting Queue ({waitingTokens.length})
            </h2>
            <p className="text-white/40 text-sm mb-5">
              Set an appointment time for any waiting customer
            </p>

            {waitingTokens.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-white/40 text-2xl">Queue is empty</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {waitingTokens.map((token, i) => (
                  <div
                    key={token._id}
                    className="rounded-2xl bg-white/5 border border-white/10 p-4"
                  >
                    {/* Token info row */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {/* Queue position number */}
                        <span className="text-white/40 text-lg">{i + 1}</span>
                        <div>
                          <p className="text-white font-semibold text-lg">
                            Token #{token.tokenNumber}
                          </p>
                          <p className="text-white/50 text-sm">{token.name}</p>
                        </div>
                      </div>
                      <span className="text-cyan-300 text-sm">{token.service}</span>
                    </div>

                    {/* Show existing appointment if already set */}
                    {token.appointmentTime && (
                      <div className="flex items-center justify-between mb-3 rounded-xl bg-blue-400/10 border border-blue-400/20 px-4 py-2">
                        <p className="text-blue-300 text-sm">
                          📅 {token.appointmentTime}
                          {token.assignedBy && (
                            <span className="text-blue-300/50 ml-2">
                              by {token.assignedBy}
                            </span>
                          )}
                        </p>
                        {/* Clear appointment button */}
                        <button
                          onClick={() => clearAppointment(token._id, token.tokenNumber)}
                          className="text-rose-400 text-xs hover:text-rose-300 transition-colors"
                        >
                          Clear
                        </button>
                      </div>
                    )}

                    {/* Appointment time input row */}
                    {/* Each token has its own time input stored in appointmentTimes state */}
                    <div className="flex gap-2">
                      <input
                        type="time"
                        // Get the value for THIS specific token from the state object
                        value={appointmentTimes[token._id] || ''}
                        // Update only this token's entry in the state object
                        onChange={e => setAppointmentTimes(prev => ({
                          ...prev,                      // Keep all other token times
                          [token._id]: e.target.value   // Update this token's time
                        }))}
                        className="flex-1 px-4 py-2 rounded-xl bg-white/10 border border-white/10 text-white text-lg outline-none focus:border-cyan-400/50 transition-colors"
                      />
                      {/* Assign button for this specific token */}
                      <button
                        onClick={() => assignAppointment(token._id, token.tokenNumber)}
                        className="px-4 py-2 rounded-xl bg-cyan-400 text-slate-900 font-bold text-sm hover:bg-cyan-300 transition-colors whitespace-nowrap"
                      >
                        Assign
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </div>
    </Layout>
  )
}