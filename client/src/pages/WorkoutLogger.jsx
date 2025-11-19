import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import * as api from '../services/api'
import ExerciseSubstitution from '../components/ExerciseSubstitution'
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
  const [showVideoModal, setShowVideoModal] = useState(false)
  const [cardioDuration, setCardioDuration] = useState('')
  const [cardioDistance, setCardioDistance] = useState('')
  const [lastWorkoutData, setLastWorkoutData] = useState({})
  const [showSubstitutionModal, setShowSubstitutionModal] = useState(false)
  const [userEquipment, setUserEquipment] = useState([])
  const [substitutedExercises, setSubstitutedExercises] = useState({})

  // Extract YouTube video ID from URL
  const getYouTubeId = (url) => {
    if (!url) return null
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
    return match ? match[1] : null
  }

  useEffect(() => {
    loadWorkout()
  }, [planId, day]) // Add day to dependencies to reload when day changes

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

      // Load user's equipment
      if (user?.equipment) {
        setUserEquipment(user.equipment)
      }

      // Load last workout data for each exercise FIRST (before initializing sets)
      const lastWorkouts = {}
      for (const ex of todayData.workout.exercises) {
        if (ex.id && ex.category === 'strength') {
          try {
            const lastData = await api.getLastExerciseWorkout(user.id, ex.id)
            if (lastData) {
              lastWorkouts[ex.id] = lastData
            }
          } catch (error) {
            // Ignore errors - just means no previous workout
          }
        }
      }
      setLastWorkoutData(lastWorkouts)

      // Initialize exercise state with sets or cardio data
      // Prefill sets from last workout if available
      const exercisesWithSets = todayData.workout.exercises.map(ex => {
        if (ex.category === 'cardio') {
          return {
            ...ex,
            cardioDuration: '',
            cardioDistance: ''
          }
        } else {
          // Get last workout data for this exercise
          const lastWorkout = lastWorkouts[ex.id]
          const lastSets = lastWorkout?.exercise?.sets || []

          return {
            ...ex,
            sets: Array(ex.volume?.sets || 3).fill(null).map((_, index) => {
              // Prefill from last workout if available
              const lastSet = lastSets[index]
              return {
                weight: lastSet?.weight?.toString() || '',
                reps: lastSet?.reps?.toString() || '',
                completed: false
              }
            })
          }
        }
      })
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

  const handleCardioChange = (exerciseIndex, field, value) => {
    setExercises(prev => {
      const newExercises = [...prev]
      newExercises[exerciseIndex][field] = value
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
        // Parse rest time (e.g., "2 min" -> 120 seconds, "60 sec" -> 60 seconds)
        const value = parseInt(restTime)
        if (!isNaN(value)) {
          if (restTime.toLowerCase().includes('sec')) {
            // Already in seconds
            setRestTimer(value)
          } else if (restTime.toLowerCase().includes('min')) {
            // Convert minutes to seconds
            setRestTimer(value * 60)
          } else {
            // Default 90 seconds if format is unclear
            setRestTimer(90)
          }
          setIsResting(true)
        } else {
          // Default 90 seconds
          setRestTimer(90)
          setIsResting(true)
        }
      } else {
        // Default rest - 90 seconds
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
      exercises: exercises.map((ex, index) => {
        const substitution = substitutedExercises[index]
        const baseData = {
          exerciseId: ex.id,
          ...(substitution && {
            originalExerciseId: substitution.originalExerciseId,
            substituted: true
          })
        }

        if (ex.category === 'cardio') {
          return {
            ...baseData,
            cardioDuration: parseFloat(ex.cardioDuration) || 0,
            cardioDistance: parseFloat(ex.cardioDistance) || 0,
            completed: true
          }
        } else {
          return {
            ...baseData,
            sets: ex.sets.map(s => ({
              weight: parseFloat(s.weight) || 0,
              reps: parseInt(s.reps) || 0,
              completed: s.completed
            }))
          }
        }
      }),
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

  // Plate calculator - calculates plates needed per side
  const calculatePlates = (weight) => {
    const BAR_WEIGHT = 45 // Standard barbell weight
    const PLATES = [45, 35, 25, 10, 5, 2.5] // Available plate weights

    const totalWeight = parseFloat(weight)
    if (isNaN(totalWeight) || totalWeight <= BAR_WEIGHT) {
      return null
    }

    const weightPerSide = (totalWeight - BAR_WEIGHT) / 2
    let remaining = weightPerSide
    const platesNeeded = []

    for (const plate of PLATES) {
      const count = Math.floor(remaining / plate)
      if (count > 0) {
        platesNeeded.push({ weight: plate, count })
        remaining = Math.round((remaining - (plate * count)) * 100) / 100 // Round to avoid floating point issues
      }
    }

    if (remaining > 0.1) {
      // If there's still weight remaining, it's not possible with standard plates
      return { platesNeeded, remainder: remaining }
    }

    return { platesNeeded, remainder: 0 }
  }

  const formatPlateCalculation = (weight) => {
    const result = calculatePlates(weight)
    if (!result) return null

    const plateText = result.platesNeeded
      .map(p => `${p.count}×${p.weight}`)
      .join(' + ')

    return plateText || 'Just the bar'
  }

  // Compare current set with last workout
  const getLastSetComparison = (exerciseId, setIndex) => {
    const lastWorkout = lastWorkoutData[exerciseId]
    if (!lastWorkout || !lastWorkout.exercise?.sets) return null

    const lastSet = lastWorkout.exercise.sets[setIndex]
    if (!lastSet) return null

    return {
      weight: lastSet.weight,
      reps: lastSet.reps
    }
  }

  const getComparisonIndicator = (currentWeight, currentReps, lastWeight, lastReps) => {
    if (!currentWeight || !currentReps || !lastWeight || !lastReps) return null

    const currentVolume = parseFloat(currentWeight) * parseInt(currentReps)
    const lastVolume = parseFloat(lastWeight) * parseInt(lastReps)

    if (currentVolume > lastVolume) {
      return { icon: '↗️', text: `+${Math.round(currentVolume - lastVolume)} lbs`, color: '#10B981' }
    } else if (currentVolume < lastVolume) {
      return { icon: '↘️', text: `${Math.round(currentVolume - lastVolume)} lbs`, color: '#EF4444' }
    } else {
      return { icon: '→', text: 'Same', color: '#6B7280' }
    }
  }

  const addSet = (exerciseIndex, e) => {
    if (e) e.preventDefault()
    setExercises(prev => {
      const newExercises = [...prev]
      const currentSets = newExercises[exerciseIndex].sets

      // Get the last set's values to duplicate
      const lastSet = currentSets.length > 0 ? currentSets[currentSets.length - 1] : null

      newExercises[exerciseIndex].sets.push({
        weight: lastSet ? lastSet.weight : '',
        reps: lastSet ? lastSet.reps : '',
        completed: false
      })
      return newExercises
    })
  }

  const removeSet = (exerciseIndex, setIndex) => {
    setExercises(prev => {
      const newExercises = [...prev]
      if (newExercises[exerciseIndex].sets.length > 1) {
        newExercises[exerciseIndex].sets.splice(setIndex, 1)
      }
      return newExercises
    })
  }

  const handleSubstitute = (substitute) => {
    const currentEx = currentExercise
    const originalExerciseId = currentEx.id

    // Track the substitution
    setSubstitutedExercises(prev => ({
      ...prev,
      [currentExerciseIndex]: {
        originalExerciseId,
        originalExerciseName: currentEx.name,
        substituteExerciseId: substitute.id,
        substituteExerciseName: substitute.name
      }
    }))

    // Replace the exercise at current index with the substitute
    setExercises(prev => {
      const newExercises = [...prev]
      newExercises[currentExerciseIndex] = {
        ...substitute,
        volume: currentEx.volume, // Keep the original volume prescription
        sets: currentEx.category === 'strength'
          ? currentEx.sets // Keep existing sets if any were logged
          : Array(substitute.volume?.sets || currentEx.volume?.sets || 3).fill(null).map(() => ({
              weight: '',
              reps: '',
              completed: false
            })),
        cardioDuration: substitute.category === 'cardio' ? '' : undefined,
        cardioDistance: substitute.category === 'cardio' ? '' : undefined
      }
      return newExercises
    })
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
  const isCompletionScreen = currentExerciseIndex >= exercises.length

  // Show completion screen
  if (isCompletionScreen) {
    return (
      <div className="workout-logger">
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
      </div>
    )
  }

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

      {/* Video Modal */}
      {showVideoModal && currentExercise?.videoUrl && (
        <div className="modal-overlay" onClick={() => setShowVideoModal(false)}>
          <div className="modal-content video-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowVideoModal(false)}>×</button>
            <h3>{currentExercise.name}</h3>
            <div className="video-wrapper">
              {getYouTubeId(currentExercise.videoUrl) && (
                <iframe
                  width="100%"
                  height="315"
                  src={`https://www.youtube.com/embed/${getYouTubeId(currentExercise.videoUrl)}`}
                  title={`${currentExercise.name} Tutorial`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              )}
            </div>
            {currentExercise.description && (
              <p className="text-muted mt-2">{currentExercise.description}</p>
            )}
          </div>
        </div>
      )}

      {/* Exercise Substitution Modal */}
      {showSubstitutionModal && currentExercise && (
        <ExerciseSubstitution
          exercise={currentExercise}
          userId={user.id}
          userEquipment={userEquipment}
          onSubstitute={handleSubstitute}
          onClose={() => setShowSubstitutionModal(false)}
        />
      )}

      {/* Header */}
      <div className="workout-logger-header">
        <div className="exercise-counter">
          Exercise {currentExerciseIndex + 1} of {exercises.length}
        </div>
        <div className="exercise-title-row">
          <h1 className="current-exercise-name">
            {currentExercise?.name}
            {substitutedExercises[currentExerciseIndex] && (
              <span className="substitution-badge" title={`Substituted from ${substitutedExercises[currentExerciseIndex].originalExerciseName}`}>
                ⇄
              </span>
            )}
          </h1>
          {currentExercise?.videoUrl && (
            <button
              onClick={() => setShowVideoModal(true)}
              className="btn-icon video-btn"
              title="Watch form video"
            >
              📹
            </button>
          )}
        </div>
        {substitutedExercises[currentExerciseIndex] && (
          <div className="substitution-info">
            Substituted from: {substitutedExercises[currentExerciseIndex].originalExerciseName}
          </div>
        )}
        {currentExercise?.category === 'strength' && (
          <div className="target-volume">
            Target: {currentExercise.volume?.sets}x{currentExercise.volume?.reps}
            {currentExercise.volume?.rest && <span> • Rest: {currentExercise.volume?.rest}</span>}
          </div>
        )}
        <button
          onClick={() => setShowSubstitutionModal(true)}
          className="btn-substitute"
        >
          ⇄ Find Substitute
        </button>
      </div>

      {/* Sets Logger - Mobile Optimized */}
      <div className="sets-container">
        {currentExercise?.category === 'strength' ? (
          <>
            {currentExercise.sets.map((set, setIndex) => (
              <div key={setIndex}>
                <div
                  className={`set-row ${set.completed ? 'set-completed' : ''}`}
                >
                  <div className="set-number">Set {setIndex + 1}</div>
                  <input
                    type="number"
                    placeholder="lbs"
                    className="set-input"
                    value={set.weight}
                    onChange={(e) => handleSetChange(currentExerciseIndex, setIndex, 'weight', e.target.value)}
                    onFocus={(e) => e.target.select()}
                    inputMode="decimal"
                  />
                  <input
                    type="number"
                    placeholder="reps"
                    className="set-input"
                    value={set.reps}
                    onChange={(e) => handleSetChange(currentExerciseIndex, setIndex, 'reps', e.target.value)}
                    onFocus={(e) => e.target.select()}
                    inputMode="numeric"
                  />
                  <button
                    onClick={() => handleSetComplete(currentExerciseIndex, setIndex)}
                    className={`complete-btn ${set.completed ? 'completed' : ''}`}
                  >
                    {set.completed ? '✓' : '○'}
                  </button>
                  {currentExercise.sets.length > 1 && (
                    <button
                      onClick={() => removeSet(currentExerciseIndex, setIndex)}
                      className="btn-icon remove-set-btn"
                      title="Remove set"
                    >
                      ×
                    </button>
                  )}
                </div>
                {set.weight && formatPlateCalculation(set.weight) && (
                  <div className="plate-calculator">
                    <span className="plate-icon">🏋️</span>
                    {formatPlateCalculation(set.weight)} per side
                  </div>
                )}
                {(() => {
                  const lastSet = getLastSetComparison(currentExercise.id, setIndex)
                  if (lastSet) {
                    const comparison = getComparisonIndicator(set.weight, set.reps, lastSet.weight, lastSet.reps)
                    return (
                      <div className="last-workout-comparison">
                        <span className="comparison-label">Last time:</span>
                        <span className="comparison-value">{lastSet.weight} lbs × {lastSet.reps} reps</span>
                        {comparison && (
                          <span className="comparison-indicator" style={{ color: comparison.color }}>
                            {comparison.icon} {comparison.text}
                          </span>
                        )}
                      </div>
                    )
                  }
                  return null
                })()}
              </div>
            ))}
            <button
              onClick={(e) => addSet(currentExerciseIndex, e)}
              className="btn btn-outline btn-block add-set-btn"
              type="button"
            >
              + Add Set
            </button>
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
                value={currentExercise.cardioDuration || ''}
                onChange={(e) => handleCardioChange(currentExerciseIndex, 'cardioDuration', e.target.value)}
                onFocus={(e) => e.target.select()}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Distance (optional)</label>
              <input
                type="number"
                className="form-input"
                placeholder="Enter distance (miles)"
                inputMode="decimal"
                value={currentExercise.cardioDistance || ''}
                onChange={(e) => handleCardioChange(currentExerciseIndex, 'cardioDistance', e.target.value)}
                onFocus={(e) => e.target.select()}
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
    </div>
  )
}

export default WorkoutLogger
