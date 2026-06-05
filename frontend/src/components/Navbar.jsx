// ============================================================
// components/Navbar.jsx
// A simple top navigation bar component.
// Note: This component is not currently used in the main app
// because Layout.jsx has its own built-in topbar.
// This is kept as a standalone component that can be used
// in pages that don't use the full Layout wrapper.
//
// Displays:
//   - App name on the left
//   - Bell (notifications) and Users icons on the right
// ============================================================

import React from 'react'
import { Bell, Users } from 'lucide-react'  // Icon library

export default function Navbar() {
  return (
    // Navbar container — gradient background, full width, fixed height
    <div className="h-14 bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 text-white flex items-center justify-between px-4">

      {/* Left side — Application name */}
      <h1 className="font-semibold">QueuePro</h1>

      {/* Right side — Action icons */}
      <div className="flex gap-4">
        {/* Bell icon — for notifications */}
        <Bell size={18} />

        {/* Users icon — for user management */}
        <Users size={18} />
      </div>

    </div>
  )
}