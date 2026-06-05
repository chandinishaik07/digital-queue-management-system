// ============================================================
// components/Card.jsx
// A reusable card component used throughout the application.
// It provides a consistent glassmorphism style (frosted glass look)
// for any content wrapped inside it.
//
// Usage:
//   <Card>Your content here</Card>
//   <Card className="p-8">Content with extra padding</Card>
//
// Props:
//   children  → any content to display inside the card
//   className → optional extra CSS classes to customize the card
// ============================================================

import React from 'react'

export default function Card({ children, className = '' }) {
  return (
    // The card container with glassmorphism styling:
    // - bg-gradient → subtle white gradient for the glass effect
    // - backdrop-blur-xl → blurs the background behind the card
    // - border border-white/20 → semi-transparent white border
    // - rounded-2xl → nicely rounded corners
    // - shadow-lg → subtle drop shadow for depth
    // - ${className} → allows extra classes to be passed in
    <div
      className={`bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-xl border border-white/20 rounded-2xl shadow-lg ${className}`}
    >
      {/* Render whatever content is passed between <Card> tags */}
      {children}
    </div>
  )
}