// ============================================================
// pages/Home.jsx
// The landing page of QueuePro — the first page users see.
//
// Sections:
//   1. Hero section — main headline, description, image, CTA buttons
//   2. Features section — 3 cards explaining key features
//
// Button actions:
//   "Get Started" → navigates to /token (join the queue)
//   "Watch Demo"  → navigates to /monitoring (see live queue)
// ============================================================

import React      from 'react'
import { useNavigate } from 'react-router-dom'
import Layout     from '../components/Layout'
import hero       from '../assets/hero.png'  // Hero banner image

export default function Home() {

  // useNavigate for button click navigation
  const navigate = useNavigate()

  // Feature cards data — title and description for each feature
  const features = [
    ['Live Tokens',  'Real-time token updates across counters'],
    ['Analytics',    'Track peak hours and waiting times'     ],
    ['Easy Access',  'Simple login for admins and customers'  ]
  ]

  return (
    <Layout>
      <div className="space-y-6">

        {/* ── HERO SECTION ─────────────────────────────── */}
        {/* Main banner section at the top of the home page */}
        <section className="rounded-3xl border border-white/10 bg-white/10 backdrop-blur-xl p-10 shadow-2xl">

          {/* Small label above the main heading */}
          <p className="text-cyan-300 tracking-[8px] text-lg mb-4">
            SMART QUEUE PLATFORM
          </p>

          {/* Main headline */}
          <h1 className="text-white text-8xl font-bold leading-tight">
            Skip The Wait.
            <br />
            Serve Faster.
          </h1>

          {/* Subtitle description */}
          <p className="text-white/70 text-2xl mt-6 max-w-5xl leading-relaxed">
            Digitize queues for banks, hospitals, colleges, and offices with
            real-time token tracking, analytics, and customer alerts.
          </p>

          {/* Hero banner image */}
          <img
            src={hero}
            alt="QueuePro Hero"
            className="w-full rounded-2xl mt-6"
          />

          {/* Call-to-action buttons */}
          <div className="flex gap-5 mt-8">

            {/* Primary button — takes user to join the queue */}
            <button
              onClick={() => navigate('/token')}
              className="px-10 py-5 rounded-2xl bg-cyan-400 text-[#111827] font-bold text-2xl shadow-lg hover:bg-cyan-300 transition-colors"
            >
              Get Started
            </button>

            {/* Secondary button — shows live monitoring page as a demo */}
            <button
              onClick={() => navigate('/monitoring')}
              className="px-10 py-5 rounded-2xl border border-white/20 text-white text-2xl hover:bg-white/10 transition-colors"
            >
              Watch Demo
            </button>

          </div>
        </section>

        {/* ── FEATURES SECTION ─────────────────────────── */}
        {/* Three cards highlighting key platform features */}
        <section className="grid grid-cols-3 gap-6">
          {features.map(([title, desc]) => (
            <div
              key={title}
              className="rounded-3xl border border-white/10 bg-white/10 p-8 shadow-xl"
            >
              {/* Feature title */}
              <h3 className="text-white text-4xl font-semibold mb-4">{title}</h3>

              {/* Feature description */}
              <p className="text-white/65 text-xl leading-relaxed">{desc}</p>
            </div>
          ))}
        </section>

      </div>
    </Layout>
  )
}