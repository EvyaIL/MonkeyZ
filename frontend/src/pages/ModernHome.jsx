// Modern Homepage with Advanced UX/UI
// frontend/src/pages/ModernHome.jsx

import React, { useState, useEffect } from 'react'
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion'
import { 
  Button, 
  Card, 
  Typography, 
  Badge,
  LoadingBarAdvanced
} from '../components/ui'
import { useNavigate } from 'react-router-dom'
import './ModernHome.css'

const ModernHome = () => {
  const navigate = useNavigate()
  const [activeFeature, setActiveFeature] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const { scrollY } = useScroll()
  
  // Parallax effects
  const heroY = useTransform(scrollY, [0, 500], [0, -150])
  const featuresY = useTransform(scrollY, [300, 800], [100, -50])
  const statsOpacity = useTransform(scrollY, [400, 600], [0, 1])

  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      setIsDarkMode(true)
      document.documentElement.setAttribute('data-theme', 'dark')
    }
    
    // Simulate loading
    setTimeout(() => setIsLoading(false), 1500)
    
    // Auto-rotate features
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % features.length)
    }, 4000)
    
    return () => clearInterval(interval)
  }, [])

  const toggleDarkMode = () => {
    const newTheme = !isDarkMode ? 'dark' : 'light'
    setIsDarkMode(!isDarkMode)
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)
  }

  const features = [
    {
      title: "AI-Powered Recommendations",
      description: "Smart product suggestions tailored to your preferences",
      icon: "🤖",
      color: "var(--color-primary)"
    },
    {
      title: "Real-time Inventory",
      description: "Live stock updates with instant availability",
      icon: "📦",
      color: "var(--color-success)"
    },
    {
      title: "Seamless Checkout",
      description: "One-click purchasing with multiple payment options",
      icon: "💳",
      color: "var(--color-accent)"
    },
    {
      title: "Lightning Fast",
      description: "Optimized performance for instant page loads",
      icon: "⚡",
      color: "var(--color-warning)"
    }
  ]

  const stats = [
    { label: "Happy Customers", value: "50K+", icon: "😊" },
    { label: "Products Delivered", value: "2M+", icon: "📦" },
    { label: "Average Rating", value: "4.9/5", icon: "⭐" },
    { label: "Countries Served", value: "25+", icon: "🌍" }
  ]

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Verified Customer",
      content: "The most intuitive shopping experience I've ever had. Lightning fast and beautifully designed!",
      avatar: "👩‍💼",
      rating: 5
    },
    {
      name: "Mike Chen",
      role: "Tech Enthusiast", 
      content: "Finally, an e-commerce platform that actually understands modern UX. Absolutely love it!",
      avatar: "👨‍💻",
      rating: 5
    },
    {
      name: "Emma Rodriguez",
      role: "Small Business Owner",
      content: "Helped me find exactly what I needed for my business. The AI recommendations are spot-on!",
      avatar: "👩‍🚀",
      rating: 5
    }
  ]

  if (isLoading) {
    return (
      <div className="modern-loader">
        <motion.div 
          className="loader-content"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="brand-logo">🐒</div>
          <Typography variant="h2" className="brand-text">MonkeyZ</Typography>
          <LoadingBarAdvanced progress={75} showPercentage={false} />
          <Typography variant="body2" className="loading-text">Preparing your experience...</Typography>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="modern-home">
      {/* Hero Section */}
      <motion.section 
        className="hero-section"
        style={{ y: heroY }}
      >
        <div className="hero-background">
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
          <div className="gradient-orb orb-3"></div>
        </div>
        
        <div className="hero-content">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <Badge variant="primary" className="hero-badge">
              ✨ Now with AI-Powered Recommendations
            </Badge>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Typography variant="hero" className="hero-title">
              Shopping Reimagined for the
              <span className="gradient-text"> Digital Age</span>
            </Typography>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Typography variant="lead" className="hero-subtitle">
              Experience the future of e-commerce with lightning-fast performance, 
              AI-driven personalization, and seamless user experiences.
            </Typography>
          </motion.div>

          <motion.div 
            className="hero-actions"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <Button 
              variant="primary" 
              size="large"
              onClick={() => navigate('/products')}
              className="cta-button"
            >
              Start Shopping 🚀
            </Button>
            <Button 
              variant="outline" 
              size="large"
              onClick={() => navigate('/phase2-demo')}
              className="demo-button"
            >
              View Demo ✨
            </Button>
          </motion.div>

          {/* Dark Mode Toggle */}
          <motion.div 
            className="theme-toggle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <Button
              variant="outline"
              size="small"
              onClick={toggleDarkMode}
              className="theme-toggle-btn"
            >
              {isDarkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </Button>
          </motion.div>
        </div>

        <motion.div 
          className="hero-visual"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 1 }}
        >
          <div className="floating-cards">
            <Card className="floating-card card-1">
              <div className="card-icon">🛍️</div>
              <Typography variant="body2">Smart Shopping</Typography>
            </Card>
            <Card className="floating-card card-2">
              <div className="card-icon">⚡</div>
              <Typography variant="body2">Lightning Fast</Typography>
            </Card>
            <Card className="floating-card card-3">
              <div className="card-icon">🎯</div>
              <Typography variant="body2">AI Powered</Typography>
            </Card>
          </div>
        </motion.div>
      </motion.section>

      {/* Features Section */}
      <motion.section 
        className="features-section"
        style={{ y: featuresY }}
      >
        <div className="container">
          <motion.div 
            className="section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Typography variant="h2" className="section-title">
              Built for Modern Commerce
            </Typography>
            <Typography variant="lead" className="section-subtitle">
              Every feature designed with performance and user experience in mind
            </Typography>
          </motion.div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className={`feature-card ${activeFeature === index ? 'active' : ''}`}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.05 }}
                onClick={() => setActiveFeature(index)}
              >
                <Card className="feature-content">
                  <div 
                    className="feature-icon"
                    style={{ backgroundColor: `${feature.color}20`, color: feature.color }}
                  >
                    {feature.icon}
                  </div>
                  <Typography variant="h3" className="feature-title">
                    {feature.title}
                  </Typography>
                  <Typography variant="body1" className="feature-description">
                    {feature.description}
                  </Typography>
                  <div className="feature-indicator">
                    <motion.div 
                      className="indicator-bar"
                      initial={{ width: 0 }}
                      animate={{ width: activeFeature === index ? '100%' : '0%' }}
                      style={{ backgroundColor: feature.color }}
                    />
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <motion.section 
        className="stats-section"
        style={{ opacity: statsOpacity }}
      >
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                className="stat-item"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <div className="stat-icon">{stat.icon}</div>
                <Typography variant="h2" className="stat-value">
                  {stat.value}
                </Typography>
                <Typography variant="body2" className="stat-label">
                  {stat.label}
                </Typography>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="container">
          <motion.div 
            className="section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <Typography variant="h2" className="section-title">
              What Our Customers Say
            </Typography>
            <Typography variant="lead" className="section-subtitle">
              Real feedback from real people who love shopping with us
            </Typography>
          </motion.div>

          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className="testimonial-card">
                  <div className="testimonial-rating">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <span key={i} className="star">⭐</span>
                    ))}
                  </div>
                  <Typography variant="body1" className="testimonial-content">
                    "{testimonial.content}"
                  </Typography>
                  <div className="testimonial-author">
                    <div className="author-avatar">{testimonial.avatar}</div>
                    <div className="author-info">
                      <Typography variant="body2" className="author-name">
                        {testimonial.name}
                      </Typography>
                      <Typography variant="caption" className="author-role">
                        {testimonial.role}
                      </Typography>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <motion.div 
            className="cta-content"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <Card className="cta-card">
              <Typography variant="h2" className="cta-title">
                Ready to Transform Your Shopping?
              </Typography>
              <Typography variant="lead" className="cta-subtitle">
                Join thousands of satisfied customers experiencing the future of e-commerce
              </Typography>
              <div className="cta-actions">
                <Button 
                  variant="primary" 
                  size="large"
                  onClick={() => navigate('/register')}
                  className="cta-primary"
                >
                  Get Started Free 🎉
                </Button>
                <Button 
                  variant="outline" 
                  size="large"
                  onClick={() => navigate('/products')}
                  className="cta-secondary"
                >
                  Browse Products 🛍️
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default ModernHome
