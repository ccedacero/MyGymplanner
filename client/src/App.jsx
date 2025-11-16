import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import PlanGenerator from './pages/PlanGenerator'
import TodaysWorkout from './pages/TodaysWorkout'
import WorkoutLogger from './pages/WorkoutLogger'
import WeeklySchedule from './pages/WeeklySchedule'
import Progress from './pages/Progress'
import Header from './components/Header'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')

    if (token && userData) {
      setUser(JSON.parse(userData))
    }

    setLoading(false)
  }, [])

  const handleLogin = (userData, token) => {
    setUser(userData)
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const handleLogout = () => {
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <Router>
      <div className="app">
        {user && <Header user={user} onLogout={handleLogout} />}

        <Routes>
          <Route
            path="/login"
            element={user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />}
          />

          <Route
            path="/onboarding"
            element={user ? <Onboarding user={user} setUser={setUser} /> : <Navigate to="/login" />}
          />

          <Route
            path="/dashboard"
            element={user ? <Dashboard user={user} /> : <Navigate to="/login" />}
          />

          <Route
            path="/generate-plan"
            element={user ? <PlanGenerator user={user} /> : <Navigate to="/login" />}
          />

          <Route
            path="/today"
            element={user ? <TodaysWorkout user={user} /> : <Navigate to="/login" />}
          />

          <Route
            path="/log-workout/:planId/:day"
            element={user ? <WorkoutLogger user={user} /> : <Navigate to="/login" />}
          />

          <Route
            path="/schedule"
            element={user ? <WeeklySchedule user={user} /> : <Navigate to="/login" />}
          />

          <Route
            path="/progress"
            element={user ? <Progress user={user} /> : <Navigate to="/login" />}
          />

          <Route
            path="/"
            element={<Navigate to={user ? "/dashboard" : "/login"} />}
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App
