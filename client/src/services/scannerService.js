const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Identify equipment from an image
 * @param {File|Blob} imageFile - The image file to analyze
 * @returns {Promise} - Scan results with exercises and tips
 */
export async function identifyEquipment(imageFile) {
  const formData = new FormData();
  formData.append('image', imageFile);

  const token = localStorage.getItem('token');

  const response = await fetch(`${API_URL}/api/scanner/identify`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to identify equipment');
  }

  return response.json();
}

/**
 * Find YouTube video for a specific exercise
 * @param {string} exerciseName - Name of the exercise
 * @returns {Promise} - Video URL and metadata
 */
export async function findExerciseVideo(exerciseName) {
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_URL}/api/scanner/find-video`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ exerciseName })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to find video');
  }

  return response.json();
}

/**
 * Check scanner service health
 * @returns {Promise} - Health status
 */
export async function checkScannerHealth() {
  const response = await fetch(`${API_URL}/api/scanner/health`);

  if (!response.ok) {
    throw new Error('Scanner service unavailable');
  }

  return response.json();
}
