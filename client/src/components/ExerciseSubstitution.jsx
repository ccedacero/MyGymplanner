import React, { useState, useEffect } from 'react'
import { getExerciseSubstitutes } from '../services/api'
import './ExerciseSubstitution.css'

function ExerciseSubstitution({ exercise, userId, userEquipment, onSubstitute, onClose }) {
  const [substitutes, setSubstitutes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!exercise || !userId) return

    const fetchSubstitutes = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getExerciseSubstitutes(exercise.id, userId, userEquipment)
        setSubstitutes(data.substitutes)
      } catch (err) {
        console.error('Error fetching substitutes:', err)
        setError(err.message || 'Failed to load substitutes')
      } finally {
        setLoading(false)
      }
    }

    fetchSubstitutes()
  }, [exercise, userId, userEquipment])

  if (!exercise) return null

  const filteredSubstitutes = substitutes.filter(sub =>
    sub.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelect = (substitute) => {
    onSubstitute(substitute)
    onClose()
  }

  return (
    <div className="exercise-substitution-overlay" onClick={onClose}>
      <div className="exercise-substitution-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>

        <div className="substitution-header">
          <h2>Find a Substitute for</h2>
          <div className="original-exercise">
            <h3>{exercise.name}</h3>
            <div className="exercise-badges">
              <span className={`badge difficulty-${exercise.difficulty}`}>
                {exercise.difficulty}
              </span>
              <span className="badge">{exercise.type}</span>
              <span className="badge">{exercise.category}</span>
            </div>
            <div className="muscle-tags">
              {exercise.muscleGroups?.map((muscle, index) => (
                <span key={index} className="muscle-tag">
                  {muscle.replace(/-/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="search-container">
          <input
            type="text"
            placeholder="Search alternatives..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="substitutes-content">
          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Finding great alternatives...</p>
            </div>
          )}

          {error && (
            <div className="error-state">
              <p>{error}</p>
              <button onClick={onClose} className="btn-secondary">Close</button>
            </div>
          )}

          {!loading && !error && filteredSubstitutes.length === 0 && (
            <div className="empty-state">
              <p>No substitutes found. Try adjusting your equipment settings or search term.</p>
            </div>
          )}

          {!loading && !error && filteredSubstitutes.length > 0 && (
            <div className="substitutes-list">
              {filteredSubstitutes.map((substitute) => (
                <div
                  key={substitute.id}
                  className="substitute-card"
                  onClick={() => handleSelect(substitute)}
                >
                  <div className="substitute-header">
                    <h4>{substitute.name}</h4>
                    <div className="match-score">
                      <span className="score-badge">{substitute.score ? Math.round(substitute.score / 2) : 0}%</span>
                    </div>
                  </div>

                  <div className="substitute-info">
                    <div className="exercise-badges">
                      <span className={`badge difficulty-${substitute.difficulty}`}>
                        {substitute.difficulty}
                      </span>
                      <span className="badge">{substitute.type}</span>
                    </div>
                  </div>

                  <div className="match-reasons">
                    {substitute.matchReasons.muscleGroupsMatched > 0 && (
                      <span className="match-tag match-success">
                        ✓ {substitute.matchReasons.muscleGroupsMatched} muscle{substitute.matchReasons.muscleGroupsMatched > 1 ? 's' : ''} matched
                      </span>
                    )}
                    {substitute.matchReasons.sameType && (
                      <span className="match-tag match-success">
                        ✓ Same type
                      </span>
                    )}
                    {substitute.matchReasons.sameDifficulty && (
                      <span className="match-tag match-success">
                        ✓ Same difficulty
                      </span>
                    )}
                    {substitute.matchReasons.equipmentAvailable && (
                      <span className="match-tag match-success">
                        ✓ Equipment available
                      </span>
                    )}
                    {!substitute.matchReasons.equipmentAvailable && (
                      <span className="match-tag match-warning">
                        ⚠ Equipment may not be available
                      </span>
                    )}
                  </div>

                  <div className="substitute-muscles">
                    {substitute.muscleGroups?.map((muscle, index) => (
                      <span
                        key={index}
                        className={`muscle-tag ${exercise.muscleGroups?.includes(muscle) ? 'muscle-tag-match' : ''}`}
                      >
                        {muscle.replace(/-/g, ' ')}
                      </span>
                    ))}
                  </div>

                  <div className="substitute-equipment">
                    {substitute.equipment?.map((item, index) => (
                      <span key={index} className="equipment-tag-small">
                        {item.replace(/-/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="substitution-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default ExerciseSubstitution
