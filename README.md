# QueuePro – Digital Queue Management System

## Overview

QueuePro is a full-stack MERN-based Digital Queue Management System designed to replace traditional physical queues with a smart digital token system. The platform enables customers to generate tokens, monitor queue status in real time, and receive updates while administrators and service agents efficiently manage queue operations through dedicated dashboards.

## Features

### Authentication & Security

* JWT Authentication
* bcrypt Password Hashing
* Protected API Routes
* Role-Based Authorization
* Persistent Login Sessions

### Queue Management

* Digital Token Generation
* Automatic Token Numbering
* Live Queue Monitoring
* Queue Status Updates
* Now Serving Display
* Queue Position Tracking

### User Roles

#### Admin

* Manage service counters
* Assign agents to counters
* Monitor queue performance
* View analytics dashboards
* Control queue operations

#### Agent

* Manage assigned counters
* Serve customers
* Call next token
* Schedule appointments
* Update queue status

#### Customer

* Generate queue tokens
* Track queue position
* View live queue updates
* Access QR-based monitoring

### Additional Features

* QR Code Generation
* Appointment Scheduling
* Customer Satisfaction Ratings
* Analytics Dashboard
* Pie Charts and Weekly Reports
* Mobile Responsive Interface
* Auto Refresh Monitoring

---

## Tech Stack

### Frontend

* React.js
* Vite
* Tailwind CSS
* Recharts
* Lucide React
* QRCode React

### Backend

* Node.js
* Express.js
* MongoDB Atlas
* Mongoose
* JWT
* bcryptjs

---

## Project Structure

```text
QueuePro
│
├── backend
│   ├── middleware
│   ├── models
│   ├── routes
│   ├── server.js
│   ├── package.json
│   └── package-lock.json
│
├── frontend
│   ├── src
│   │   ├── components
│   │   ├── pages
│   │   ├── assets
│   │   └── utils
│   ├── package.json
│   └── package-lock.json
│
├── README.md
└── .gitignore
```

---

## Database Collections

### Users

Stores user accounts and roles.

### Queues

Stores customer tokens and queue status.

### ServiceCounters

Stores service counters and assigned agents.

### QueueAnalytics

Stores customer satisfaction ratings and performance metrics.

---

## Installation

### Clone Repository

```bash
git clone <repository-url>
cd queuepro
```

### Backend Setup

```bash
cd backend
npm install
npm start
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables

Create a `.env` file inside the backend folder:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

---

## Security Improvements

* Passwords are hashed using bcrypt before storage.
* Authentication uses JSON Web Tokens (JWT).
* Sensitive routes are protected using middleware.
* Admin-only operations require authorization.
* Environment variables are secured using `.env`.

---

## Future Enhancements

* Real-time updates using Socket.IO
* SMS and Email Notifications
* Multi-Branch Queue Management
* AI-Based Wait Time Prediction
* Queue Analytics Dashboard Enhancements
* Customer Feedback System

---

## Author

**Shaik Chandini**


---

## License

This project is developed for educational purposes.
