// ============================================================
// pages/Token.jsx
// The Token Generation page — publicly accessible.
//
// QR Code:
//   Before token generation → shows a styled placeholder box
//   After token generation  → shows a real scannable QR code
//   The QR URL uses window.location.hostname so it works
//   on both localhost and network IP automatically
// ============================================================

import React, { useState, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'  // Real QR code generator
import Layout        from '../components/Layout'

// No longer importing qr.png — replaced with a styled placeholder div
// This avoids the ERR_CONNECTION_REFUSED error for the static image

export default function Token() {

  // ── STATE ──────────────────────────────────────────────
  const [token,           setToken]           = useState(null)
  const [name,            setName]            = useState('')
  const [selectedService, setSelectedService] = useState('')
  const [toast,           setToast]           = useState('')
  const [loading,         setLoading]         = useState(false)

  const qrRef = useRef(null)

  // ── DYNAMIC QR URL ─────────────────────────────────────
  // Automatically uses the current hostname and port
  // Works on localhost and on network IP (192.168.x.x)
  const MONITORING_URL = `http://${window.location.hostname}:5173/monitoring`

  // ── SHOW TOAST ─────────────────────────────────────────
  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  // ── JOIN METHODS ───────────────────────────────────────
  const joinMethods = [
    {
      title:  'QR Scan',
      desc:   'Use mobile camera',
      action: () => {
        qrRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        showToast('Scan the QR code below with your mobile camera')
      }
    },
    {
      title:  'Kiosk',
      desc:   'Join at branch',
      action: () => showToast('Visit the kiosk at the branch entrance to get a token')
    },
    {
      title:  'Walk-in Help',
      desc:   'Staff assistance',
      action: () => showToast('Approach any staff member at the counter for assistance')
    }
  ]

  // ── SERVICE OPTIONS ────────────────────────────────────
  const services = [
    { title: 'General Service', desc: 'Most used' },
    { title: 'Billing',         desc: 'Payments'  },
    { title: 'Support',         desc: 'Help desk'  }
  ]

  // ── GENERATE TOKEN ─────────────────────────────────────
  const generateToken = async () => {

    if (!name.trim()) {
      showToast('Please enter your name before generating a token')
      return
    }

    if (!selectedService) {
      showToast('Please select a service first')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('http://localhost:5000/api/queue/add', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          name:    name.trim(),
          service: selectedService
        })
      })

      const data = await res.json()

      setToken(data)
      showToast(`Token #${data.tokenNumber} generated! Scan the QR code to track your queue.`)

      // Scroll to QR code after generation
      setTimeout(() => {
        qrRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 500)

    } catch (err) {
      console.error(err)
      showToast('Error generating token. Is the server running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout>

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 px-6 py-4 rounded-2xl bg-cyan-400 text-slate-900 font-semibold text-lg shadow-2xl">
          {toast}
        </div>
      )}

      <div className="space-y-6">

        <section className="rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl">
          <h1 className="text-white text-5xl font-bold mb-3">
            Join Digital Queue
          </h1>
          <p className="text-white/70 text-xl mb-8">
            Enter your name, select a service, then generate your token.
          </p>

          {/* Name input */}
          <input
            type="text"
            placeholder="Enter your full name"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-6 py-5 rounded-2xl bg-white/10 border border-white/10 text-white placeholder:text-white/40 text-xl outline-none mb-6 focus:border-cyan-400/50 transition-colors"
          />

          {/* Join method buttons */}
          <div className="grid grid-cols-3 gap-5 mb-6">
            {joinMethods.map(({ title, desc, action }) => (
              <button
                key={title}
                onClick={action}
                className="rounded-3xl bg-white/10 border border-white/10 p-6 text-left hover:bg-cyan-400/20 hover:border-cyan-400/30 transition-all"
              >
                <h3 className="text-white text-3xl font-semibold">{title}</h3>
                <p className="text-white/60 text-lg mt-2">{desc}</p>
              </button>
            ))}
          </div>

          {/* Service selection */}
          <p className="text-white/60 text-lg mb-3">Select a service:</p>
          <div className="grid grid-cols-3 gap-5 mb-8">
            {services.map(({ title, desc }) => (
              <button
                key={title}
                onClick={() => setSelectedService(title)}
                className={`rounded-3xl border p-6 text-left transition-all ${
                  selectedService === title
                    ? 'bg-violet-500/30 border-violet-400/50 shadow-lg'
                    : 'bg-white/10 border-white/10 hover:bg-violet-400/20 hover:border-violet-400/30'
                }`}
              >
                <h3 className="text-white text-3xl font-semibold">{title}</h3>
                <p className="text-white/60 text-lg mt-2">{desc}</p>
                {selectedService === title && (
                  <p className="text-violet-300 text-sm mt-3 font-semibold">✓ Selected</p>
                )}
              </button>
            ))}
          </div>

          {/* ── QR CODE SECTION ────────────────────────── */}
          <div ref={qrRef} className="flex flex-col items-center mb-8">

            {token ? (
              // ── REAL QR CODE ──────────────────────────
              // Appears after token is generated
              <div className="flex flex-col items-center gap-4">

                {/* White background needed for QR code to scan correctly */}
                <div className="bg-white rounded-3xl p-6 shadow-2xl">
                  <QRCodeSVG
                    value={MONITORING_URL}  // Dynamic URL — works on any network
                    size={240}
                    level="H"              // Highest error correction
                    includeMargin={true}
                  />
                </div>

                <div className="text-center">
                  <p className="text-cyan-300 text-xl font-semibold">
                    Scan to track your queue live
                  </p>
                  <p className="text-white/50 text-lg mt-1">
                    Opens the live monitoring page on your phone
                  </p>
                  {/* Shows the actual URL for verification */}
                  <p className="text-white/30 text-sm mt-2 font-mono break-all">
                    {MONITORING_URL}
                  </p>
                </div>

              </div>
            ) : (
              // ── STYLED PLACEHOLDER ────────────────────
              // Shown before token generation
              // No image file dependency — pure CSS styling
              <div className="flex flex-col items-center gap-4">

                {/* Placeholder box styled to look like a QR frame */}
                <div className="w-60 h-60 rounded-3xl border-2 border-dashed border-white/20 bg-white/5 flex flex-col items-center justify-center gap-3">
                  {/* QR grid pattern using divs */}
                  <div className="grid grid-cols-3 gap-1.5 opacity-30">
                    {[...Array(9)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-8 h-8 rounded-sm ${
                          [0,2,6,8].includes(i)
                            ? 'bg-white'       // Corner squares — solid
                            : i === 4
                              ? 'bg-white'     // Center square — solid
                              : 'bg-white/40'  // Other squares — faded
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-white/30 text-sm text-center px-4">
                    QR code will appear here
                  </p>
                </div>

                <p className="text-white/40 text-lg">
                  Generate a token to get your real QR code
                </p>
              </div>
            )}

          </div>

          {/* Generate Token button */}
          <button
            onClick={generateToken}
            disabled={loading}
            className={`w-full py-5 rounded-3xl text-black text-2xl font-bold shadow-lg transition-all ${
              loading
                ? 'bg-cyan-300 opacity-60 cursor-not-allowed'
                : 'bg-cyan-400 hover:bg-cyan-300'
            }`}
          >
            {loading ? 'Generating...' : 'Generate Digital Token'}
          </button>
        </section>

        {/* ── TOKEN INFO ───────────────────────────────── */}
        <section className="grid grid-cols-3 gap-6">

          <div className={`rounded-3xl border p-8 text-center shadow-xl transition-all ${
            token
              ? 'border-cyan-400/30 bg-cyan-400/10'
              : 'border-white/10 bg-white/10'
          }`}>
            <p className="text-white/70 text-2xl">Queue Number</p>
            <h2 className="text-white text-7xl font-bold mt-4">
              {token ? `#${token.tokenNumber}` : '—'}
            </h2>
            {token && (
              <p className="text-cyan-300 text-lg mt-2">{token.name}</p>
            )}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-8 text-center shadow-xl">
            <p className="text-white/70 text-2xl">Service</p>
            <h2 className={`font-bold mt-4 text-white ${token ? 'text-4xl' : 'text-7xl'}`}>
              {token ? token.service : '—'}
            </h2>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/10 p-8 text-center shadow-xl">
            <p className="text-white/70 text-2xl">Estimated Wait</p>
            <h2 className="text-white text-7xl font-bold mt-4">
              {token ? '5-10m' : '—'}
            </h2>
            {token && (
              <p className="text-white/40 text-lg mt-2">Scan QR to track live</p>
            )}
          </div>

        </section>
      </div>
    </Layout>
  )
}