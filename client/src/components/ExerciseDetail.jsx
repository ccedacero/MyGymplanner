import React, { useState } from 'react'
import './ExerciseDetail.css'

function ExerciseDetail({ exercise, onClose }) {
  const [videoError, setVideoError] = useState(false)

  if (!exercise) return null

  // Extract YouTube video ID from URL
  const getYouTubeId = (url) => {
    if (!url) return null
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
    return match ? match[1] : null
  }

  const videoId = getYouTubeId(exercise.videoUrl)

  return (
    <div className="exercise-detail-overlay" onClick={onClose}>
      <div className="exercise-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>

        <div className="exercise-detail-content">
          <div className="exercise-header">
            <h2>{exercise.name}</h2>
            <div className="exercise-badges">
              <span className={`badge difficulty-${exercise.difficulty}`}>
                {exercise.difficulty}
              </span>
              <span className="badge">{exercise.type}</span>
            </div>
          </div>

          {/* YouTube Video Embed */}
          {videoId && !videoError && (
            <div className="video-container">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                title={`${exercise.name} Tutorial`}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                onError={() => setVideoError(true)}
              ></iframe>
            </div>
          )}
          {videoError && (
            <div className="video-error">
              <p>Video unavailable. <a href={exercise.videoUrl} target="_blank" rel="noopener noreferrer">Watch on YouTube</a></p>
            </div>
          )}
          {!videoId && exercise.videoUrl && (
            <div className="video-error">
              <p>Invalid video URL. <a href={exercise.videoUrl} target="_blank" rel="noopener noreferrer">Try opening directly</a></p>
            </div>
          )}

          <div className="exercise-info">
            <div className="info-section">
              <h3>Description</h3>
              <p>{exercise.description}</p>
            </div>

            <div className="info-section">
              <h3>Muscle Groups</h3>
              <div className="muscle-tags">
                {exercise.muscleGroups.map((muscle, index) => (
                  <span key={index} className="muscle-tag">
                    {muscle.replace(/-/g, ' ')}
                  </span>
                ))}
              </div>
            </div>

            <div className="info-section">
              <h3>Equipment Needed</h3>
              <div className="equipment-tags">
                {exercise.equipment.map((item, index) => (
                  <span key={index} className="equipment-tag">
                    {item.replace(/-/g, ' ')}
                  </span>
                ))}
              </div>
            </div>

            {exercise.sets && exercise.reps && (
              <div className="info-section">
                <h3>Prescribed Volume</h3>
                <p className="volume-info">
                  {exercise.sets} sets × {exercise.reps} reps
                  {exercise.restTime && ` • ${exercise.restTime}s rest`}
                </p>
              </div>
            )}
          </div>

          <div className="exercise-actions">
            <button className="btn-secondary" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExerciseDetail
