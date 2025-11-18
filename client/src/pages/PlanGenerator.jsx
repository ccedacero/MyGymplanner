import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../services/api'
import { DndContext, closestCenter, PointerSensor, TouchSensor, MouseSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import './PlanGenerator.css'

// Sortable Day Card Component
function SortableDay({ day, index }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: day.day })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab'
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`day-card ${isDragging ? 'dragging' : ''}`}
    >
      <div className="day-header">
        <strong>{day.day}</strong>
        <span className={`badge ${day.type === 'rest' ? 'badge-secondary' : 'badge-primary'}`}>
          {day.type}
        </span>
      </div>
      {day.exercises.length > 0 && (
        <div className="exercises-list">
          {day.exercises.slice(0, 3).map((ex, i) => (
            <div key={i} className="exercise-preview">
              • {ex.name}
              {ex.volume && ex.volume.sets && (
                <span className="volume-info">
                  {' '}({ex.volume.sets}x{ex.volume.reps})
                </span>
              )}
            </div>
          ))}
          {day.exercises.length > 3 && (
            <div className="text-muted text-small">
              +{day.exercises.length - 3} more
            </div>
          )}
        </div>
      )}
      <div className="drag-indicator">⋮⋮</div>
    </div>
  )
}

function PlanGenerator({ user }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [generatedPlan, setGeneratedPlan] = useState(null)
  const [formData, setFormData] = useState({
    daysPerWeek: 4,
    sessionLength: 60,
    goal: 'general-fitness',
    strengthCardioRatio: 'balanced',
    experienceLevel: 'beginner'
  })

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  )

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'daysPerWeek' ? parseInt(value) : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const config = {
        userId: user.id,
        ...formData,
        equipment: user.equipment || []
      }

      const result = await api.generatePlan(config)
      setGeneratedPlan(result.plan)
    } catch (error) {
      alert('Error generating plan: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAndContinue = async () => {
    try {
      // Update the plan with the customized schedule
      await api.updatePlan(generatedPlan.id, {
        weekSchedule: generatedPlan.weekSchedule
      })
      navigate('/dashboard')
    } catch (error) {
      alert('Error saving customized schedule: ' + error.message)
    }
  }

  const handleGenerateAnother = () => {
    setGeneratedPlan(null)
  }

  const handleDragEnd = (event) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    setGeneratedPlan((prev) => {
      const oldIndex = prev.weekSchedule.findIndex((day) => day.day === active.id)
      const newIndex = prev.weekSchedule.findIndex((day) => day.day === over.id)

      const newSchedule = [...prev.weekSchedule]
      const [movedItem] = newSchedule.splice(oldIndex, 1)
      newSchedule.splice(newIndex, 0, movedItem)

      // Update day names to match new positions
      // This ensures "today's workout" works correctly after reordering
      const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      const updatedSchedule = newSchedule.map((workout, index) => ({
        ...workout,
        day: dayNames[index]
      }))

      return {
        ...prev,
        weekSchedule: updatedSchedule
      }
    })
  }

  if (generatedPlan) {
    return (
      <div className="container plan-preview">
        <div className="card">
          <h2 className="success-title">✅ Plan Generated!</h2>
          <div className="plan-summary">
            <div className="summary-item">
              <strong>Split Type:</strong> {generatedPlan.splitType}
            </div>
            <div className="summary-item">
              <strong>Duration:</strong> {generatedPlan.duration}
            </div>
            <div className="summary-item">
              <strong>Days per Week:</strong> {generatedPlan.config.daysPerWeek}
            </div>
          </div>

          <h3 className="mt-3">Weekly Schedule:</h3>
          <p className="text-muted text-small mb-2">💡 Drag and drop to reorder days</p>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={generatedPlan.weekSchedule.map(day => day.day)}
              strategy={verticalListSortingStrategy}
            >
              <div className="schedule-preview">
                {generatedPlan.weekSchedule.map((day, index) => (
                  <SortableDay key={day.day} day={day} index={index} />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <div className="button-group mt-3">
            <button
              onClick={handleSaveAndContinue}
              className="btn btn-primary btn-lg"
            >
              Save Plan & Go to Dashboard
            </button>
            <button
              onClick={handleGenerateAnother}
              className="btn btn-outline btn-lg"
            >
              Generate Another Plan
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container-sm">
      <div className="card">
        <h2 className="card-title">Generate Your Training Plan</h2>
        <p className="text-muted mb-3">
          Answer a few questions to create your personalized hybrid training plan
        </p>

        <form onSubmit={handleSubmit}>
          {/* Days Per Week */}
          <div className="form-group">
            <label className="form-label">
              How many days per week can you train?
            </label>
            <select
              name="daysPerWeek"
              value={formData.daysPerWeek}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value={2}>2 days</option>
              <option value={3}>3 days</option>
              <option value={4}>4 days (Recommended)</option>
              <option value={5}>5 days</option>
              <option value={6}>6 days</option>
              <option value={7}>7 days</option>
            </select>
          </div>

          {/* Session Length */}
          <div className="form-group">
            <label className="form-label">
              How long is each session?
            </label>
            <select
              name="sessionLength"
              value={formData.sessionLength}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes (Recommended)</option>
              <option value={90}>90 minutes</option>
            </select>
          </div>

          {/* Goal */}
          <div className="form-group">
            <label className="form-label">
              What's your primary goal?
            </label>
            <select
              name="goal"
              value={formData.goal}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="strength">Strength Gain</option>
              <option value="muscle-building">Muscle Building (Hypertrophy)</option>
              <option value="endurance">Endurance</option>
              <option value="weight-loss">Weight Loss</option>
              <option value="general-fitness">General Fitness</option>
            </select>
          </div>

          {/* Strength-Cardio Ratio */}
          <div className="form-group">
            <label className="form-label">
              Strength vs Cardio Balance
            </label>
            <select
              name="strengthCardioRatio"
              value={formData.strengthCardioRatio}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="heavy-strength">Heavy Strength (80/20)</option>
              <option value="balanced">Balanced (50/50)</option>
              <option value="heavy-cardio">Heavy Cardio (20/80)</option>
            </select>
          </div>

          {/* Experience Level */}
          <div className="form-group">
            <label className="form-label">
              What's your experience level?
            </label>
            <select
              name="experienceLevel"
              value={formData.experienceLevel}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="beginner">Beginner (0-6 months)</option>
              <option value="intermediate">Intermediate (6 months - 2 years)</option>
              <option value="advanced">Advanced (2+ years)</option>
            </select>
          </div>

          <div className="form-help mb-3">
            Using equipment: {user.equipment?.join(', ') || 'None selected'}
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={loading}
          >
            {loading ? 'Generating Plan...' : 'Generate My Plan 🚀'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default PlanGenerator
