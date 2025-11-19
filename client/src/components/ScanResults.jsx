import { useState } from 'react';
import ExerciseDetail from './ExerciseDetail';

function ScanResults({ data, onScanAnother, onAddExercise }) {
  const [selectedExercise, setSelectedExercise] = useState(null);

  const {
    equipmentType,
    confidence,
    brand,
    exercises,
    formTips,
    commonMistakes
  } = data;

  const handleViewFormGuide = (exercise) => {
    setSelectedExercise(exercise);
  };

  const handleCloseDetail = () => {
    setSelectedExercise(null);
  };

  const handleAddExercise = (exercise) => {
    if (onAddExercise) {
      onAddExercise(exercise);
    }
  };

  return (
    <div className="scan-results">
      {/* Equipment Identified */}
      <div className="equipment-identified">
        <div className="equipment-header">
          <h2 className="equipment-name">
            <span className="check-icon">✅</span>
            {equipmentType}
          </h2>
          {brand && <p className="equipment-brand">{brand}</p>}
        </div>
        <div className="confidence-badge">
          <span className="confidence-label">Confidence:</span>
          <span className={`confidence-value ${confidence >= 80 ? 'high' : confidence >= 60 ? 'medium' : 'low'}`}>
            {confidence}%
          </span>
        </div>
      </div>

      {/* Suggested Exercises */}
      <section className="exercises-section">
        <h3 className="section-title">
          Suggested Exercises ({exercises.length})
        </h3>
        <div className="exercises-grid">
          {exercises.map((exercise, index) => (
            <div key={exercise.id || index} className="exercise-card">
              <div className="exercise-card-header">
                <h4 className="exercise-name">{exercise.name}</h4>
                {exercise.source === 'ai-generated' && (
                  <span className="badge badge-ai">AI Generated</span>
                )}
                {exercise.aiEnhanced?.matchType === 'exact' && (
                  <span className="badge badge-match">Exact Match</span>
                )}
              </div>

              <div className="exercise-meta">
                <div className="meta-item">
                  <span className="meta-icon">💪</span>
                  <span className="meta-text">
                    {exercise.muscleGroups?.join(', ') || 'N/A'}
                  </span>
                </div>
                <div className="meta-item">
                  <span className="meta-icon">⚙️</span>
                  <span className="meta-text">{exercise.difficulty || 'N/A'}</span>
                </div>
                {exercise.type && (
                  <div className="meta-item">
                    <span className="meta-icon">🎯</span>
                    <span className="meta-text">{exercise.type}</span>
                  </div>
                )}
              </div>

              {exercise.aiEnhanced?.recommendedVolume && (
                <div className="recommended-volume">
                  <strong>Recommended:</strong>
                  <span className="volume-details">
                    {exercise.aiEnhanced.recommendedVolume.sets} sets × {' '}
                    {exercise.aiEnhanced.recommendedVolume.reps} reps
                    {exercise.aiEnhanced.recommendedVolume.rest &&
                      ` • ${exercise.aiEnhanced.recommendedVolume.rest} rest`
                    }
                  </span>
                </div>
              )}

              <div className="exercise-actions">
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleViewFormGuide(exercise)}
                >
                  📹 View Form Guide
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleAddExercise(exercise)}
                >
                  ➕ Add
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* AI Form Tips */}
      {formTips && formTips.length > 0 && (
        <section className="tips-section">
          <h3 className="section-title">💡 Form Tips</h3>
          <ul className="tips-list">
            {formTips.map((tip, index) => (
              <li key={index} className="tip-item">{tip}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Common Mistakes */}
      {commonMistakes && commonMistakes.length > 0 && (
        <section className="mistakes-section">
          <h3 className="section-title">⚠️ Common Mistakes</h3>
          <ul className="mistakes-list">
            {commonMistakes.map((mistake, index) => (
              <li key={index} className="mistake-item">{mistake}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Actions */}
      <div className="scan-results-actions">
        <button className="btn btn-secondary" onClick={onScanAnother}>
          🔄 Scan Another Equipment
        </button>
      </div>

      {/* Exercise Detail Modal */}
      {selectedExercise && (
        <ExerciseDetail
          exercise={selectedExercise}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  );
}

export default ScanResults;
