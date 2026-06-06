// ============================================================
// pages/Admin.jsx
// The Admin Control Center — only accessible to users with
// role 'admin'. Protected in App.jsx routing.
//
// This page gives the admin full control over the queue system.
//
// Sections:
//   1. Stats row — total customers, active counters, avg wait, system health
//   2. Counter Overview — see and toggle counter statuses
//   3. Assign Agent — assign agents to specific counters
//   4. Quick Actions — call next, resolve issue, generate report
//   5. Satisfaction pie chart — from QueueAnalytics
//   6. Weekly bar chart — 7 days of customer volume
//
// Data sources:
//   GET /api/queue            → live queue data for stats
//   GET /api/counters         → counter list and statuses
//   GET /api/counters/agents  → all agent users
//   GET /api/analytics        → satisfaction and history data
// ============================================================

import React, { useState, useEffect, useCallback } from 'react'
import Layout from '../components/Layout'
import {
  Users, Clock3, LayoutDashboard, CheckCircle2,
  AlertTriangle, FileBarChart, ShieldCheck, Activity, X
} from 'lucide-react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis
} from 'recharts'

// Status styles for counter badges
// Each status has a label and CSS classes for color
const STATUS_STYLES = {
  open:  { label: 'Open',  cls: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/20' },
  busy:  { label: 'Busy',  cls: 'bg-amber-400/20  text-amber-300  border-amber-400/20'    },
  break: { label: 'Break', cls: 'bg-rose-400/20   text-rose-300   border-rose-400/20'     }
}

// When admin clicks the status badge, cycle to the next status
const NEXT_STATUS = { open: 'busy', busy: 'break', break: 'open' }

export default function Admin() {

  // ── STATE ──────────────────────────────────────────────
  const [queue,           setQueue]           = useState([])    // All queue tokens
  const [counters,        setCounters]        = useState([])    // All service counters
  const [agents,          setAgents]          = useState([])    // All agent users
  const [analytics,       setAnalytics]       = useState(null)  // Analytics data
  const [report,          setReport]          = useState(null)  // Report modal data
  const [showReport,      setShowReport]      = useState(false) // Show/hide report modal
  const [selectedAgent,   setSelectedAgent]   = useState('')    // Selected agent in dropdown
  const [selectedCounter, setSelectedCounter] = useState('')    // Selected counter in dropdown
  const [toast,           setToast]           = useState('')    // Toast notification text

  // ── SHOW TOAST ─────────────────────────────────────────
  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  // ── FETCH ALL DATA ─────────────────────────────────────
  // Fetches queue, counters, agents, and analytics simultaneously
  // Promise.all runs all fetches at the same time (faster than one by one)
  
  const fetchAll = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const [qRes, cRes, aRes, anRes] = await Promise.all([
        fetch('https://queuepro-backend-2pl7.onrender.com/api/queue'),
        fetch('https://queuepro-backend-2pl7.onrender.com/api/counters', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }),
        fetch('https://queuepro-backend-2pl7.onrender.com/api/counters/agents', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }),

        fetch('https://queuepro-backend-2pl7.onrender.com/api/analytics', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
      ])

      const [q, c, a, an] = await Promise.all([
        qRes.json(), cRes.json(), aRes.json(), anRes.json()
      ])

      setQueue(Array.isArray(q) ? q : [])
      setCounters(Array.isArray(c) ? c : [])
      setAgents(Array.isArray(a) ? a : [])
      setAnalytics(an)
    } catch (err) {
      console.error('Failed to fetch admin data', err)
    }
  }, [])

  // Fetch on load and auto-refresh every 15 seconds
  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 15000)
    return () => clearInterval(interval)
  }, [fetchAll])

  // ── DERIVED STATS ──────────────────────────────────────
  // Calculate real values from live queue and counter data

  // Total number of tokens in the queue
  const totalCustomers = queue.length

  // Count counters that are open or busy (not on break)
  const activeCounters = counters.filter(
    c => c.status === 'open' || c.status === 'busy'
  ).length

  // Calculate average wait time from createdAt of waiting tokens
  const avgWait = (() => {
    const wt = queue.filter(q => q.status === 'waiting')
    if (!wt.length) return '0 min'
    const now = Date.now()
    const avg = wt.reduce((s, q) => {
      const diff = now - new Date(q.createdAt).getTime()
      if (diff < 0 || diff > 86400000) return s  // Skip bad dates
      return s + diff
    }, 0) / wt.length
    return `${Math.floor(avg / 60000)} min`
  })()

  // System health — performance score from analytics (e.g. "92%")
  const systemHealth = analytics ? `${analytics.queuePerformance}%` : '—'

  // Stats row data
  const stats = [
    ['Total Customers', totalCustomers, Users         ],
    ['Active Counters', activeCounters, LayoutDashboard],
    ['Average Wait',    avgWait,        Clock3         ],
    ['System Health',   systemHealth,   Activity       ]
  ]

  // ── CHART DATA ─────────────────────────────────────────

  // Satisfaction pie chart data from QueueAnalytics
  const pieData = analytics ? [
    { name: 'Excellent', value: analytics.excellent, color: '#7c4dff' },
    { name: 'Good',      value: analytics.good,      color: '#18b7d3' },
    { name: 'Average',   value: analytics.average,   color: '#e663b0' },
    { name: 'Poor',      value: analytics.poor,      color: '#f7a400' }
  ] : []

  // Bar chart — last 7 days of total customers
  const barData = analytics?.history?.map(h => ({
    time:  h.date.slice(5),      // MM-DD format
    value: h.totalCustomers
  })) || []

  // ── TOGGLE COUNTER STATUS ──────────────────────────────
  // Admin clicks the status badge to cycle: open → busy → break → open
  const toggleCounterStatus = async (counter) => {
    const next = NEXT_STATUS[counter.status] || 'open'
    try {
      const token = localStorage.getItem('token')
      await fetch(`https://queuepro-backend-2pl7.onrender.com/api/counters/${counter._id}/status`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ status: next })
      })
      showToast(`${counter.counterName} → ${next}`)
      fetchAll()  // Refresh to show updated status
    } catch {
      showToast('Failed to update counter')
    }
  }

  // ── CALL NEXT TOKEN ────────────────────────────────────
  // Completes current serving token and starts serving next waiting token
  const callNext = async () => {
    try {
      const res  = await fetch('https://queuepro-backend-2pl7.onrender.com/api/queue/next', { method: 'PUT' })
      const data = await res.json()
      showToast(data.message || `Now serving Token #${data.tokenNumber} — ${data.name}`)
      fetchAll()
    } catch {
      showToast('Failed to call next token')
    }
  }

  // ── RESOLVE ISSUE ──────────────────────────────────────
  // Finds the currently serving token and marks it as completed
  // Used when a service issue needs to be closed manually
  const resolveIssue = async () => {
    try {
      const res     = await fetch('https://queuepro-backend-2pl7.onrender.com/api/queue')
      const q       = await res.json()
      const serving = q.find(t => t.status === 'serving')

      if (!serving) {
        showToast('No token is currently being served')
        return
      }
      const token = localStorage.getItem('token')
      await fetch(`https://queuepro-backend-2pl7.onrender.com/api/queue/${serving._id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json',Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ status: 'completed' })
      })

      showToast(`Token #${serving.tokenNumber} marked as completed`)
      fetchAll()
    } catch {
      showToast('Failed to resolve issue')
    }
  }

  // ── GENERATE REPORT ────────────────────────────────────
  // Fetches latest queue data and opens a modal with summary stats
  const generateReport = async () => {
    try {
      const res = await fetch('https://queuepro-backend-2pl7.onrender.com/api/queue')
      const q   = await res.json()
      setReport({
        total:     q.length,
        waiting:   q.filter(t => t.status === 'waiting').length,
        serving:   q.filter(t => t.status === 'serving').length,
        completed: q.filter(t => t.status === 'completed').length
      })
      setShowReport(true)  // Open the report modal
    } catch {
      showToast('Failed to generate report')
    }
  }

  // ── ASSIGN AGENT ───────────────────────────────────────
  // Assigns the selected agent to the selected counter
  // Both dropdowns must have a selection before this is called
  const handleAssign = async () => {
    if (!selectedCounter || !selectedAgent) {
      showToast('Please select both a counter and an agent')
      return
    }
    try {
      const token = localStorage.getItem('token')
      await fetch(`https://queuepro-backend-2pl7.onrender.com/api/counters/${selectedCounter}/assign`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json',Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ agentId: selectedAgent })
      })
      showToast('Agent assigned successfully!')
      setSelectedAgent('')    // Reset dropdowns after assignment
      setSelectedCounter('')
      fetchAll()
    } catch {
      showToast('Failed to assign agent')
    }
  }

  // Quick action buttons data — label, icon, handler function
  const actions = [
    ['Call Next Token', CheckCircle2,  callNext     ],
    ['Resolve Issue',   AlertTriangle, resolveIssue ],
    ['Generate Report', FileBarChart,  generateReport]
  ]

  return (
    // isAdmin={true} makes the Admin link visible in the sidebar
    <Layout isAdmin={true}>

      {/* Toast notification — fixed top right */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl bg-cyan-400 text-slate-900 font-semibold text-lg shadow-2xl">
          {toast}
        </div>
      )}

      <div className="space-y-6">

        {/* ── PAGE HEADER ──────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-cyan-300 uppercase tracking-[0.35em] text-sm">
              Control Center
            </p>
            <h1 className="text-white text-5xl font-bold mt-2">
              Admin Dashboard
            </h1>
          </div>
          <div className="px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-900 font-bold shadow-2xl">
            Live Status
          </div>
        </div>

        {/* ── STATS ROW ────────────────────────────────── */}
        {/* 4 cards showing real-time system stats */}
        <div className="grid grid-cols-4 gap-6">
          {stats.map(([title, value, Icon]) => (
            <div
              key={title}
              className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-2xl backdrop-blur-xl"
            >
              <div className="flex justify-between items-center">
                <p className="text-white/70">{title}</p>
                <Icon className="text-cyan-300" />
              </div>
              <h2 className="text-white text-5xl font-bold mt-4">{value}</h2>
            </div>
          ))}
        </div>

        {/* ── COUNTER + ASSIGN + ACTIONS ROW ───────────── */}
        <div className="grid grid-cols-3 gap-6">

          {/* Counter Overview */}
          <section className="rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl">
            <h2 className="text-white text-3xl font-semibold mb-1">
              Counter Overview
            </h2>
            {/* Hint for admin on how to use the toggle */}
            <p className="text-white/40 text-sm mb-5">
              Tap status badge to cycle Open → Busy → Break
            </p>

            {counters.length === 0 && (
              <p className="text-white/40 text-lg">No counters. Run seed.js</p>
            )}

            <div className="space-y-4">
              {counters.map(counter => {
                // Get the style for this counter's current status
                const s = STATUS_STYLES[counter.status] || STATUS_STYLES.open
                return (
                  <div
                    key={counter._id}
                    className="rounded-2xl p-4 bg-white/10 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-white text-lg">{counter.counterName}</p>
                      {/* Show assigned agent name if one is assigned */}
                      {counter.assignedAgent && (
                        <p className="text-white/40 text-sm mt-0.5">
                          {counter.assignedAgent.name}
                        </p>
                      )}
                    </div>

                    {/* Clickable status badge — cycles through statuses on click */}
                    <button
                      onClick={() => toggleCounterStatus(counter)}
                      className={`px-4 py-1.5 rounded-full border text-sm font-semibold transition-all hover:scale-105 active:scale-95 ${s.cls}`}
                    >
                      {s.label}
                    </button>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Assign Agent */}
          <section className="rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl">
            <h2 className="text-white text-3xl font-semibold mb-6">
              Assign Service Agent
            </h2>
            <div className="space-y-4">

              {/* Counter dropdown — populated from API */}
              <select
                value={selectedCounter}
                onChange={e => setSelectedCounter(e.target.value)}
                className="w-full p-4 rounded-2xl bg-white/10 text-white"
              >
                <option value="">Select Counter</option>
                {counters.map(c => (
                  <option key={c._id} value={c._id}>{c.counterName}</option>
                ))}
              </select>

              {/* Agent dropdown — populated from API (users with role agent) */}
              <select
                value={selectedAgent}
                onChange={e => setSelectedAgent(e.target.value)}
                className="w-full p-4 rounded-2xl bg-white/10 text-white"
              >
                <option value="">Select Agent</option>
                {agents.map(a => (
                  <option key={a._id} value={a._id}>{a.name}</option>
                ))}
              </select>

              {/* Assign button — saves assignment to database */}
              <button
                onClick={handleAssign}
                className="w-full py-4 rounded-2xl bg-cyan-400 text-slate-900 font-bold hover:bg-cyan-300 transition-colors"
              >
                Assign Agent
              </button>

              {/* Security badge — decorative info box */}
              <div className="rounded-2xl bg-gradient-to-r from-violet-500/20 to-cyan-500/20 p-4 border border-white/10">
                <div className="flex gap-3 items-center text-white">
                  <ShieldCheck className="text-cyan-300" />
                  Secure Role Access Enabled
                </div>
              </div>
            </div>
          </section>

          {/* Quick Actions */}
          <section className="rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl">
            <h2 className="text-white text-3xl font-semibold mb-6">
              Quick Actions
            </h2>
            <div className="space-y-4">
              {/* Each button triggers its respective handler function */}
              {actions.map(([label, Icon, handler]) => (
                <button
                  key={label}
                  onClick={handler}
                  className="w-full rounded-2xl px-5 py-4 bg-white/10 text-white flex gap-3 hover:bg-white/15 transition-colors"
                >
                  <Icon className="text-cyan-300" />
                  {label}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* ── CHARTS ROW ───────────────────────────────── */}
        <div className="grid grid-cols-2 gap-6">

          {/* Satisfaction Pie Chart */}
          <section className="rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl">
            <h2 className="text-white text-3xl font-semibold mb-6">
              Customer Satisfaction
            </h2>
            {!analytics || pieData.every(p => p.value === 0)
              ? <p className="text-white/40 text-xl text-center mt-16">No ratings yet</p>
              : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        outerRadius={110}
                        innerRadius={50}
                        paddingAngle={3}
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                      >
                        {pieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} stroke="transparent" />
                        ))}
                      </Pie>
                      {/* Tooltip shows value and name on hover */}
                      <Tooltip
                        contentStyle={{
                          background:   '#1e1e3f',
                          border:       '1px solid rgba(255,255,255,0.15)',
                          borderRadius: '12px',
                          color:        '#fff',
                          fontSize:     '14px'
                        }}
                        formatter={(value, name) => [value, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )
            }
          </section>

          {/* Weekly Customers Bar Chart */}
          <section className="rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl">
            <h2 className="text-white text-3xl font-semibold mb-6">
              Weekly Customers
            </h2>
            {barData.length === 0
              ? <p className="text-white/40 text-xl text-center mt-16">No history yet</p>
              : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData}>
                      <XAxis dataKey="time" stroke="#ffffffaa" />
                      <YAxis stroke="#ffffffaa" />
                      <Tooltip
                        contentStyle={{
                          background:   '#1e1e3f',
                          border:       '1px solid rgba(255,255,255,0.15)',
                          borderRadius: '12px',
                          color:        '#fff'
                        }}
                      />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="url(#barGrad2)" />
                      <defs>
                        <linearGradient id="barGrad2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor="#25d7f2" />
                          <stop offset="100%" stopColor="#7c4dff" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )
            }
          </section>
        </div>
      </div>

      {/* ── REPORT MODAL ─────────────────────────────── */}
      {/* Overlay modal shown when Generate Report is clicked */}
      {showReport && report && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1e1e3f] border border-white/15 rounded-3xl p-10 shadow-2xl w-[480px]">

            {/* Modal header with close button */}
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-white text-3xl font-bold">Queue Report</h2>
              <button
                onClick={() => setShowReport(false)}
                className="text-white/60 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Report stats grid */}
            <div className="grid grid-cols-2 gap-5">
              {[
                ['Total Tokens', report.total,     'text-white'       ],
                ['Waiting',      report.waiting,   'text-cyan-300'    ],
                ['Serving',      report.serving,   'text-emerald-400' ],
                ['Completed',    report.completed, 'text-violet-400'  ]
              ].map(([label, value, color]) => (
                <div
                  key={label}
                  className="rounded-2xl bg-white/10 border border-white/10 p-6 text-center"
                >
                  <p className="text-white/60 text-lg mb-2">{label}</p>
                  <h3 className={`text-5xl font-bold ${color}`}>{value}</h3>
                </div>
              ))}
            </div>

            {/* Close button */}
            <button
              onClick={() => setShowReport(false)}
              className="w-full mt-8 py-4 rounded-2xl bg-cyan-400 text-slate-900 font-bold text-xl hover:bg-cyan-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </Layout>
  )
}