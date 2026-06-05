// ============================================================
// pages/Monitoring.jsx
// Live Monitoring page — works on both desktop and mobile.
// Layout is always imported normally at the top.
// Mobile responsiveness is handled purely through Tailwind CSS
// responsive prefixes instead of conditional rendering.
// ============================================================

import React, { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'

export default function Monitoring() {

  const [queue,    setQueue]    = useState([])
  const [counters, setCounters] = useState([])
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const fetchData = () => {
    fetch('http://10.135.14.157:5000/api/queue')
      .then(r => r.json())
      .then(data => setQueue(Array.isArray(data) ? data : []))

    fetch('http://10.135.14.157:5000/api/counters')
      .then(r => r.json())
      .then(data => setCounters(Array.isArray(data) ? data : []))
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [])

  const waiting        = queue.filter(q => q.status === 'waiting').length
  const servingCount   = queue.filter(q => q.status === 'serving').length
  const completed      = queue.filter(q => q.status === 'completed').length
  const servingToken   = queue.find(q => q.status === 'serving')
  const waitingTokens  = queue.filter(q => q.status === 'waiting')
  const activeCounters = counters.filter(c => c.status === 'open' || c.status === 'busy').length

  const avgWait = (() => {
    const wt = queue.filter(q => q.status === 'waiting')
    if (!wt.length) return '0m'
    const now = Date.now()
    const avg = wt.reduce((s, q) => {
      const diff = now - new Date(q.createdAt).getTime()
      if (diff < 0 || diff > 86400000) return s
      return s + diff
    }, 0) / wt.length
    const mins = Math.floor(avg / 60000)
    return mins < 1 ? '<1m' : `${mins}m`
  })()

  const pieData = [
    { name: 'Waiting',   value: waiting      || 0, color: '#20d3ee' },
    { name: 'Serving',   value: servingCount || 0, color: '#22c55e' },
    { name: 'Completed', value: completed    || 0, color: '#8b5cf6' }
  ]

  const statusStyle = (status) => {
    if (status === 'busy')  return 'bg-amber-400/20 text-amber-300'
    if (status === 'break') return 'bg-rose-400/20 text-rose-300'
    return 'bg-emerald-400/20 text-emerald-300'
  }

  // ── MOBILE VIEW ────────────────────────────────────────
  if (isMobile) {
    return (
      <div className="min-h-screen bg-[#0b1020] p-4">

        {/* Mobile Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-cyan-300 text-xs uppercase tracking-widest">QueuePro</p>
            <h1 className="text-white text-3xl font-bold mt-1">Live Queue</h1>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-emerald-400/20 border border-emerald-300/20 text-emerald-300 text-sm font-medium">
            Online
          </div>
        </div>

        {/* Now Serving — biggest card, most important */}
        <div className={`rounded-2xl p-6 mb-4 text-center ${
          servingToken
            ? 'bg-emerald-400/10 border border-emerald-400/30'
            : 'bg-white/10 border border-white/10'
        }`}>
          <p className="text-white/60 text-sm mb-2">Now Serving</p>
          {servingToken ? (
            <>
              <h2 className="text-white text-7xl font-bold">#{servingToken.tokenNumber}</h2>
              <p className="text-emerald-300 text-xl mt-2">{servingToken.name}</p>
              <p className="text-white/50 text-lg mt-1">{servingToken.service}</p>
            </>
          ) : (
            <p className="text-white/40 text-xl py-4">No one being served</p>
          )}
        </div>

        {/* Stats — 2 column grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            ['Waiting',        waiting,        'text-cyan-300'   ],
            ['Avg Wait',       avgWait,        'text-white'      ],
            ['Active Counters',activeCounters,  'text-emerald-300'],
            ['Completed',      completed,      'text-violet-300' ]
          ].map(([title, value, color]) => (
            <div key={title} className="rounded-2xl bg-white/10 border border-white/10 p-4 text-center">
              <p className="text-white/50 text-sm">{title}</p>
              <h3 className={`text-4xl font-bold mt-1 ${color}`}>{value}</h3>
            </div>
          ))}
        </div>

        {/* Pie Chart */}
        <div className="rounded-2xl bg-white/10 border border-white/10 p-4 mb-4">
          <h2 className="text-white text-xl font-semibold mb-3">Queue Breakdown</h2>
          <div className="flex justify-around mb-2">
            {pieData.map(item => (
              <div key={item.name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-white/60 text-xs">
                  {item.name}: <span className="text-white font-semibold">{item.value}</span>
                </span>
              </div>
            ))}
          </div>
          <div style={{ width: '100%', height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" innerRadius={50} outerRadius={75} paddingAngle={5}>
                  {pieData.map((item, i) => <Cell key={i} fill={item.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e1e3f', borderRadius: '12px', color: '#fff', fontSize: '12px', border: '1px solid rgba(255,255,255,0.1)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Counter Statuses */}
        <div className="rounded-2xl bg-white/10 border border-white/10 p-4 mb-4">
          <h2 className="text-white text-xl font-semibold mb-3">Counters</h2>
          <div className="space-y-2">
            {counters.length === 0 && <p className="text-white/40 text-sm">No counters found</p>}
            {counters.map(counter => (
              <div key={counter._id} className={`rounded-xl px-4 py-3 flex items-center justify-between text-sm ${statusStyle(counter.status)}`}>
                <div>
                  <span className="font-semibold">{counter.counterName}</span>
                  {counter.assignedAgent && (
                    <span className="opacity-60 ml-2">— {counter.assignedAgent.name}</span>
                  )}
                </div>
                <span className="font-semibold capitalize">{counter.status}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Waiting Queue List */}
        {waitingTokens.length > 0 && (
          <div className="rounded-2xl bg-white/10 border border-white/10 p-4 mb-4">
            <h2 className="text-white text-xl font-semibold mb-3">
              Waiting Queue ({waitingTokens.length})
            </h2>
            <div className="space-y-2">
              {waitingTokens.map((token, i) => (
                <div key={token._id} className="rounded-xl px-4 py-3 bg-white/5 border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-white/40 text-sm">{i + 1}</span>
                    <div>
                      <p className="text-white font-semibold text-sm">Token #{token.tokenNumber}</p>
                      <p className="text-white/40 text-xs">{token.name}</p>
                    </div>
                  </div>
                  <span className="text-cyan-300 text-xs">{token.service}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-white/25 text-xs text-center mb-6">
          Auto refreshes every 10 seconds
        </p>
      </div>
    )
  }

  // ── DESKTOP VIEW ───────────────────────────────────────
  return (
    <Layout>
      <div className="space-y-6">

        <div className="flex items-center justify-between">
          <h1 className="text-white text-5xl font-bold">Live Monitoring</h1>
          <div className="px-6 py-3 rounded-2xl bg-emerald-400/20 border border-emerald-300/20 text-emerald-300 text-xl font-medium">
            System Online
          </div>
        </div>

        {/* Top Stats */}
        <div className="grid grid-cols-4 gap-5">
          {[
            ['Current Token',   servingToken ? `#${servingToken.tokenNumber}` : '—'],
            ['Waiting Queue',   waiting      ],
            ['Avg Wait Time',   avgWait      ],
            ['Active Counters', activeCounters]
          ].map(([title, value]) => (
            <div key={title} className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl">
              <p className="text-white/70 text-xl">{title}</p>
              <h2 className="text-white text-6xl font-bold mt-3">{value}</h2>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-6">

          {/* Pie Chart */}
          <div className="col-span-2 rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl">
            <h2 className="text-white text-3xl font-semibold mb-4">Live Queue Status</h2>
            <div className="flex gap-6 mb-4">
              {pieData.map(item => (
                <div key={item.name} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-white/70 text-lg">
                    {item.name}: <span className="text-white font-semibold">{item.value}</span>
                  </span>
                </div>
              ))}
            </div>
            <div style={{ width: '100%', height: 460 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" innerRadius={110} outerRadius={170} paddingAngle={5}>
                    {pieData.map((item, i) => <Cell key={i} fill={item.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1e1e3f', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Counter Status */}
          <div className="rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl">
            <h2 className="text-white text-3xl font-semibold mb-5">Counter Status</h2>
            {counters.length === 0 && <p className="text-white/40 text-lg">No counters. Run seed.js</p>}
            <div className="space-y-4">
              {counters.map(counter => (
                <div key={counter._id} className={`rounded-2xl px-5 py-4 border border-white/10 flex items-center justify-between text-xl ${statusStyle(counter.status)}`}>
                  <div>
                    <span>{counter.counterName}</span>
                    {counter.assignedAgent && (
                      <p className="text-sm opacity-70 mt-1">{counter.assignedAgent.name}</p>
                    )}
                  </div>
                  <span className="font-semibold capitalize">{counter.status}</span>
                </div>
              ))}
            </div>
            {servingToken && (
              <div className="mt-6 rounded-2xl bg-emerald-400/10 border border-emerald-300/20 p-5">
                <p className="text-emerald-300 text-lg font-semibold mb-1">Now Serving</p>
                <p className="text-white text-2xl font-bold">Token #{servingToken.tokenNumber}</p>
                <p className="text-white/60 text-lg mt-1">{servingToken.name} — {servingToken.service}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}