import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import * as api from '../services/api'
import './Dashboard.css'

function Dashboard({ user }) {
  const [plans, setPlans] = useState([])
  const [recentWorkouts, setRecentWorkouts] = useState([])
  const [stats, setStats] = useState(null)
  const [weeklyCalendar, setWeeklyCalendar] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    loadDashboardData()
  }, [user.id, location.pathname])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [plansData, workoutsData, statsData] = await Promise.all([
        api.getUserPlans(user.id),
        api.getUserWorkouts(user.id, 5),
        api.getWorkoutStats(user.id, 'week')
      ])

      setPlans(plansData.plans)
      setRecentWorkouts(workoutsData.workouts)
      setStats(statsData.stats)

      // Generate weekly calendar
      generateWeeklyCalendar(workoutsData.workouts)
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateWeeklyCalendar = (workouts) => {
    const today = new Date()
    const dayOfWeek = today.getDay() // 0 = Sunday
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - dayOfWeek)

    const calendar = []
    const workoutDates = new Set(
      workouts.map(w => new Date(w.date).toDateString())
    )

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)

      const isToday = date.toDateString() === today.toDateString()
      const hasWorkout = workoutDates.has(date.toDateString())
      const isPast = date < today && !isToday
      const isFuture = date > today

      calendar.push({
        date,
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i],
        dayNum: date.getDate(),
        isToday,
        hasWorkout,
        isPast,
        isFuture
      })
    }

    setWeeklyCalendar(calendar)
  }

  // Check if user needs onboarding
  useEffect(() => {
    if (!user.equipment || user.equipment.length === 0) {
      navigate('/onboarding')
    }
  }, [user, navigate])

  if (loading) {
    return (
      <div className="container">
        <div className="loading-spinner">Loading...</div>
      </div>
    )
  }

  const activePlan = plans.length > 0 ? plans[0] : null

  return (
    <div className="container dashboard">
      <h1 className="dashboard-title">Welcome back, {user.name}! 💪</h1>

      {/* Weekly Check-In Calendar */}
      {weeklyCalendar.length > 0 && (
        <div className="card weekly-calendar-card">
          <h3>This Week's Activity</h3>
          <div className="weekly-calendar">
            {weeklyCalendar.map((day, index) => (
              <div
                key={index}
                className={`calendar-day ${day.hasWorkout ? 'has-workout' : ''} ${
                  day.isToday ? 'is-today' : ''
                } ${day.isPast && !day.hasWorkout ? 'missed' : ''}`}
              >
                <div className="day-name">{day.day}</div>
                <div className="day-number">{day.dayNum}</div>
                <div className="day-indicator">
                  {day.hasWorkout ? '✓' : day.isPast ? '•' : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Stats */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">🏋️</div>
            <div className="stat-value">{stats.totalWorkouts}</div>
            <div className="stat-label">Gym Visits</div>
            <div className="stat-sublabel">This Week</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-value">{stats.totalDuration || stats.avgDuration * stats.totalWorkouts}</div>
            <div className="stat-label">Total Minutes</div>
            <div className="stat-sublabel">Training Time</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">💪</div>
            <div className="stat-value">{stats.totalVolume.toLocaleString()}</div>
            <div className="stat-label">lbs Lifted</div>
            <div className="stat-sublabel">Total Volume</div>
          </div>
        </div>
      )}

      {/* Active Plan */}
      {activePlan ? (
        <div className="card">
          <div className="card-header">
            <h2>Your Active Plan</h2>
            <span className="badge badge-primary">{activePlan.splitType}</span>
          </div>
          <div className="plan-info">
            <p><strong>Goal:</strong> {activePlan.config.goal}</p>
            <p><strong>Days per week:</strong> {activePlan.config.daysPerWeek}</p>
            <p><strong>Duration:</strong> {activePlan.duration}</p>
            <p><strong>Week:</strong> {activePlan.currentWeek}/12</p>
          </div>
          <div className="button-group">
            <Link to="/today" className="btn btn-primary btn-block">
              View Today's Workout
            </Link>
            <Link to={`/generate-plan`} className="btn btn-outline">
              Generate New Plan
            </Link>
          </div>
        </div>
      ) : (
        <div className="card empty-state">
          <h2>No Active Plan</h2>
          <p className="text-muted">Let's create your first training plan!</p>
          <Link to="/generate-plan" className="btn btn-primary btn-lg">
            Generate Training Plan
          </Link>
        </div>
      )}

      {/* Recent Workouts */}
      {recentWorkouts.length > 0 && (
        <div className="card">
          <h2 className="card-title">Recent Workouts</h2>
          <div className="workouts-list">
            {recentWorkouts.map(workout => (
              <div key={workout.id} className="workout-item">
                <div className="workout-date">
                  {new Date(workout.date).toLocaleDateString()}
                </div>
                <div className="workout-details">
                  <span>{workout.exercises.length} exercises</span>
                  {workout.duration && <span> • {workout.duration} min</span>}
                  {workout.rpe && <span> • RPE {workout.rpe}/10</span>}
                </div>
              </div>
            ))}
          </div>
          <Link to="/progress" className="btn btn-outline btn-block mt-2">
            View All Progress
          </Link>
        </div>
      )}

      {/* Quick Actions */}
      <div className="quick-actions">
        <Link to="/generate-plan" className="action-card">
          <span className="action-icon">📝</span>
          <span className="action-label">New Plan</span>
        </Link>
        <Link to="/today" className="action-card">
          <span className="action-icon">🏋️</span>
          <span className="action-label">Today's Workout</span>
        </Link>
        <Link to="/progress" className="action-card">
          <span className="action-icon">📊</span>
          <span className="action-label">Progress</span>
        </Link>
      </div>
    </div>
  )
}

export default Dashboard
