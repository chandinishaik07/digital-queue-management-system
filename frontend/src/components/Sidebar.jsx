// ============================================================
// components/Sidebar.jsx
// A standalone sidebar navigation component.
// Note: This component is not currently used in the main app
// because Layout.jsx has its own built-in sidebar.
// This is kept as a standalone component for reference or
// if a page needs a sidebar without the full Layout wrapper.
//
// Displays a vertical list of navigation links with icons.
// ============================================================

import React from 'react'
import { Link } from 'react-router-dom'  // Link for client-side navigation
import {
  Monitor,
  Star,
  BarChart3,
  PieChart,
  Bell,
  Users,
  Settings
} from 'lucide-react'  // Icons from lucide-react library

export default function Sidebar() {

  // Navigation menu items
  // Each item is an array: [display name, route path, icon component]
  const menu = [
    ['Dashboard',     '/dashboard',     Monitor  ],
    ['Home',          '/',              Star     ],
    ['Monitoring',    '/monitoring',    BarChart3],
    ['Token',         '/token',         PieChart ],
    ['Notifications', '/notifications', Bell     ],
    ['Login',         '/login',         Users    ],
    ['Register',      '/register',      Users    ],
    ['Settings',      '/settings',      Settings ]
  ]

  return (
    // Sidebar container — fixed width, full height, dark semi-transparent background
    <aside className="w-60 min-h-screen bg-black/20 border-r border-white/10 p-4 space-y-2">

      {/* Loop through menu items and render each as a Link */}
      {menu.map(([name, path, Icon], i) => (
        <Link
          key={i}
          to={path}
          // Hover effect — cyan highlight on mouse over
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:bg-cyan-400/20 hover:text-white transition"
        >
          {/* Icon for this menu item */}
          <Icon size={18} />

          {/* Display name for this menu item */}
          <span>{name}</span>
        </Link>
      ))}

    </aside>
  )
}