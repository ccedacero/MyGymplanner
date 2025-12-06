import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Analytics } from '@vercel/analytics/react'
import * as api from './services/api'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { setAccessTokenGetter, setRefreshTokenHandler } from './services/api'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import PlanGenerator from './pages/PlanGenerator'
import TodaysWorkout from './pages/TodaysWorkout'
import WorkoutLogger from './pages/WorkoutLogger'
import WeeklySchedule from './pages/WeeklySchedule'
import Progress from './pages/Progress'
import Settings from './pages/Settings'
import Stretches from './pages/Stretches'
import Header from './components/Header'

// Inner component with access to navigate
function AppContent() {
  const { user, setUser, accessToken, loading, login, logout, refreshAccessToken } = useAuth();
  const navigate = useNavigate()
  const location = useLocation()
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [staleSession, setStaleSession] = useState(null)
  const [showStaleSessionModal, setShowStaleSessionModal] = useState(false)

  // Helper to check if user needs onboarding
  const needsOnboarding = (user) => {
    return user && (!user.equipment || user.equipment.length === 0)
  }

  // Inject token getter and refresh handler into API service
  useEffect(() => {
    setAccessTokenGetter(() => accessToken);
    setRefreshTokenHandler(refreshAccessToken);
  }, [accessToken, refreshAccessToken])

  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Check for active workout session on mount
  useEffect(() => {
    const checkActiveSession = async () => {
      if (user && isOnline && !loading) {
        try {
          const response = await api.getActiveSession(user.id)
          if (response.hasActiveSession) {
            const session = response.session

            // Don't redirect if already on the workout logger page
            if (location.pathname.startsWith('/log-workout')) {
              return
            }

            // Check if session is stale (> 7 days old)
            const sessionAge = Date.now() - new Date(session.updatedAt).getTime()
            const sevenDays = 7 * 24 * 60 * 60 * 1000

            if (sessionAge > sevenDays) {
              // Show stale session modal
              setStaleSession(session)
              setShowStaleSessionModal(true)
            } else {
              // Auto-redirect to in-progress workout
              console.log('Found active workout session, redirecting...')
              navigate(`/log-workout/${session.planId}/${session.day}`)
            }
          }
        } catch (error) {
          console.error('Error checking active session:', error)
        }
      }
    }

    checkActiveSession()
  }, [user, loading, isOnline])

  const handleResumeStaleSession = () => {
    if (staleSession) {
      navigate(`/log-workout/${staleSession.planId}/${staleSession.day}`)
      setShowStaleSessionModal(false)
    }
  }

  const handleDiscardStaleSession = async () => {
    if (staleSession) {
      try {
        await api.abandonSession(staleSession.id)
        setShowStaleSessionModal(false)
        setStaleSession(null)
      } catch (error) {
        alert('Error discarding session: ' + error.message)
      }
    }
  }

  const handleLogin = (userData, tokens) => {
    login(userData, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      sessionId: tokens.sessionId
    });
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="app">
      {user && <Header user={user} onLogout={logout} />}

      {/* Offline Indicator */}
      {!isOnline && (
        <div style={{
          position: 'sticky',
          top: user ? '65px' : '0',
          zIndex: 99,
          background: '#FFA500',
          color: '#000',
          padding: '0.5rem 1rem',
          textAlign: 'center',
          fontWeight: '500'
        }}>
          📡 You're offline - Some features may be limited
        </div>
      )}

      {/* Stale Session Modal */}
      {showStaleSessionModal && staleSession && (
        <div className="modal-overlay" onClick={() => setShowStaleSessionModal(false)}>
          <div className="modal-content" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <h2>Resume Old Workout?</h2>
            <p>You have a workout from {new Date(staleSession.sessionDate).toLocaleDateString()} that was never completed.</p>
            <p style={{ color: '#6B7280', fontSize: '0.875rem' }}>
              Last updated: {new Date(staleSession.updatedAt).toLocaleString()}
            </p>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
              <button onClick={handleResumeStaleSession} className="btn btn-primary" style={{ flex: 1 }}>
                Resume
              </button>
              <button onClick={handleDiscardStaleSession} className="btn btn-outline" style={{ flex: 1 }}>
                Discard
              </button>
            </div>
            <button
              onClick={() => setShowStaleSessionModal(false)}
              className="btn btn-text"
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <Routes>
        <Route path="/" element={
          user
            ? (needsOnboarding(user) ? <Navigate to="/onboarding" /> : <Navigate to="/dashboard" />)
            : <Navigate to="/login" />
        } />
        <Route path="/login" element={
          user
            ? (needsOnboarding(user) ? <Navigate to="/onboarding" /> : <Navigate to="/dashboard" />)
            : <Login onLogin={handleLogin} />
        } />
        <Route path="/onboarding" element={user ? <Onboarding user={user} setUser={setUser} /> : <Navigate to="/login" />} />
        <Route path="/dashboard" element={
          user
            ? (needsOnboarding(user) ? <Navigate to="/onboarding" /> : <Dashboard user={user} />)
            : <Navigate to="/login" />
        } />
        <Route path="/generate-plan" element={user ? <PlanGenerator user={user} /> : <Navigate to="/login" />} />
        <Route path="/today" element={user ? <TodaysWorkout user={user} /> : <Navigate to="/login" />} />
        <Route path="/log-workout/:planId/:day" element={user ? <WorkoutLogger user={user} /> : <Navigate to="/login" />} />
        <Route path="/schedule" element={user ? <WeeklySchedule user={user} /> : <Navigate to="/login" />} />
        <Route path="/progress" element={user ? <Progress user={user} /> : <Navigate to="/login" />} />
        <Route path="/settings" element={user ? <Settings user={user} setUser={setUser} onLogout={handleLogout} /> : <Navigate to="/login" />} />
        <Route path="/stretches" element={user ? <Stretches /> : <Navigate to="/login" />} />
      </Routes>

      <Analytics />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  )
}

export default App
