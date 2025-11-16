import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import * as api from '../services/api'
import './WorkoutLogger.css'

function WorkoutLogger({ user }) {
  const { planId, day } = useParams()
  const navigate = useNavigate()
  const [workout, setWorkout] = useState(null)
  const [exercises, setExercises] = useState([])
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [restTimer, setRestTimer] = useState(0)
  const [isResting, setIsResting] = useState(false)
  const [workoutStartTime] = useState(Date.now())
  const [notes, setNotes] = useState('')
  const [rpe, setRpe] = useState(5)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadWorkout()
  }, [planId])

  // Rest timer countdown
  useEffect(() => {
    if (isResting && restTimer > 0) {
      const interval = setInterval(() => {
        setRestTimer(prev => {
          if (prev <= 1) {
            setIsResting(false)
            // Vibrate if supported
            if ('vibrate' in navigator) {
              navigator.vibrate(200)
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [isResting, restTimer])

  const loadWorkout = async () => {
    try {
      const todayData = await api.getTodaysWorkout(planId)
      setWorkout(todayData.workout)

      // Initialize exercise state with sets
      const exercisesWithSets = todayData.workout.exercises.map(ex => ({
        ...ex,
        sets: Array(ex.volume?.sets || 3).fill(null).map(() => ({
          weight: '',
          reps: '',
          completed: false
        }))
      }))
      setExercises(exercisesWithSets)
    } catch (error) {
      alert('Error loading workout: ' + error.message)
      navigate('/today')
    } finally {
      setLoading(false)
    }
  }

  const handleSetChange = (exerciseIndex, setIndex, field, value) => {
    setExercises(prev => {
      const newExercises = [...prev]
      newExercises[exerciseIndex].sets[setIndex][field] = value
      return newExercises
    })
  }

  const handleSetComplete = (exerciseIndex, setIndex) => {
    const exercise = exercises[exerciseIndex]
    const set = exercise.sets[setIndex]

    // Toggle completion
    const newCompleted = !set.completed

    setExercises(prev => {
      const newExercises = [...prev]
      newExercises[exerciseIndex].sets[setIndex].completed = newCompleted
      return newExercises
    })

    // Start rest timer if completing (not un-completing)
    if (newCompleted && exercise.category === 'strength') {
      const restTime = exercise.volume?.rest
      if (restTime) {
        // Parse rest time (e.g., "2 min" -> 120 seconds)
        const minutes = parseInt(restTime)
        if (!isNaN(minutes)) {
          setRestTimer(minutes * 60)
          setIsResting(true)
        } else {
          // Default 90 seconds
          setRestTimer(90)
          setIsResting(true)
        }
      } else {
        // Default rest
        setRestTimer(90)
        setIsResting(true)
      }
    }
  }

  const handleCompleteWorkout = async () => {
    const duration = Math.round((Date.now() - workoutStartTime) / 1000 / 60) // minutes

    const logData = {
      userId: user.id,
      planId,
      date: new Date().toISOString(),
      exercises: exercises.map(ex => ({
        exerciseId: ex.id,
        sets: ex.sets.map(s => ({
          weight: parseFloat(s.weight) || 0,
          reps: parseInt(s.reps) || 0,
          completed: s.completed
        }))
      })),
      duration,
      notes,
      rpe
    }

    try {
      await api.logWorkout(logData)
      alert('🎉 Workout logged successfully!')
      navigate('/dashboard')
    } catch (error) {
      alert('Error logging workout: ' + error.message)
    }
  }

  const skipRestTimer = () => {
    setIsResting(false)
    setRestTimer(0)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading-spinner">Loading workout...</div>
      </div>
    )
  }

  const currentExercise = exercises[currentExerciseIndex]
  const isLastExercise = currentExerciseIndex === exercises.length - 1

  return (
    <div className="workout-logger">
      {/* Rest Timer Overlay */}
      {isResting && (
        <div className="rest-timer-overlay">
          <div className="rest-timer-content">
            <h2>Rest Timer</h2>
            <div className="timer-display">{formatTime(restTimer)}</div>
            <button onClick={skipRestTimer} className="btn btn-outline">
              Skip Rest
            </button>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="workout-progress-bar">
        <div
          className="workout-progress-fill"
          style={{
            width: `${((currentExerciseIndex + 1) / exercises.length) * 100}%`
          }}
        />
      </div>

      {/* Header */}
      <div className="workout-logger-header">
        <div className="exercise-counter">
          Exercise {currentExerciseIndex + 1} of {exercises.length}
        </div>
        <h1 className="current-exercise-name">{currentExercise?.name}</h1>
        {currentExercise?.category === 'strength' && (
          <div className="target-volume">
            Target: {currentExercise.volume?.sets}x{currentExercise.volume?.reps}
          </div>
        )}
      </div>

      {/* Sets Logger - Mobile Optimized */}
      <div className="sets-container">
        {currentExercise?.category === 'strength' ? (
          <>
            {currentExercise.sets.map((set, setIndex) => (
              <div
                key={setIndex}
                className={`set-row ${set.completed ? 'set-completed' : ''}`}
              >
                <div className="set-number">Set {setIndex + 1}</div>
                <input
                  type="number"
                  placeholder="Weight"
                  className="set-input"
                  value={set.weight}
                  onChange={(e) => handleSetChange(currentExerciseIndex, setIndex, 'weight', e.target.value)}
                  inputMode="decimal"
                />
                <input
                  type="number"
                  placeholder="Reps"
                  className="set-input"
                  value={set.reps}
                  onChange={(e) => handleSetChange(currentExerciseIndex, setIndex, 'reps', e.target.value)}
                  inputMode="numeric"
                />
                <button
                  onClick={() => handleSetComplete(currentExerciseIndex, setIndex)}
                  className={`complete-btn ${set.completed ? 'completed' : ''}`}
                >
                  {set.completed ? '✓' : '○'}
                </button>
              </div>
            ))}
          </>
        ) : (
          <div className="cardio-logger">
            <p className="cardio-instruction">
              Complete: {currentExercise.volume?.duration} at {currentExercise.volume?.intensity} intensity
            </p>
            <div className="form-group">
              <label className="form-label">Time (minutes)</label>
              <input
                type="number"
                className="form-input"
                placeholder="Enter duration"
                inputMode="numeric"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Distance (optional)</label>
              <input
                type="number"
                className="form-input"
                placeholder="Enter distance"
                inputMode="decimal"
              />
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="workout-nav-buttons">
        {currentExerciseIndex > 0 && (
          <button
            onClick={() => setCurrentExerciseIndex(prev => prev - 1)}
            className="btn btn-outline"
          >
            ← Previous
          </button>
        )}
        {!isLastExercise ? (
          <button
            onClick={() => setCurrentExerciseIndex(prev => prev + 1)}
            className="btn btn-primary"
          >
            Next Exercise →
          </button>
        ) : (
          <button
            onClick={() => setCurrentExerciseIndex(prev => prev + 1)}
            className="btn btn-secondary"
          >
            Finish Exercises →
          </button>
        )}
      </div>

      {/* Completion Screen */}
      {currentExerciseIndex >= exercises.length && (
        <div className="completion-screen">
          <div className="card">
            <h2 className="completion-title">🎉 Great Work!</h2>
            <p className="text-muted mb-3">How did your workout feel?</p>

            <div className="form-group">
              <label className="form-label">
                RPE (Rate of Perceived Exertion): {rpe}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={rpe}
                onChange={(e) => setRpe(parseInt(e.target.value))}
                className="rpe-slider"
              />
              <div className="rpe-labels">
                <span>Easy</span>
                <span>Moderate</span>
                <span>Hard</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Notes (optional)</label>
              <textarea
                className="form-input"
                rows="3"
                placeholder="How did you feel? Any PRs?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <button
              onClick={handleCompleteWorkout}
              className="btn btn-primary btn-block btn-lg"
            >
              Complete Workout ✓
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkoutLogger
