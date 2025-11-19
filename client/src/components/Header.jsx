import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import './Header.css'

function Header({ user, onLogout }) {
  const navigate = useNavigate()
  const [theme, setTheme] = useState(() => {
    // Get theme from localStorage or default to light
    return localStorage.getItem('theme') || 'light'
  })
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false)
  const moreMenuRef = useRef(null)

  // Apply theme on mount and when it changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setIsMoreMenuOpen(false)
      }
    }

    if (isMoreMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isMoreMenuOpen])

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light')
  }

  const handleLogout = () => {
    onLogout()
    navigate('/login')
  }

  const toggleMoreMenu = () => {
    setIsMoreMenuOpen(prev => !prev)
  }

  const handleMoreMenuItemClick = () => {
    setIsMoreMenuOpen(false)
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
          <Link to="/today" className="nav-link">Today</Link>
          <Link to="/schedule" className="nav-link">Schedule</Link>

          <div className="more-menu" ref={moreMenuRef}>
            <button
              className="more-menu-trigger nav-link"
              onClick={toggleMoreMenu}
              aria-expanded={isMoreMenuOpen}
              aria-haspopup="true"
            >
              More
              <span className={`more-arrow ${isMoreMenuOpen ? 'open' : ''}`}>▼</span>
            </button>

            {isMoreMenuOpen && (
              <div className="more-menu-dropdown">
                <Link
                  to="/progress"
                  className="more-menu-item"
                  onClick={handleMoreMenuItemClick}
                >
                  Progress
                </Link>
                <Link
                  to="/stretches"
                  className="more-menu-item"
                  onClick={handleMoreMenuItemClick}
                >
                  Stretches
                </Link>
                <Link
                  to="/settings"
                  className="more-menu-item"
                  onClick={handleMoreMenuItemClick}
                >
                  Settings
                </Link>
              </div>
            )}
          </div>
        </nav>

        <div className="header-user">
          <button
            onClick={toggleTheme}
            className="theme-toggle"
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
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
