import { useState, useEffect } from 'react'
import * as api from '../services/api'
import './Progress.css'

function Progress({ user }) {
  const [workouts, setWorkouts] = useState([])
  const [weekStats, setWeekStats] = useState(null)
  const [monthStats, setMonthStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProgress()
  }, [user.id])

  const loadProgress = async () => {
    try {
      setLoading(true)
      const [workoutsData, weekData, monthData] = await Promise.all([
        api.getUserWorkouts(user.id, 20),
        api.getWorkoutStats(user.id, 'week'),
        api.getWorkoutStats(user.id, 'month')
      ])

      setWorkouts(workoutsData.workouts)
      setWeekStats(weekData.stats)
      setMonthStats(monthData.stats)
    } catch (error) {
      console.error('Error loading progress:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading-spinner">Loading progress...</div>
      </div>
    )
  }

  const calculateStreak = () => {
    if (workouts.length === 0) return 0

    // Get unique workout dates sorted by most recent first
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const workoutDates = [...new Set(
      workouts.map(w => {
        const d = new Date(w.date)
        d.setHours(0, 0, 0, 0)
        return d.getTime()
      })
    )].sort((a, b) => b - a)

    // Check if most recent workout was today or yesterday
    const mostRecent = new Date(workoutDates[0])
    const daysSinceLastWorkout = Math.floor((now - mostRecent) / (1000 * 60 * 60 * 24))

    if (daysSinceLastWorkout > 1) return 0 // Streak broken

    // Count consecutive days
    let streak = 1
    for (let i = 1; i < workoutDates.length; i++) {
      const current = new Date(workoutDates[i])
      const previous = new Date(workoutDates[i - 1])
      const diff = Math.floor((previous - current) / (1000 * 60 * 60 * 24))

      if (diff === 1) {
        streak++
      } else {
        break
      }
    }

    return streak
  }

  const streak = calculateStreak()

  return (
    <div className="container progress-page">
      <h1 className="page-title">Your Progress 📊</h1>

      {/* Summary Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{workouts.length}</div>
          <div className="stat-label">Total Workouts</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{streak}</div>
          <div className="stat-label">Day Streak 🔥</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{weekStats?.totalWorkouts || 0}</div>
          <div className="stat-label">This Week</div>
        </div>
      </div>

      {/* This Week Stats */}
      {weekStats && (
        <div className="card">
          <h3 className="card-title">This Week</h3>
          <div className="progress-stats">
            <div className="stat-row">
              <span className="stat-label-text">Workouts</span>
              <span className="stat-value-text">{weekStats.totalWorkouts}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label-text">Total Volume</span>
              <span className="stat-value-text">{weekStats.totalVolume.toLocaleString()} lbs</span>
            </div>
            <div className="stat-row">
              <span className="stat-label-text">Avg Duration</span>
              <span className="stat-value-text">{weekStats.avgDuration} min</span>
            </div>
            {weekStats.avgRpe && (
              <div className="stat-row">
                <span className="stat-label-text">Avg RPE</span>
                <span className="stat-value-text">{weekStats.avgRpe}/10</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* This Month Stats */}
      {monthStats && (
        <div className="card">
          <h3 className="card-title">This Month</h3>
          <div className="progress-stats">
            <div className="stat-row">
              <span className="stat-label-text">Workouts</span>
              <span className="stat-value-text">{monthStats.totalWorkouts}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label-text">Total Volume</span>
              <span className="stat-value-text">{monthStats.totalVolume.toLocaleString()} lbs</span>
            </div>
            <div className="stat-row">
              <span className="stat-label-text">Avg Duration</span>
              <span className="stat-value-text">{monthStats.avgDuration} min</span>
            </div>
            {monthStats.avgRpe && (
              <div className="stat-row">
                <span className="stat-label-text">Avg RPE</span>
                <span className="stat-value-text">{monthStats.avgRpe}/10</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Workouts */}
      <div className="card">
        <h3 className="card-title">Recent Workouts</h3>
        {workouts.length === 0 ? (
          <p className="text-muted">No workouts logged yet. Start training!</p>
        ) : (
          <div className="workouts-timeline">
            {workouts.map((workout) => (
              <div key={workout.id} className="timeline-item">
                <div className="timeline-date">
                  {new Date(workout.date).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </div>
                <div className="timeline-content">
                  <div className="timeline-header">
                    <span className="timeline-exercises">{workout.exercises.length} exercises</span>
                    {workout.duration && (
                      <span className="timeline-duration">{workout.duration} min</span>
                    )}
                  </div>
                  {workout.notes && (
                    <p className="timeline-notes">{workout.notes}</p>
                  )}
                  {workout.rpe && (
                    <div className="timeline-rpe">
                      RPE: {workout.rpe}/10
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Achievements */}
      <div className="card">
        <h3 className="card-title">Achievements 🏆</h3>
        <div className="achievements-grid">
          {workouts.length >= 1 && (
            <div className="achievement-badge">
              <div className="achievement-icon">🎯</div>
              <div className="achievement-name">First Workout</div>
            </div>
          )}
          {workouts.length >= 10 && (
            <div className="achievement-badge">
              <div className="achievement-icon">💪</div>
              <div className="achievement-name">10 Workouts</div>
            </div>
          )}
          {workouts.length >= 30 && (
            <div className="achievement-badge">
              <div className="achievement-icon">⭐</div>
              <div className="achievement-name">30 Workouts</div>
            </div>
          )}
          {streak >= 3 && (
            <div className="achievement-badge">
              <div className="achievement-icon">🔥</div>
              <div className="achievement-name">3 Day Streak</div>
            </div>
          )}
          {streak >= 7 && (
            <div className="achievement-badge">
              <div className="achievement-icon">🚀</div>
              <div className="achievement-name">7 Day Streak</div>
            </div>
          )}
          {monthStats && monthStats.totalVolume > 50000 && (
            <div className="achievement-badge">
              <div className="achievement-icon">💎</div>
              <div className="achievement-name">50K lbs Lifted</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Progress
