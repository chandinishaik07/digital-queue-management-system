// ============================================================
// seed.js
// This is a one-time setup script that populates the MongoDB
// database with initial data needed for the app to work.
//
// It creates:
//   - 4 Service Counters (Counter 1 to Counter 4)
//   - 4 Agent accounts in the users collection
//   - 7 days of QueueAnalytics data for the charts
//
// HOW TO RUN (only run this once):
//   cd backend
//   node seed.js
//
// WARNING: This script DELETES existing counters and analytics
// before inserting new ones. Do not run it again after setup
// unless you want to reset that data.
// ============================================================

require('dotenv').config()       // Load MONGO_URI and PORT from .env file
const mongoose       = require('mongoose')

// Import models — these define the structure of each collection
const ServiceCounter = require('./models/ServiceCounter')
const User           = require('./models/User')
const QueueAnalytics = require('./models/QueueAnalytics')

// Main async function — we use async because all database
// operations return Promises and we need to await them
async function seed() {

  // ── CONNECT TO MONGODB ──────────────────────────────────
  // Connect to the MongoDB Atlas database using the URI from .env
  await mongoose.connect(process.env.MONGO_URI)
  console.log('✅ Connected to MongoDB')

  // ── CLEAR EXISTING DATA ─────────────────────────────────
  // Delete all existing counters and analytics before re-seeding
  // This prevents duplicate data if the script is run again
  // Note: We do NOT delete users — real registered users would be lost
  await ServiceCounter.deleteMany({})
  await QueueAnalytics.deleteMany({})
  console.log('🗑️  Cleared existing counters and analytics')

  // ── CREATE AGENT ACCOUNTS ───────────────────────────────
  // Check if agents already exist before creating them
  // This prevents duplicate agent accounts
  const existingAgents = await User.find({ role: 'agent' })

  let agents = existingAgents  // Use existing agents if they exist

  if (existingAgents.length === 0) {
    // No agents found — create 4 new agent accounts
    // These are inserted into the 'users' collection with role 'agent'
    agents = await User.insertMany([
      { name: 'Agent A', email: 'agenta@queuepro.com', password: 'agent123', role: 'agent' },
      { name: 'Agent B', email: 'agentb@queuepro.com', password: 'agent123', role: 'agent' },
      { name: 'Agent C', email: 'agentc@queuepro.com', password: 'agent123', role: 'agent' },
      { name: 'Agent D', email: 'agentd@queuepro.com', password: 'agent123', role: 'agent' }
    ])
    console.log('👷 Agents created:', agents.map(a => a.name).join(', '))
  } else {
    console.log('👷 Using existing agents:', agents.map(a => a.name).join(', '))
  }

  // ── CREATE SERVICE COUNTERS ─────────────────────────────
  // Create 4 counters and assign one agent to each
  // agents[0] → Counter 1, agents[1] → Counter 2, etc.
  const counters = await ServiceCounter.insertMany([
    {
      counterName:   'Counter 1',
      assignedAgent: agents[0]?._id || null,  // Assign first agent (or null if no agents)
      status:        'open'                    // Counter starts as open
    },
    {
      counterName:   'Counter 2',
      assignedAgent: agents[1]?._id || null,
      status:        'open'
    },
    {
      counterName:   'Counter 3',
      assignedAgent: agents[2]?._id || null,
      status:        'open'
    },
    {
      counterName:   'Counter 4',
      assignedAgent: agents[3]?._id || null,
      status:        'break'                   // Counter 4 starts on break
    }
  ])
  console.log('🏢 Counters created:', counters.map(c => c.counterName).join(', '))

  // ── SEED QUEUE ANALYTICS ────────────────────────────────
  // Create 7 days of analytics data for the bar chart
  // and satisfaction pie chart in the dashboard
  const today        = new Date()
  const analyticsData = []

  // Loop from 6 days ago to today (i = 6 means 6 days ago, i = 0 means today)
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)                  // Go back i days
    const dateStr = date.toISOString().split('T')[0]  // Format as YYYY-MM-DD

    // Generate realistic random data for each day
    analyticsData.push({
      date:               dateStr,
      totalCustomers:     Math.floor(Math.random() * 40) + 10,   // 10 to 50 customers
      averageServiceTime: Math.floor(Math.random() * 10) + 3,    // 3 to 13 minutes
      poor:               Math.floor(Math.random() * 5),          // 0 to 4 poor ratings
      average:            Math.floor(Math.random() * 10) + 5,    // 5 to 14 average ratings
      good:               Math.floor(Math.random() * 20) + 10,   // 10 to 29 good ratings
      excellent:          Math.floor(Math.random() * 30) + 15,   // 15 to 44 excellent ratings
      queuePerformance:   Math.floor(Math.random() * 20) + 80    // 80% to 100% performance
    })
  }

  // Insert all 7 analytics records at once
  await QueueAnalytics.insertMany(analyticsData)
  console.log('📊 QueueAnalytics seeded for last 7 days')

  // ── DONE ────────────────────────────────────────────────
  console.log('\n✅ Seed complete! Your database is ready.')
  console.log('   You can now login with:')
  console.log('   Admin  → admin@queuepro.com  / admin123')
  console.log('   Agent  → agenta@queuepro.com / agent123')
  console.log('   Customer → register a new account\n')

  // Exit the Node process — seed script is done
  process.exit(0)
}

// Run the seed function
// If anything goes wrong, log the error and exit with error code 1
seed().catch(err => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})