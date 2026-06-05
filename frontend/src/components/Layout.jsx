// ============================================================
// components/Layout.jsx
// This is the main layout wrapper component used by every page.
// It provides the consistent structure that all pages share:
//   - A top navigation bar (header)
//   - A sidebar with navigation links
//   - A main content area where page content is rendered
//
// Usage: Wrap any page with <Layout> to get the full layout
// Props:
//   children → the page content to render in the main area
//   isAdmin  → boolean, shows the Admin link in sidebar if true
// ============================================================

import logo from '../assets/logo.png'
import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Menu,
  Bell,
  Settings,
  Users,
  LayoutDashboard,
  Home,
  BarChart3,
  Clock3,
  BellRing,
  LogIn,
  UserPlus,
  ShieldCheck
} from 'lucide-react'

// Layout receives 'children' (page content) and 'isAdmin' (role flag)
export default function Layout({ children, isAdmin = false }) {

  // useNavigate allows us to programmatically navigate to other pages
  // Used for the topbar icon buttons (Bell, Settings, Users)
  const navigate = useNavigate()

  // Navigation links shown in the sidebar
  // Each item has a display name, route path, and icon component
  const nav = [
    { name: 'Home',          path: '/',              icon: Home           },
    { name: 'Dashboard',     path: '/dashboard',     icon: LayoutDashboard },
    { name: 'Monitoring',    path: '/monitoring',    icon: BarChart3      },
    { name: 'Token',         path: '/token',         icon: Clock3         },
    { name: 'Notifications', path: '/notifications', icon: BellRing       },
    { name: 'Login',         path: '/login',         icon: LogIn          },
    { name: 'Register',      path: '/register',      icon: UserPlus       },
    { name: 'Settings',      path: '/settings',      icon: Settings       }
  ]

  return (
    // Outer wrapper — dark background for the whole page
    <div className="min-h-screen bg-[#0b1020] p-6">

      {/* Main container with rounded corners and gradient background */}
      <div className="rounded-[28px] overflow-hidden border border-white/10 shadow-2xl bg-gradient-to-br from-[#262657] via-[#2f2d63] to-[#2f5974]">

        {/* ── TOPBAR ─────────────────────────────────────────── */}
        {/* The header bar at the top of every page */}
        <header className="h-20 px-6 flex items-center justify-between bg-gradient-to-r from-[#7c24ff] via-[#d43cff] to-[#11c6e8]">

          {/* Left side — menu icon and app title */}
          <div className="flex items-center gap-4 text-white">
            <Menu size={26} />
            <h1 className="text-2xl font-semibold">Welcome QueuePro</h1>
          </div>

          {/* Right side — action icons that navigate to specific pages */}
          <div className="flex items-center gap-6 text-white">

            {/* Bell icon → goes to Notifications page */}
            <button
              onClick={() => navigate('/notifications')}
              className="hover:opacity-70 transition-opacity"
              title="Notifications"
            >
              <Bell size={24} />
            </button>

            {/* Settings icon → goes to Settings page */}
            <button
              onClick={() => navigate('/settings')}
              className="hover:opacity-70 transition-opacity"
              title="Settings"
            >
              <Settings size={24} />
            </button>

            {/* Users icon → goes to Dashboard page */}
            <button
              onClick={() => navigate('/dashboard')}
              className="hover:opacity-70 transition-opacity"
              title="Dashboard"
            >
              <Users size={24} />
            </button>

          </div>
        </header>

        {/* ── BODY (Sidebar + Content) ──────────────────────── */}
        <div className="flex">

          {/* ── SIDEBAR ──────────────────────────────────────── */}
          {/* Left navigation panel shown on every page */}
          <aside className="w-[310px] min-h-[calc(100vh-128px)] bg-black/15 border-r border-white/10 px-6 py-4">

            {/* App logo at the top of the sidebar */}
            <div className="flex justify-center mb-8">
              <img
                src={logo}
                alt="QueuePro Logo"
                className="w-16 h-16 rounded-full object-cover shadow-xl"
              />
            </div>

            {/* Navigation links */}
            <nav className="space-y-3">

              {/* Loop through nav items and render each as a NavLink */}
              {nav.map((item) => {
                const Icon = item.icon   // Get the icon component for this nav item

                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    // NavLink provides isActive — true when current page matches this path
                    // Active link gets cyan highlight, inactive links get hover effect
                    className={({ isActive }) =>
                      `flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${
                        isActive
                          ? 'bg-cyan-400 text-[#111827] shadow-lg font-semibold'
                          : 'text-white/85 hover:bg-white/10'
                      }`
                    }
                  >
                    <Icon size={22} />
                    <span className="text-[18px]">{item.name}</span>
                  </NavLink>
                )
              })}

              {/* Admin link — ONLY shown when isAdmin prop is true */}
              {/* This prevents regular customers from seeing the admin link */}
              {isAdmin && (
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `flex items-center gap-4 px-5 py-4 rounded-2xl transition-all ${
                      isActive
                        ? 'bg-red-400 text-[#111827] shadow-lg font-semibold'
                        : 'text-white/85 hover:bg-white/10'
                    }`
                  }
                >
                  <ShieldCheck size={22} />
                  <span className="text-[18px]">Admin</span>
                </NavLink>
              )}

            </nav>
          </aside>

          {/* ── MAIN CONTENT AREA ────────────────────────────── */}
          {/* This is where each page's content gets rendered */}
          {/* 'children' refers to whatever is wrapped inside <Layout> */}
          <main className="flex-1 p-7 overflow-y-auto">
            {children}
          </main>

        </div>
      </div>
    </div>
  )
}