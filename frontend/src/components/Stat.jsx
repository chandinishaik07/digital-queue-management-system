// ============================================================
// components/Stat.jsx
// A reusable statistic card component.
// Used to display a single metric with a title and value.
// For example: "Total Tokens → 24" or "Avg Wait → 5 min"
//
// Usage:
//   <Stat title="Total Tokens" value={24} />
//   <Stat title="Avg Wait" value="5 min" className="col-span-2" />
//
// Props:
//   title     → label describing what the stat represents
//   value     → the actual number or text to display (large)
//   className → optional extra CSS classes for layout customization
// ============================================================

import React from 'react'

export default function Stat({ title, value, className = '' }) {
  return (
    // Stat card container with semi-transparent background and border
    <div className={`bg-white/10 border border-white/10 rounded-2xl p-4 text-white ${className}`}>

      {/* Title — smaller text describing the metric */}
      <p className="text-sm text-white/60">{title}</p>

      {/* Value — large bold number or text for the metric */}
      <h3 className="text-3xl font-bold mt-2">{value}</h3>

    </div>
  )
}