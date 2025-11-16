import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as api from '../services/api'
import ExerciseDetail from '../components/ExerciseDetail'
import './TodaysWorkout.css'

function TodaysWorkout({ user }) {
  const [plans, setPlans] = useState([])
  const [todaysWorkout, setTodaysWorkout] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedExercise, setSelectedExercise] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    loadTodaysWorkout()
  }, [user.id])

  const loadTodaysWorkout = async () => {
    try {
      setLoading(true)
      // Get user's plans
      const plansData = await api.getUserPlans(user.id)
      setPlans(plansData.plans)

      if (plansData.plans.length === 0) {
        setError('no-plan')
        return
      }

      // Get today's workout from the first plan
      const activePlan = plansData.plans[0]
      try {
        const todayData = await api.getTodaysWorkout(activePlan.id)
        setTodaysWorkout(todayData)
      } catch (err) {
        setError('rest-day')
      }
    } catch (error) {
      console.error('Error loading today\'s workout:', error)
      setError('error')
    } finally {
      setLoading(false)
    }
  }

  const handleStartWorkout = () => {
    if (todaysWorkout) {
      navigate(`/log-workout/${todaysWorkout.planId}/${todaysWorkout.day}`)
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading-spinner">Loading today's workout...</div>
      </div>
    )
  }

  if (error === 'no-plan') {
    return (
      <div className="container">
        <div className="card empty-state">
          <h2>📝 No Training Plan</h2>
          <p className="text-muted">You haven't created a training plan yet.</p>
          <Link to="/generate-plan" className="btn btn-primary btn-lg">
            Generate Your First Plan
          </Link>
        </div>
      </div>
    )
  }

  if (error === 'rest-day' || (todaysWorkout && todaysWorkout.workout.type === 'rest')) {
    return (
      <div className="container">
        <div className="card rest-day">
          <div className="rest-day-icon">😴</div>
          <h2>Rest Day</h2>
          <p className="text-muted">
            No workout scheduled for today. Your body needs recovery!
          </p>
          <div className="rest-day-tips">
            <h3>Rest Day Tips:</h3>
            <ul>
              <li>Stay hydrated</li>
              <li>Get quality sleep</li>
              <li>Light stretching or walking is okay</li>
              <li>Fuel your body with good nutrition</li>
            </ul>
          </div>
          <Link to="/dashboard" className="btn btn-outline mt-3">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (!todaysWorkout) {
    return (
      <div className="container">
        <div className="card empty-state">
          <h2>❌ No Workout Found</h2>
          <p className="text-muted">Something went wrong loading today's workout.</p>
          <Link to="/dashboard" className="btn btn-outline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const { workout } = todaysWorkout

  return (
    <div className="container today-workout">
      <div className="workout-header">
        <h1>{workout.day}'s Workout</h1>
        <div className="workout-type-badge">
          <span className="badge badge-primary">{workout.type}</span>
        </div>
      </div>

      <div className="card">
        <h3 className="mb-3">Exercises ({workout.exercises.length})</h3>
        <div className="exercises-today">
          {workout.exercises.map((exercise, index) => (
            <div
              key={index}
              className="exercise-card-today"
              onClick={() => setSelectedExercise(exercise)}
              style={{ cursor: 'pointer' }}
            >
              <div className="exercise-number">{index + 1}</div>
              <div className="exercise-details">
                <h4 className="exercise-name">
                  {exercise.name}
                  {exercise.videoUrl && <span className="video-icon">📹</span>}
                </h4>
                {exercise.category === 'strength' ? (
                  <div className="exercise-volume">
                    <span className="volume-badge">
                      {exercise.volume?.sets || 3} sets
                    </span>
                    <span className="volume-badge">
                      {exercise.volume?.reps || '8-12'} reps
                    </span>
                    {exercise.volume?.rest && (
                      <span className="volume-badge">
                        {exercise.volume.rest} rest
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="exercise-volume">
                    <span className="volume-badge">
                      {exercise.volume?.duration || '20 min'}
                    </span>
                    <span className="volume-badge">
                      {exercise.volume?.intensity || 'moderate'}
                    </span>
                  </div>
                )}
                {exercise.muscleGroups && exercise.muscleGroups.length > 0 && (
                  <div className="muscle-groups">
                    {exercise.muscleGroups.slice(0, 3).map((muscle, i) => (
                      <span key={i} className="muscle-tag">{muscle}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleStartWorkout}
          className="btn btn-primary btn-block btn-lg mt-4 start-workout-btn"
        >
          Start Workout 🚀
        </button>
      </div>

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <ExerciseDetail
          exercise={{
            ...selectedExercise,
            sets: selectedExercise.volume?.sets,
            reps: selectedExercise.volume?.reps,
            restTime: selectedExercise.volume?.rest ? parseInt(selectedExercise.volume.rest) : null
          }}
          onClose={() => setSelectedExercise(null)}
        />
      )}
    </div>
  )
}

export default TodaysWorkout
