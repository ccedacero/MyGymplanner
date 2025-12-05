import { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';
import './SessionManagement.css';

function SessionManagement({ userId }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSessions = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getSessions(userId);
      setSessions(data.sessions);
    } catch (err) {
      setError('Failed to load sessions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const handleRevokeSession = async (sessionId) => {
    if (!confirm('Are you sure you want to logout this device? This action cannot be undone.')) {
      return;
    }

    try {
      await api.revokeSession(sessionId);
      setSessions(sessions.filter(s => s.id !== sessionId));
    } catch (err) {
      alert('Failed to revoke session: ' + err.message);
    }
  };

  const handleRevokeAllOthers = async () => {
    if (!confirm('Are you sure you want to logout all other devices? This will end all sessions except the current one.')) {
      return;
    }

    try {
      await api.revokeAllOtherSessions(userId);
      setSessions(sessions.filter(s => s.isCurrent));
      alert('All other sessions have been logged out');
    } catch (err) {
      alert('Failed to revoke sessions: ' + err.message);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
  };

  const getDeviceIcon = (deviceType) => {
    switch (deviceType) {
      case 'mobile':
        return '📱';
      case 'tablet':
        return '📱';
      case 'desktop':
        return '💻';
      default:
        return '🖥️';
    }
  };

  if (loading) {
    return <div className="loading">Loading sessions...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  const otherSessions = sessions.filter(s => !s.isCurrent);

  return (
    <div className="session-management">
      <div className="session-header">
        <h2>Active Sessions</h2>
        {otherSessions.length > 0 && (
          <button
            onClick={handleRevokeAllOthers}
            className="btn btn-outline btn-sm"
          >
            Logout All Other Devices
          </button>
        )}
      </div>

      <div className="sessions-list">
        {sessions.map(session => (
          <div
            key={session.id}
            className={`session-item ${session.isCurrent ? 'current' : ''}`}
          >
            <div className="session-icon">
              {getDeviceIcon(session.deviceType)}
            </div>
            <div className="session-info">
              <div className="session-device">
                {session.deviceName}
                {session.isCurrent && (
                  <span className="current-badge">Current Device</span>
                )}
              </div>
              <div className="session-meta">
                <span>Last active: {formatDate(session.lastUsedAt)}</span>
                <span>IP: {session.ipAddress}</span>
              </div>
            </div>
            {!session.isCurrent && (
              <button
                onClick={() => handleRevokeSession(session.id)}
                className="btn btn-outline btn-sm btn-danger"
              >
                Logout
              </button>
            )}
          </div>
        ))}
      </div>

      {sessions.length === 0 && (
        <div className="no-sessions">No active sessions found</div>
      )}
    </div>
  );
}

export default SessionManagement;
