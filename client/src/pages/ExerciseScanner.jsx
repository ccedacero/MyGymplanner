import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CameraCapture from '../components/CameraCapture';
import ScanResults from '../components/ScanResults';
import { identifyEquipment } from '../services/scannerService';
import './ExerciseScanner.css';

function ExerciseScanner() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('camera'); // camera | analyzing | results
  const [scanResults, setScanResults] = useState(null);
  const [error, setError] = useState(null);

  const handleCapture = async (imageFile) => {
    setMode('analyzing');
    setError(null);

    try {
      console.log('Identifying equipment...', imageFile);
      const results = await identifyEquipment(imageFile);
      console.log('Scan results:', results);

      setScanResults(results);
      setMode('results');
    } catch (err) {
      console.error('Scan error:', err);
      setError(err.message || 'Failed to identify equipment. Please try again.');
      setMode('camera');
    }
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  const handleScanAnother = () => {
    setScanResults(null);
    setError(null);
    setMode('camera');
  };

  const handleAddExercise = (exercise) => {
    // For now, just show a success message
    // In future, this could add to current plan or save to custom exercises
    alert(`Added "${exercise.name}" to your workout library!`);

    // TODO: Implement actual "add to plan" functionality
    // Could navigate to plan editor or save to custom exercises
  };

  return (
    <div className="page exercise-scanner-page">
      <div className="page-header">
        <h1>
          <span className="page-icon">📸</span>
          Exercise Scanner
        </h1>
        <p className="page-description">
          Scan gym equipment to discover exercises, get form tips, and add to your workout
        </p>
      </div>

      <div className="scanner-container">
        {/* Error Message */}
        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">⚠️</span>
            <span>{error}</span>
            <button
              className="alert-close"
              onClick={() => setError(null)}
            >
              ×
            </button>
          </div>
        )}

        {/* Camera Mode */}
        {mode === 'camera' && (
          <CameraCapture
            onCapture={handleCapture}
            onCancel={handleCancel}
          />
        )}

        {/* Analyzing Mode */}
        {mode === 'analyzing' && (
          <div className="analyzing-view">
            <div className="spinner-container">
              <div className="spinner"></div>
            </div>
            <h2>Analyzing Equipment...</h2>
            <p className="analyzing-text">
              AI is identifying the equipment and finding exercises
            </p>
            <div className="analyzing-steps">
              <div className="step">🔍 Identifying equipment type</div>
              <div className="step">💪 Matching exercises from database</div>
              <div className="step">📹 Finding form tutorial videos</div>
              <div className="step">💡 Generating personalized tips</div>
            </div>
          </div>
        )}

        {/* Results Mode */}
        {mode === 'results' && scanResults && (
          <ScanResults
            data={scanResults}
            onScanAnother={handleScanAnother}
            onAddExercise={handleAddExercise}
          />
        )}
      </div>
    </div>
  );
}

export default ExerciseScanner;
