import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../services/api'
import SessionManagement from '../components/SessionManagement'
import './Settings.css'

const EQUIPMENT_OPTIONS = [
  'barbell', 'dumbbells', 'kettlebells', 'bodyweight', 'bench', 'rack',
  'pull-up-bar', 'dip-bars', 'cable-machine', 'machine', 'box',
  'jump-rope', 'bike', 'rowing-machine'
]

function Settings({ user, setUser }) {
  const [selectedEquipment, setSelectedEquipment] = useState(user.equipment || [])
  const [exercisePreference, setExercisePreference] = useState(user.exercisePreference || 'both')
  const [loading, setLoading] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Update state if user prop changes
    setSelectedEquipment(user.equipment || [])
    setExercisePreference(user.exercisePreference || 'both')
  }, [user])

  const toggleEquipment = (eq) => {
    if (selectedEquipment.includes(eq)) {
      setSelectedEquipment(selectedEquipment.filter(e => e !== eq))
    } else {
      setSelectedEquipment([...selectedEquipment, eq])
    }
  }

  const toggleSelectAll = () => {
    if (selectedEquipment.length === EQUIPMENT_OPTIONS.length) {
      setSelectedEquipment([])
    } else {
      setSelectedEquipment([...EQUIPMENT_OPTIONS])
    }
  }

  const handleSave = async () => {
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

      // Merge both updates to ensure we have all the latest data
      const updatedUser = {
        ...user,
        equipment: equipmentData.user.equipment,
        exercisePreference: preferenceData.user.exercisePreference
      }

      setUser(updatedUser)
      localStorage.setItem('user', JSON.stringify(updatedUser))

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      console.error('Error saving settings:', err)
      // If unauthorized, suggest logging out and back in
      if (err.status === 401) {
        alert('Your session has expired. Please log out and log back in to continue.')
      } else {
        alert('Failed to save settings: ' + err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container settings-page">
      <div className="page-header">
        <h1>Settings</h1>
        <p className="text-muted">Customize your workout preferences</p>
      </div>

      <div className="card">
        <h2 className="section-title">Available Equipment</h2>
        <p className="text-muted mb-3">
          Select all equipment you have access to. We'll only show you exercises you can actually do.
        </p>

        <button
          onClick={toggleSelectAll}
          className="btn btn-secondary mb-2"
          type="button"
        >
          {selectedEquipment.length === EQUIPMENT_OPTIONS.length ? 'Deselect All' : 'Select All'}
        </button>

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

        <p className="text-small text-muted mt-2">
          Selected: {selectedEquipment.length} equipment types
        </p>
      </div>

      <div className="card mt-4">
        <h2 className="section-title">Exercise Database Preference</h2>
        <p className="text-muted mb-3">
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
              <p className="text-small text-muted">Standard exercise library (~100 exercises)</p>
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
              <p className="text-small text-muted">Maximum variety with both default and your known exercises (~164 exercises)</p>
            </div>
          </label>
        </div>
      </div>

      <div className="card mt-4">
        <SessionManagement userId={user.id} />
      </div>

      <div className="settings-actions">
        <button
          onClick={() => navigate('/dashboard')}
          className="btn btn-outline"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="btn btn-primary btn-lg"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {saveSuccess && (
        <div className="save-success-notice">
          ✅ Settings saved successfully!
        </div>
      )}
    </div>
  )
}

export default Settings
