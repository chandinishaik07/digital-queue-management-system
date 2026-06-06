// ============================================================
// pages/Dashboard.jsx
// The Admin Analytics Dashboard.
// Only visible to users with role 'admin'.
// Shows real-time queue statistics and satisfaction data.
//
// Data sources:
//   /api/queue      → live token counts (total, waiting, serving, completed)
//   /api/analytics  → satisfaction ratings and 7-day history for charts
//
// Sections:
//   1. Now Serving banner — who is currently at the counter
//   2. Live stats row — total, waiting, serving, completed, avg wait
//   3. Satisfaction pie chart — from QueueAnalytics collection
//   4. Last 7 days bar chart — daily customer volume
//   5. Satisfaction rating cards — poor/average/good/excellent counts
// ============================================================

import React, { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis
} from 'recharts'
import { AlertCircle, Smile, ThumbsUp, BadgeCheck } from 'lucide-react'

export default function Dashboard() {

  // ── STATE ──────────────────────────────────────────────
  const [queue,     setQueue]     = useState([])    // All queue tokens from API
  const [analytics, setAnalytics] = useState(null)  // Analytics data from API

  // ── FETCH DATA ON LOAD ─────────────────────────────────
  // Fetch both queue and analytics data when the page loads
  useEffect(() => {
    // Fetch all current queue tokens
    fetch('http://https://queuepro-backend-2pl7.onrender.com/api/queue')
      .then(r => r.json())
      .then(data => setQueue(Array.isArray(data) ? data : []))

    // Fetch analytics summary and 7-day history
    const token = localStorage.getItem('token')

    fetch('http://https://queuepro-backend-2pl7.onrender.com/api/analytics', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(r => r.json())
      .then(setAnalytics)
  }, [])  // Empty array — only runs once when component mounts

  // ── DERIVED STATS FROM QUEUE DATA ─────────────────────
  // Calculate counts by filtering the queue array by status
  const total     = queue.length
  const waiting   = queue.filter(q => q.status === 'waiting').length
  const serving   = queue.filter(q => q.status === 'serving').length
  const completed = queue.filter(q => q.status === 'completed').length

  // Find the token that is currently being served
  const servingToken = queue.find(q => q.status === 'serving')

  // Calculate average wait time for waiting tokens
  // Uses createdAt timestamp to measure how long they've been waiting
  const avgWait = (() => {
    const waitingTokens = queue.filter(q => q.status === 'waiting')
    if (!waitingTokens.length) return '0:00'

    const now = Date.now()

    // Calculate average milliseconds waiting
    const avgMs = waitingTokens.reduce((sum, q) => {
      const diff = now - new Date(q.createdAt).getTime()
      // Skip tokens with bad/stale dates (older than 24 hours)
      if (diff < 0 || diff > 86400000) return sum
      return sum + diff
    }, 0) / waitingTokens.length

    // Convert milliseconds to mm:ss format
    const mins = Math.floor(avgMs / 60000)
    const secs = Math.floor((avgMs % 60000) / 1000)
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  })()

  // Stats row data — title and value pairs
  const stats = [
    ['Total Tokens', total    ],
    ['Waiting',      waiting  ],
    ['Serving',      serving  ],
    ['Completed',    completed],
    ['Avg Wait',     avgWait  ]
  ]

  // ── CHART DATA FROM ANALYTICS ──────────────────────────
  // Pie chart data — satisfaction ratings from QueueAnalytics
  const pieData = analytics ? [
    { name: 'Excellent', value: analytics.excellent, color: '#7c4dff' },
    { name: 'Good',      value: analytics.good,      color: '#18b7d3' },
    { name: 'Average',   value: analytics.average,   color: '#e663b0' },
    { name: 'Poor',      value: analytics.poor,      color: '#f7a400' }
  ] : []

  // Bar chart data — last 7 days of customer volume
  // Each record from history becomes one bar on the chart
  const barData = analytics?.history?.map(h => ({
    time:  h.date.slice(5),       // Show only MM-DD part of the date
    value: h.totalCustomers       // Height of the bar
  })) || []

  // Bottom satisfaction cards — show real counts from analytics
  const bottom = analytics ? [
    ['Poor',      analytics.poor,      AlertCircle],
    ['Average',   analytics.average,   Smile      ],
    ['Good',      analytics.good,      ThumbsUp   ],
    ['Excellent', analytics.excellent, BadgeCheck  ]
  ] : [
    // Show dashes if analytics haven't loaded yet
    ['Poor',      '—', AlertCircle],
    ['Average',   '—', Smile      ],
    ['Good',      '—', ThumbsUp   ],
    ['Excellent', '—', BadgeCheck  ]
  ]

  return (
    // isAdmin={true} shows the Admin link in the sidebar
    <Layout isAdmin={true}>

      <h1 className="text-white text-5xl font-bold mb-6">Dashboard</h1>

      {/* ── NOW SERVING BANNER ───────────────────────── */}
      {/* Shows which token is currently being served */}
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/10 px-8 py-5 flex items-center justify-between">
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

      {/* ── LIVE STATS ROW ───────────────────────────── */}
      {/* 5 stat cards showing real-time queue numbers */}
      <div className="grid grid-cols-5 gap-5 mb-6">
        {stats.map(([title, value]) => (
          <div
            key={title}
            className="rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl p-5 text-white shadow-xl"
          >
            <p className="text-white/70 text-lg">{title}</p>
            <h2 className="text-6xl font-bold mt-3">{value}</h2>
            <p className="text-white/45 mt-2 text-sm">Live data</p>
          </div>
        ))}
      </div>

      {/* ── CHARTS ROW ───────────────────────────────── */}
      <div className="grid grid-cols-2 gap-6 mb-6">

        {/* Satisfaction Pie Chart */}
        <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl">
          <h2 className="text-white text-3xl font-semibold mb-4">
            Customer Satisfaction
          </h2>

          {/* Show message if no ratings yet, otherwise show chart */}
          {!analytics || pieData.every(p => p.value === 0)
            ? <p className="text-white/40 text-xl text-center mt-20">No ratings yet</p>
            : (
              <div className="h-[420px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      outerRadius={145}
                      innerRadius={60}   // innerRadius creates a donut chart
                      paddingAngle={3}   // Small gap between segments
                      labelLine={false}
                      // Show percentage label on each segment
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      {/* Each segment gets its own color from pieData */}
                      {pieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>

                    {/* Tooltip shows data when hovering over a segment */}
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
        </div>

        {/* Last 7 Days Bar Chart */}
        <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl">
          <h2 className="text-white text-3xl font-semibold mb-4">
            Last 7 Days
          </h2>

          {barData.length === 0
            ? <p className="text-white/40 text-xl text-center mt-20">No history yet</p>
            : (
              <div className="h-[420px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}>
                    {/* X axis shows dates, Y axis shows customer count */}
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
                    {/* Bars with rounded tops and gradient fill */}
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="url(#barGrad)" />
                    <defs>
                      {/* Gradient color for bars — cyan at top, pink at bottom */}
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%"   stopColor="#25d7f2" />
                        <stop offset="100%" stopColor="#ff3ea5" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )
          }
        </div>
      </div>

      {/* ── SATISFACTION RATING CARDS ─────────────────── */}
      {/* Shows count for each satisfaction level */}
      <div className="grid grid-cols-4 gap-6">
        {bottom.map(([title, value, Icon]) => (
          <div
            key={title}
            className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl text-center text-white"
          >
            <p className="text-2xl text-white/80">{title}</p>
            <div className="flex justify-center my-5">
              <Icon size={48} className="text-cyan-300" />
            </div>
            <h3 className="text-5xl font-bold">{value}</h3>
          </div>
        ))}
      </div>

    </Layout>
  )
}