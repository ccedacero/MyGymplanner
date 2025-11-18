import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../services/api'
import { DndContext, closestCenter, PointerSensor, TouchSensor, MouseSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import './WeeklySchedule.css'

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
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`schedule-day-card ${isDragging ? 'dragging' : ''}`}
    >
      <div className="day-header">
        <strong>{day.day}</strong>
        <span className={`badge ${day.type === 'rest' ? 'badge-secondary' : 'badge-primary'}`}>
          {day.type}
        </span>
        <div className="drag-handle">⋮⋮</div>
      </div>
      {day.exercises && day.exercises.length > 0 && (
        <div className="exercises-list">
          {day.exercises.slice(0, 4).map((ex, i) => (
            <div key={i} className="exercise-item">
              • {ex.name}
              {ex.volume && ex.volume.sets && (
                <span className="volume-badge">
                  {ex.volume.sets}x{ex.volume.reps}
                </span>
              )}
            </div>
          ))}
          {day.exercises.length > 4 && (
            <div className="text-muted text-small">
              +{day.exercises.length - 4} more exercises
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function WeeklySchedule({ user }) {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [plan, setPlan] = useState(null)
  const [weekSchedule, setWeekSchedule] = useState([])
  const [saving, setSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

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

  useEffect(() => {
    loadPlan()
  }, [user])

  const loadPlan = async () => {
    try {
      setLoading(true)
      const plansData = await api.getUserPlans(user.id)

      if (plansData.plans.length === 0) {
        navigate('/plan-generator')
        return
      }

      const activePlan = plansData.plans[0]
      setPlan(activePlan)
      setWeekSchedule([...activePlan.weekSchedule])
    } catch (error) {
      alert('Error loading plan: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    let updatedSchedule

    setWeekSchedule(prev => {
      const oldIndex = prev.findIndex((day) => day.day === active.id)
      const newIndex = prev.findIndex((day) => day.day === over.id)

      const newSchedule = [...prev]
      const [movedItem] = newSchedule.splice(oldIndex, 1)
      newSchedule.splice(newIndex, 0, movedItem)

      // Update day names to match new positions
      const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      updatedSchedule = newSchedule.map((workout, index) => ({
        ...workout,
        day: dayNames[index]
      }))

      return updatedSchedule
    })

    // Auto-save changes immediately after drag-and-drop
    try {
      setSaving(true)
      await api.updatePlan(plan.id, {
        weekSchedule: updatedSchedule
      })
      setSaveSuccess(true)
      // Hide success message after 2 seconds
      setTimeout(() => setSaveSuccess(false), 2000)
    } catch (error) {
      alert('Error saving schedule: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading-spinner">Loading your schedule...</div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="container">
        <div className="card">
          <h2>No Active Plan</h2>
          <p>You don't have an active workout plan yet.</p>
          <button onClick={() => navigate('/plan-generator')} className="btn btn-primary">
            Generate Plan
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container weekly-schedule-page">
      <div className="page-header">
        <h1>Weekly Schedule</h1>
        <p className="text-muted">Drag and drop to reorder your workout days - changes save automatically</p>
      </div>

      <div className="plan-info-card">
        <div className="info-row">
          <span className="info-label">Plan Type:</span>
          <span className="info-value">{plan.splitType}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Duration:</span>
          <span className="info-value">{plan.duration}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Days/Week:</span>
          <span className="info-value">{plan.config.daysPerWeek}</span>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={weekSchedule.map(day => day.day)}
          strategy={verticalListSortingStrategy}
        >
          <div className="schedule-grid">
            {weekSchedule.map((day, index) => (
              <SortableDay key={day.day} day={day} index={index} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Status indicator */}
      {saving && (
        <div className="status-notice saving">
          💾 Saving changes...
        </div>
      )}
      {saveSuccess && (
        <div className="status-notice success">
          ✅ Changes saved successfully!
          <button
            onClick={() => navigate('/today', { replace: true, state: { refresh: Date.now() } })}
            className="btn btn-sm btn-primary"
            style={{ marginLeft: '1rem' }}
          >
            View Today's Workout →
          </button>
        </div>
      )}
    </div>
  )
}

export default WeeklySchedule
