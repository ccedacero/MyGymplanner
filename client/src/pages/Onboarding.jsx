import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../services/api'

const EQUIPMENT_OPTIONS = [
  'barbell', 'dumbbells', 'kettlebells', 'bodyweight', 'bench', 'rack',
  'pull-up-bar', 'dip-bars', 'cable-machine', 'machine', 'box',
  'jump-rope', 'bike', 'rowing-machine'
]

function Onboarding({ user, setUser }) {
  const [selectedEquipment, setSelectedEquipment] = useState(user.equipment || [])
  const [exercisePreference, setExercisePreference] = useState(user.exercisePreference || 'both')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const toggleEquipment = (eq) => {
    if (selectedEquipment.includes(eq)) {
      setSelectedEquipment(selectedEquipment.filter(e => e !== eq))
    } else {
      setSelectedEquipment([...selectedEquipment, eq])
    }
  }

  const handleSubmit = async () => {
    if (selectedEquipment.length === 0) {
      alert('Please select at least one piece of equipment')
      return
    }

    setLoading(true)
    try {
      // Update equipment
      const equipmentData = await api.updateEquipment(user.id, selectedEquipment)

      // Update exercise preference
      const preferenceData = await api.updateExercisePreference(user.id, exercisePreference)

      setUser(preferenceData.user)
      localStorage.setItem('user', JSON.stringify(preferenceData.user))
      navigate('/dashboard')
    } catch (err) {
      alert('Failed to save settings: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <div className="card fade-in">
        <h2 className="card-title">What equipment do you have access to?</h2>
        <p className="text-muted mb-3">
          Select all that apply. We'll only show you exercises you can actually do.
        </p>

        <div className="checkbox-group">
          {EQUIPMENT_OPTIONS.map(eq => (
            <label
              key={eq}
              className={`checkbox-item ${selectedEquipment.includes(eq) ? 'checked' : ''}`}
            >
              <input
                type="checkbox"
                checked={selectedEquipment.includes(eq)}
                onChange={() => toggleEquipment(eq)}
              />
              {eq.replace(/-/g, ' ')}
            </label>
          ))}
        </div>

        <div className="mt-4 mb-3">
          <h3 className="card-title" style={{ fontSize: '1.2rem' }}>Exercise Database Preference</h3>
          <p className="text-muted mb-2" style={{ fontSize: '0.9rem' }}>
            Choose which exercises to include in your workouts
          </p>

          <div className="radio-group">
            <label className={`radio-item ${exercisePreference === 'default' ? 'checked' : ''}`}>
              <input
                type="radio"
                name="exercisePreference"
                value="default"
                checked={exercisePreference === 'default'}
                onChange={(e) => setExercisePreference(e.target.value)}
              />
              <div>
                <strong>Default Exercises Only</strong>
                <p className="text-small text-muted">Standard exercise library</p>
              </div>
            </label>

            <label className={`radio-item ${exercisePreference === 'known' ? 'checked' : ''}`}>
              <input
                type="radio"
                name="exercisePreference"
                value="known"
                checked={exercisePreference === 'known'}
                onChange={(e) => setExercisePreference(e.target.value)}
              />
              <div>
                <strong>My Known Exercises Only</strong>
                <p className="text-small text-muted">64 exercises you're familiar with from your training history</p>
              </div>
            </label>

            <label className={`radio-item ${exercisePreference === 'both' ? 'checked' : ''}`}>
              <input
                type="radio"
                name="exercisePreference"
                value="both"
                checked={exercisePreference === 'both'}
                onChange={(e) => setExercisePreference(e.target.value)}
              />
              <div>
                <strong>Both (Recommended)</strong>
                <p className="text-small text-muted">Maximum variety with both default and your known exercises</p>
              </div>
            </label>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-small text-muted">
            Selected: {selectedEquipment.length} equipment types
          </p>
          <button
            onClick={handleSubmit}
            className="btn btn-primary btn-lg"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Continue to Dashboard'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Onboarding
