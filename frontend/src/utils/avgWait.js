// ============================================================
// utils/avgWait.js
// A utility function to calculate average wait time
// from an array of queue tokens.
//
// Why this exists as a separate file:
//   The same avg wait calculation was being copy-pasted into
//   Dashboard.jsx, CustomerDashboard.jsx, Monitoring.jsx, and Admin.jsx.
//   Instead of repeating the same logic in 4 places, we put it
//   here once and import it wherever needed.
//   This follows the DRY principle — Don't Repeat Yourself.
//
// Usage:
//   import { calcAvgWait } from '../utils/avgWait'
//
//   const avgWait = calcAvgWait(waitingTokens, 'short')
//   // returns e.g. "8m" or "<1m"
//
//   const avgWait = calcAvgWait(waitingTokens, 'long')
//   // returns e.g. "08:45" (mm:ss format)
//
// Parameters:
//   waitingTokens → array of queue token objects with status 'waiting'
//   format        → 'short' for "8m" style, 'long' for "08:45" style
// ============================================================

export function calcAvgWait(waitingTokens, format = 'short') {

  // If no waiting tokens, return zero immediately
  if (!waitingTokens || waitingTokens.length === 0) {
    return format === 'short' ? '0m' : '0:00'
  }

  const now = Date.now()  // Current timestamp in milliseconds

  // Calculate total milliseconds waited across all waiting tokens
  // reduce() loops through each token and accumulates a running total
  const totalMs = waitingTokens.reduce((sum, q) => {
    const created = new Date(q.createdAt).getTime()  // Token creation time in ms
    const diff    = now - created                     // How long they've been waiting

    // Skip tokens with invalid dates:
    //   diff < 0        → createdAt is in the future (bad data)
    //   diff > 24 hours → token is stale (old data that wasn't cleaned up)
    // This prevents the "525328 min" bug caused by old test data
    if (diff < 0 || diff > 24 * 60 * 60 * 1000) return sum

    return sum + diff
  }, 0)

  // Calculate the average by dividing total by number of tokens
  const avgMs = totalMs / waitingTokens.length

  // Convert average milliseconds to minutes
  const mins = Math.floor(avgMs / 60000)

  // Cap at 60 minutes — if somehow bad data slips through,
  // we never show a number higher than 60 min on screen
  const displayMins = Math.min(mins, 60)

  // Return in the requested format
  if (format === 'short') {
    // Short format: "<1m" or "8m"
    return displayMins < 1 ? '<1m' : `${displayMins}m`
  }

  // Long format: "mm:ss" e.g. "08:45"
  const secs = Math.floor((avgMs % 60000) / 1000)  // Remaining seconds after minutes
  return `${String(displayMins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}