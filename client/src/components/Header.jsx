import { Link, useNavigate } from 'react-router-dom'
import './Header.css'

function Header({ user, onLogout }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    onLogout()
    navigate('/login')
  }

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/dashboard" className="header-logo">
          <span className="logo-icon">💪</span>
          <span className="logo-text">MyGymPlanner</span>
        </Link>

        <nav className="header-nav">
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          <Link to="/generate-plan" className="nav-link">New Plan</Link>
          <Link to="/today" className="nav-link">Today</Link>
          <Link to="/progress" className="nav-link">Progress</Link>
        </nav>

        <div className="header-user">
          <span className="user-name">{user.name}</span>
          <button onClick={handleLogout} className="btn btn-outline btn-sm">
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header
