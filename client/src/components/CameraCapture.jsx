import { useState, useRef, useEffect } from 'react';

function CameraCapture({ onCapture, onCancel }) {
  const [hasCamera, setHasCamera] = useState(true);
  const [stream, setStream] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    initCamera();
    return () => stopCamera();
  }, []);

  const initCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use rear camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setStream(mediaStream);
      setHasCamera(true);
    } catch (err) {
      console.error('Camera access error:', err);
      setHasCamera(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    setCapturing(true);

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Set canvas size to video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0);

    // Convert to blob
    canvas.toBlob((blob) => {
      if (blob) {
        onCapture(blob);
        stopCamera();
      }
      setCapturing(false);
    }, 'image/jpeg', 0.85);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      onCapture(file);
      stopCamera();
    }
  };

  const handleCancel = () => {
    stopCamera();
    onCancel();
  };

  return (
    <div className="camera-capture">
      <div className="camera-container">
        {hasCamera ? (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="camera-preview"
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            <div className="camera-overlay">
              <div className="camera-frame"></div>
              <p className="camera-tip">
                Focus on the equipment name or overall machine view
              </p>
            </div>
          </>
        ) : (
          <div className="upload-fallback">
            <div className="upload-icon">📷</div>
            <h3>Camera not available</h3>
            <p>Upload a photo of the gym equipment instead</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <button
              className="btn btn-primary"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose Photo
            </button>
          </div>
        )}
      </div>

      <div className="camera-controls">
        {hasCamera ? (
          <>
            <button
              className="btn btn-secondary"
              onClick={handleCancel}
              disabled={capturing}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary btn-capture"
              onClick={capturePhoto}
              disabled={capturing}
            >
              {capturing ? 'Capturing...' : '📸 Capture'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={capturing}
            >
              📁 Upload
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </>
        ) : (
          <button className="btn btn-secondary" onClick={handleCancel}>
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}

export default CameraCapture;
