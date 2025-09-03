// Modern Navigation Component with Advanced UX
// frontend/src/components/ModernNavigation.jsx

import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Button, Typography, Badge } from './ui'
import './ModernNavigation.css'

const ModernNavigation = ({ user, cartItemsCount = 0, onLogout }) => {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navigationItems = [
    { name: 'Home', path: '/', icon: '🏠' },
    { name: 'Products', path: '/products', icon: '🛍️' },
    { name: 'About', path: '/about', icon: 'ℹ️' },
    { name: 'Contact', path: '/contact', icon: '📞' }
  ]

  const handleLogout = () => {
    onLogout()
    setIsUserMenuOpen(false)
    navigate('/')
  }

  return (
    <motion.nav 
      className={`modern-nav ${isScrolled ? 'scrolled' : ''}`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
    >
      <div className="nav-container">
        {/* Logo */}
        <motion.div 
          className="nav-logo"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link to="/">
            <Typography variant="h2" className="logo-text">
              MonkeyZ
            </Typography>
          </Link>
        </motion.div>

        {/* Desktop Navigation */}
        <div className="nav-links desktop-only">
          {navigationItems.map((item) => (
            <motion.div key={item.path} whileHover={{ y: -2 }} whileTap={{ y: 0 }}>
              <Link 
                to={item.path}
                className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Right Side Actions */}
        <div className="nav-actions">
          {/* Cart */}
          <motion.div 
            className="cart-icon"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/cart')}
              className="cart-button"
            >
              🛒
              {cartItemsCount > 0 && (
                <Badge variant="accent" className="cart-badge">
                  {cartItemsCount}
                </Badge>
              )}
            </Button>
          </motion.div>

          {/* User Menu */}
          {user ? (
            <div className="user-menu-container">
              <motion.button
                className="user-avatar"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="avatar-circle">
                  {user.name?.charAt(0) || user.email?.charAt(0) || '👤'}
                </div>
              </motion.button>

              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    className="user-dropdown"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="user-info">
                      <Typography variant="body1" className="user-name">
                        {user.name || user.email}
                      </Typography>
                      <Typography variant="caption" className="user-email">
                        {user.email}
                      </Typography>
                    </div>
                    <div className="dropdown-divider"></div>
                    <button className="dropdown-item" onClick={() => navigate('/profile')}>
                      👤 Profile
                    </button>
                    <button className="dropdown-item" onClick={() => navigate('/orders')}>
                      📦 Orders
                    </button>
                    <button className="dropdown-item" onClick={() => navigate('/settings')}>
                      ⚙️ Settings
                    </button>
                    <div className="dropdown-divider"></div>
                    <button className="dropdown-item logout" onClick={handleLogout}>
                      🚪 Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="auth-buttons">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/login')}
              >
                Login
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/register')}
              >
                Sign Up
              </Button>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="mobile-menu-toggle mobile-only"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <motion.div
              animate={{ rotate: isMobileMenuOpen ? 45 : 0 }}
              transition={{ duration: 0.2 }}
            >
              {isMobileMenuOpen ? '✕' : '☰'}
            </motion.div>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mobile-menu-content">
              {navigationItems.map((item, index) => (
                <motion.div
                  key={item.path}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Link 
                    to={item.path}
                    className={`mobile-nav-link ${location.pathname === item.path ? 'active' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span>{item.name}</span>
                  </Link>
                </motion.div>
              ))}
              
              {!user && (
                <motion.div 
                  className="mobile-auth-buttons"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigate('/login')
                      setIsMobileMenuOpen(false)
                    }}
                    className="mobile-auth-btn"
                  >
                    Login
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      navigate('/register')
                      setIsMobileMenuOpen(false)
                    }}
                    className="mobile-auth-btn"
                  >
                    Sign Up
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close menus */}
      {(isMobileMenuOpen || isUserMenuOpen) && (
        <div 
          className="nav-overlay"
          onClick={() => {
            setIsMobileMenuOpen(false)
            setIsUserMenuOpen(false)
          }}
        />
      )}
    </motion.nav>
  )
}

export default ModernNavigation
