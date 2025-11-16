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
      const data = await api.updateEquipment(user.id, selectedEquipment)
      setUser(data.user)
      localStorage.setItem('user', JSON.stringify(data.user))
      navigate('/dashboard')
    } catch (err) {
      alert('Failed to save equipment: ' + err.message)
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
