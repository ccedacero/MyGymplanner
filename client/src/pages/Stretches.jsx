import { useState, useEffect } from 'react'
import * as api from '../services/api'
import ExerciseDetail from '../components/ExerciseDetail'
import './Stretches.css'

function Stretches({ user }) {
  const [stretches, setStretches] = useState([])
  const [filteredStretches, setFilteredStretches] = useState([])
  const [selectedStretch, setSelectedStretch] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    targetArea: '',
    difficulty: '',
    type: ''
  })

  useEffect(() => {
    loadStretches()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [filters, stretches])

  const loadStretches = async () => {
    try {
      setLoading(true)
      const data = await api.getStretches()
      setStretches(data.stretches)
      setFilteredStretches(data.stretches)
    } catch (error) {
      console.error('Error loading stretches:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let result = [...stretches]

    if (filters.targetArea) {
      result = result.filter(stretch =>
        stretch.targetAreas.some(area =>
          area.toLowerCase().includes(filters.targetArea.toLowerCase())
        )
      )
    }

    if (filters.difficulty) {
      result = result.filter(stretch => stretch.difficulty === filters.difficulty)
    }

    if (filters.type) {
      result = result.filter(stretch => stretch.type === filters.type)
    }

    setFilteredStretches(result)
  }

  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }))
  }

  const clearFilters = () => {
    setFilters({
      targetArea: '',
      difficulty: '',
      type: ''
    })
  }

  // Get unique target areas from all stretches
  const getUniqueTargetAreas = () => {
    const allAreas = stretches.flatMap(s => s.targetAreas)
    return [...new Set(allAreas)].sort()
  }

  if (loading) {
    return (
      <div className="stretches-page">
        <div className="loading">Loading stretches...</div>
      </div>
    )
  }

  return (
    <div className="stretches-page">
      <div className="page-header">
        <h1>Stretches</h1>
        <p className="subtitle">Browse stretching exercises with video tutorials</p>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label htmlFor="targetArea">Target Area</label>
          <select
            id="targetArea"
            value={filters.targetArea}
            onChange={(e) => handleFilterChange('targetArea', e.target.value)}
          >
            <option value="">All Areas</option>
            {getUniqueTargetAreas().map(area => (
              <option key={area} value={area}>
                {area.charAt(0).toUpperCase() + area.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="difficulty">Difficulty</label>
          <select
            id="difficulty"
            value={filters.difficulty}
            onChange={(e) => handleFilterChange('difficulty', e.target.value)}
          >
            <option value="">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="type">Type</label>
          <select
            id="type"
            value={filters.type}
            onChange={(e) => handleFilterChange('type', e.target.value)}
          >
            <option value="">All Types</option>
            <option value="static">Static</option>
            <option value="dynamic">Dynamic</option>
          </select>
        </div>

        {(filters.targetArea || filters.difficulty || filters.type) && (
          <button className="btn-clear-filters" onClick={clearFilters}>
            Clear Filters
          </button>
        )}
      </div>

      {/* Results count */}
      <div className="results-info">
        <p>Showing {filteredStretches.length} of {stretches.length} stretches</p>
      </div>

      {/* Stretches Grid */}
      <div className="stretches-grid">
        {filteredStretches.length === 0 ? (
          <div className="no-results">
            <p>No stretches found with the selected filters.</p>
            <button className="btn-secondary" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        ) : (
          filteredStretches.map(stretch => (
            <div
              key={stretch.id}
              className="stretch-card"
              onClick={() => setSelectedStretch(stretch)}
            >
              <div className="stretch-card-header">
                <h3>{stretch.name}</h3>
                <div className="stretch-badges">
                  <span className={`badge difficulty-${stretch.difficulty}`}>
                    {stretch.difficulty}
                  </span>
                  <span className={`badge type-${stretch.type}`}>
                    {stretch.type}
                  </span>
                </div>
              </div>

              <div className="stretch-card-body">
                <div className="target-areas">
                  {stretch.targetAreas.map((area, index) => (
                    <span key={index} className="target-tag">
                      {area}
                    </span>
                  ))}
                </div>

                <p className="stretch-description">{stretch.description}</p>

                <div className="stretch-duration">
                  <strong>Duration:</strong> {stretch.duration}
                </div>
              </div>

              <div className="stretch-card-footer">
                <button className="btn-view-video">
                  View Video Tutorial
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Exercise Detail Modal (reused for stretches) */}
      {selectedStretch && (
        <ExerciseDetail
          exercise={{
            ...selectedStretch,
            muscleGroups: selectedStretch.targetAreas, // Map targetAreas to muscleGroups for compatibility
            equipment: selectedStretch.equipment || []
          }}
          onClose={() => setSelectedStretch(null)}
        />
      )}
    </div>
  )
}

export default Stretches
