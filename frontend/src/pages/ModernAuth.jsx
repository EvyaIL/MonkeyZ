// Modern Authentication Page with Advanced UX
// frontend/src/pages/ModernAuth.jsx

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Typography, 
  Button, 
  Input, 
  Card,
  Alert,
  LoadingBarAdvanced,
  Checkbox
} from '../components/ui'
import { useNavigate, useLocation } from 'react-router-dom'
import { useGlobalProvider } from '../context/GlobalProvider'
import { validateEmail, validatePassword } from '../lib/authUtils'
import { apiService } from '../lib/apiService'
import { GoogleLogin } from '@react-oauth/google'
import { useTranslation } from 'react-i18next'
import { Helmet } from 'react-helmet-async'

// Icons
const EyeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

const EyeOffIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
  </svg>
)

const EmailIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
)

const UserIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
)

const LockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
)

const AuthBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10" />
      
      {/* Animated shapes */}
      <motion.div
        className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full blur-3xl"
        animate={{
          x: [0, 50, 0],
          y: [0, -30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-secondary/20 to-accent/20 rounded-full blur-3xl"
        animate={{
          x: [0, -30, 0],
          y: [0, 50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgb(255,255,255,0.15)_1px,transparent_0)] bg-[length:20px_20px]" />
      </div>
    </div>
  )
}

const AuthForm = ({ mode, onModeChange }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { setUserAndToken, token } = useGlobalProvider()
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    rememberMe: false
  })
  
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showResetForm, setShowResetForm] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetLoading, setResetLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  
  // Redirect if already authenticated
  useEffect(() => {
    if (token) {
      const from = location.state?.from?.pathname || '/'
      navigate(from, { replace: true })
    }
  }, [token, navigate, location])
  
  // Form validation
  const validateForm = () => {
    const newErrors = {}
    
    if (mode === 'signup') {
      if (!formData.firstName.trim()) {
        newErrors.firstName = t('error_first_name_required', 'First name is required')
      }
      if (!formData.lastName.trim()) {
        newErrors.lastName = t('error_last_name_required', 'Last name is required')
      }
      if (!formData.username.trim()) {
        newErrors.username = t('error_username_required', 'Username is required')
      } else if (formData.username.length < 3) {
        newErrors.username = t('error_username_length', 'Username must be at least 3 characters')
      }
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = t('error_passwords_match', 'Passwords do not match')
      }
    }
    
    if (!formData.email) {
      newErrors.email = t('error_email_required', 'Email is required')
    } else if (!validateEmail(formData.email)) {
      newErrors.email = t('error_email_invalid', 'Please enter a valid email address')
    }
    
    if (!formData.password) {
      newErrors.password = t('error_password_required', 'Password is required')
    } else if (mode === 'signup' && !validatePassword(formData.password)) {
      newErrors.password = t('error_password_weak', 'Password must be at least 8 characters with numbers and letters')
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    
    setLoading(true)
    setErrors({})
    setSuccessMessage('')
    
    try {
      const endpoint = mode === 'signin' ? '/auth/signin' : '/auth/signup'
      const payload = mode === 'signin' 
        ? { 
            usernameOrEmail: formData.email, 
            password: formData.password,
            rememberMe: formData.rememberMe
          }
        : {
            email: formData.email,
            username: formData.username,
            password: formData.password,
            firstName: formData.firstName,
            lastName: formData.lastName
          }
      
      const { data, error } = await apiService.post(endpoint, payload)
      
      if (error) {
        setErrors({ general: error })
      } else {
        if (mode === 'signin') {
          setUserAndToken(data.user, data.token)
          const from = location.state?.from?.pathname || '/'
          navigate(from, { replace: true })
        } else {
          setSuccessMessage(t('signup_success', 'Account created successfully! Please sign in.'))
          onModeChange('signin')
        }
      }
    } catch (error) {
      setErrors({ general: t('error_general', 'Something went wrong. Please try again.') })
    } finally {
      setLoading(false)
    }
  }
  
  // Handle password reset
  const handlePasswordReset = async (e) => {
    e.preventDefault()
    if (!resetEmail || !validateEmail(resetEmail)) {
      setErrors({ reset: t('error_email_invalid', 'Please enter a valid email address') })
      return
    }
    
    setResetLoading(true)
    setErrors({})
    
    try {
      const { error } = await apiService.post('/auth/reset-password', { email: resetEmail })
      
      if (error) {
        setErrors({ reset: error })
      } else {
        setSuccessMessage(t('reset_email_sent', 'Password reset link sent to your email!'))
        setShowResetForm(false)
        setResetEmail('')
      }
    } catch (error) {
      setErrors({ reset: t('error_general', 'Something went wrong. Please try again.') })
    } finally {
      setResetLoading(false)
    }
  }
  
  // Google OAuth success
  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true)
    try {
      const { data, error } = await apiService.post('/auth/google', {
        credential: credentialResponse.credential
      })
      
      if (error) {
        setErrors({ general: error })
      } else {
        setUserAndToken(data.user, data.token)
        const from = location.state?.from?.pathname || '/'
        navigate(from, { replace: true })
      }
    } catch (error) {
      setErrors({ general: t('error_google_signin', 'Google sign-in failed. Please try again.') })
    } finally {
      setLoading(false)
    }
  }
  
  const formVariants = {
    hidden: { opacity: 0, x: mode === 'signin' ? -50 : 50 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { duration: 0.3, ease: "easeOut" }
    },
    exit: { 
      opacity: 0, 
      x: mode === 'signin' ? 50 : -50,
      transition: { duration: 0.2 }
    }
  }
  
  if (showResetForm) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md"
      >
        <Card className="p-8 backdrop-blur-lg bg-white/90 dark:bg-gray-900/90 border-0 shadow-2xl">
          <div className="text-center mb-8">
            <Typography variant="h4" className="font-bold mb-2">
              {t('reset_password', 'Reset Password')}
            </Typography>
            <Typography variant="body1" className="text-gray-600 dark:text-gray-400">
              {t('reset_subtitle', 'Enter your email to receive a reset link')}
            </Typography>
          </div>
          
          <form onSubmit={handlePasswordReset} className="space-y-6">
            <Input
              type="email"
              placeholder={t('email_placeholder', 'Enter your email')}
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              icon={<EmailIcon />}
              error={errors.reset}
            />
            
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={resetLoading}
              className="w-full bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary"
            >
              {resetLoading ? (
                <LoadingBarAdvanced progress={100} size="sm" className="w-20" />
              ) : (
                t('send_reset_link', 'Send Reset Link')
              )}
            </Button>
            
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowResetForm(false)}
              className="w-full"
            >
              {t('back_to_signin', 'Back to Sign In')}
            </Button>
          </form>
        </Card>
      </motion.div>
    )
  }
  
  return (
    <motion.div
      variants={formVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="w-full max-w-md"
    >
      <Card className="p-8 backdrop-blur-lg bg-white/90 dark:bg-gray-900/90 border-0 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Typography variant="h4" className="font-bold mb-2">
            {mode === 'signin' ? t('sign_in', 'Sign In') : t('sign_up', 'Sign Up')}
          </Typography>
          <Typography variant="body1" className="text-gray-600 dark:text-gray-400">
            {mode === 'signin' 
              ? t('signin_subtitle', 'Welcome back! Please sign in to your account.')
              : t('signup_subtitle', 'Create your account to get started.')
            }
          </Typography>
        </div>
        
        {/* Success/Error Messages */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6"
            >
              <Alert variant="success">{successMessage}</Alert>
            </motion.div>
          )}
          
          {errors.general && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6"
            >
              <Alert variant="error">{errors.general}</Alert>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Google OAuth */}
        <div className="mb-6">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setErrors({ general: t('error_google_signin', 'Google sign-in failed') })}
            useOneTap
            theme="outline"
            size="large"
            width="100%"
          />
        </div>
        
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-900 text-gray-500">
              {t('or_continue_with', 'Or continue with email')}
            </span>
          </div>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === 'signup' && (
            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder={t('first_name', 'First Name')}
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                error={errors.firstName}
                icon={<UserIcon />}
              />
              <Input
                placeholder={t('last_name', 'Last Name')}
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                error={errors.lastName}
                icon={<UserIcon />}
              />
            </div>
          )}
          
          <Input
            type="email"
            placeholder={t('email_placeholder', 'Enter your email')}
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={errors.email}
            icon={<EmailIcon />}
          />
          
          {mode === 'signup' && (
            <Input
              placeholder={t('username_placeholder', 'Choose a username')}
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              error={errors.username}
              icon={<UserIcon />}
            />
          )}
          
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder={t('password_placeholder', 'Enter your password')}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            error={errors.password}
            icon={<LockIcon />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            }
          />
          
          {mode === 'signup' && (
            <Input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder={t('confirm_password', 'Confirm your password')}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              error={errors.confirmPassword}
              icon={<LockIcon />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              }
            />
          )}
          
          {mode === 'signin' && (
            <div className="flex items-center justify-between">
              <Checkbox
                label={t('remember_me', 'Remember me')}
                checked={formData.rememberMe}
                onChange={(checked) => setFormData({ ...formData, rememberMe: checked })}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowResetForm(true)}
                className="text-primary hover:text-primary-dark"
              >
                {t('forgot_password', 'Forgot password?')}
              </Button>
            </div>
          )}
          
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary transform hover:scale-105 transition-all duration-200"
          >
            {loading ? (
              <LoadingBarAdvanced progress={100} size="sm" className="w-20" />
            ) : (
              mode === 'signin' ? t('sign_in', 'Sign In') : t('sign_up', 'Sign Up')
            )}
          </Button>
        </form>
        
        {/* Footer */}
        <div className="mt-8 text-center">
          <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
            {mode === 'signin' 
              ? t('no_account', "Don't have an account?")
              : t('have_account', 'Already have an account?')
            }
            {' '}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onModeChange(mode === 'signin' ? 'signup' : 'signin')}
              className="text-primary hover:text-primary-dark font-medium"
            >
              {mode === 'signin' ? t('sign_up', 'Sign Up') : t('sign_in', 'Sign In')}
            </Button>
          </Typography>
        </div>
      </Card>
    </motion.div>
  )
}

const ModernAuth = () => {
  const { t } = useTranslation()
  const location = useLocation()
  const [mode, setMode] = useState('signin') // 'signin' or 'signup'
  
  // Determine initial mode from URL
  useEffect(() => {
    if (location.pathname.includes('signup')) {
      setMode('signup')
    } else {
      setMode('signin')
    }
  }, [location.pathname])
  
  return (
    <>
      <Helmet>
        <title>
          {mode === 'signin' 
            ? t('signin_title', 'Sign In - MonkeyZ')
            : t('signup_title', 'Sign Up - MonkeyZ')
          }
        </title>
        <meta 
          name="description" 
          content={mode === 'signin' 
            ? t('signin_description', 'Sign in to your MonkeyZ account to access premium digital products.')
            : t('signup_description', 'Create your MonkeyZ account to discover premium digital products and software.')
          } 
        />
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
        <AuthBackground />
        
        <div className="relative z-10 w-full max-w-md">
          <AnimatePresence mode="wait">
            <AuthForm key={mode} mode={mode} onModeChange={setMode} />
          </AnimatePresence>
        </div>
      </div>
    </>
  )
}

export default ModernAuth
