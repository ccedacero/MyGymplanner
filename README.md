# MyGymPlanner - Hybrid Training Plan Generator

**A web app that generates personalized training plans combining strength training and cardio.**

## 🎯 Project Overview

MyGymPlanner solves the biggest pain points in fitness apps identified through comprehensive market research:

- **Lack of programming guidance** - Apps track workouts but don't tell users what to do
- **Multi-app problem** - Users need separate apps for strength and cardio
- **Slow workout logging** - Current apps interrupt workout flow
- **Generic exercises** - Don't match user's actual equipment

### Key Features

1. **Dual-Mode Exercise Library** - Built-in database (100 exercises) + optional custom uploads
2. **Intelligent Plan Generator** - Creates personalized upper/lower or full-body splits integrating strength + cardio
3. **Lightning-Fast Workout Logger** - Goal: log a set in <5 seconds

## 📊 Current Status

**Backend:** ✅ 100% Complete
**Frontend:** 🚧 40% Complete
**Overall:** 70% Complete

See `MVP_PROGRESS.md` for detailed status and next steps.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Git

### Installation

```bash
# Install dependencies
npm install

# Start development servers (both frontend & backend)
npm run dev
```

This will start:
- Backend API: http://localhost:3001
- Frontend: http://localhost:5173

## 📁 Project Structure

```
MyGymplanner/
├── client/                    # React frontend (40% complete)
├── server/                    # Express backend (100% complete)
├── FEATURE_PROPOSAL.md        # Full feature specifications
├── MARKET_RESEARCH_REPORT.md  # User research findings
├── MVP_PROGRESS.md            # Detailed progress tracker
└── README.md                  # This file
```

## 🛠 Technology Stack

**Frontend:** React 18, Vite, React Router
**Backend:** Node.js, Express, JWT auth, Bcrypt
**Data:** JSON files (MVP - easy migration to PostgreSQL)

## 📚 Documentation

- **MVP_PROGRESS.md** - What's done, what's next (START HERE)
- **FEATURE_PROPOSAL.md** - Complete feature specs
- **MARKET_RESEARCH_REPORT.md** - User pain points analysis

## 🎯 Next Steps

**To complete the MVP (6-10 hours):**
1. Complete 5 frontend pages (Dashboard, Plan Generator, Today's Workout, Logger, Progress)
2. See `MVP_PROGRESS.md` for detailed instructions

## 📝 License

MIT

---

**Last Updated:** November 16, 2025
**Completion:** 70%