import { useEffect, useState } from "react";
import PrimaryInput from "../components/inputs/PrimaryInput";
import PrimaryButton from "../components/buttons/PrimaryButton";
import { apiService } from "../lib/apiService";
import SecondaryButton from "../components/buttons/SecondaryButton";
import { useNavigate } from "react-router-dom";
import { useGlobalProvider } from "../context/GlobalProvider";
import { validateEmail, validatePassword } from "../lib/authUtils";
import { GoogleLogin } from '@react-oauth/google';
import { useTranslation } from "react-i18next";
import "./SignIn.css";

const SignIn = () => {
  // State initialization
  const navigate = useNavigate();
  const { setUserAndToken, token } = useGlobalProvider();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'he';
  const [form, setForm] = useState({ usernameOrEmail: "", password: "" });
  const [isSubmit, setIsSubmit] = useState(false);
  const [message, setMessage] = useState({ message: "", color: "" });
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [isResetSubmit, setIsResetSubmit] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (token) navigate("/");
    // eslint-disable-next-line
  }, [token, navigate]);

  const onClickSignIn = async (e) => {
    e?.preventDefault();
    if (isSubmit) return;
    setIsSubmit(true);
    setMessage({ message: "", color: "" });
    
    // Determine if input is email or username
    const isEmail = form.usernameOrEmail.includes("@") && validateEmail(form.usernameOrEmail);
    
    // Validate input
    if (!form.usernameOrEmail) {
      setMessage({ message: t("signin_error_empty_field", "Email or username is required"), color: "#DC2626" });
      setIsSubmit(false);
      return;
    }
    
    // Username validation (if not an email)
    if (!isEmail) {
      if (form.usernameOrEmail.length < 3) {
        setMessage({ message: t("signin_error_invalid_username", "Username must be at least 3 characters"), color: "#DC2626" });
        setIsSubmit(false);
        return;
      }
      
      // Check if username contains invalid characters
      if (!/^[a-zA-Z0-9_.-]+$/.test(form.usernameOrEmail)) {
        setMessage({ message: t("signin_error_invalid_username_chars", "Username can only contain letters, numbers, and _ . -"), color: "#DC2626" });
        setIsSubmit(false);
        return;
      }
    }
    
    if (!validatePassword(form.password)) {
      setMessage({ message: t("signin_error_password", "Password must be at least 8 characters"), color: "#DC2626" });
      setIsSubmit(false);
      return;
    }

    const formData = new URLSearchParams();
    // Send as username (backend expects 'username' field even for email logins)
    formData.append("username", form.usernameOrEmail);
    formData.append("password", form.password);

    const { data, error } = await apiService.post(
      "/user/login",
      formData,
      "application/x-www-form-urlencoded",
    );
    setIsSubmit(false);

    if (error) {
      console.error("Login error:", error);
      setMessage({ message: error, color: "#DC2626" });
      return;
    }

    setMessage({ message: "User Login Successfully", color: "#16A34A" });
    setUserAndToken(data);
    setForm({ usernameOrEmail: "", password: "" });
  };

  // Google sign in handler
  const onGoogleSignIn = async (credentialResponse) => {
    setGoogleLoading(true);
    setIsSubmit(true);
    setMessage({ message: '', color: '' });
    try {
      const { data, error } = await apiService.post('/user/google', {
        credential: credentialResponse.credential,
      });
      setIsSubmit(false);
      setGoogleLoading(false);
      if (error) {
        setMessage({ message: error, color: '#DC2626' });
        return;
      }
      if (data.user_created) {
        setMessage({ message: 'Signed up with Google successfully!', color: '#16A34A' });
      } else {
        setMessage({ message: 'Signed in with Google successfully!', color: '#16A34A' });
      }
      setUserAndToken(data);
      // navigate('/');
    } catch (err) {
      setIsSubmit(false);
      setGoogleLoading(false);
      setMessage({ message: 'Google sign in failed.', color: '#DC2626' });
    }
  };

  const onPasswordReset = async (e) => {
    e?.preventDefault();
    setResetMsg("");
    
    if (!resetEmail.trim()) {
      setResetMsg(t("email_required", "Email is required"));
      return;
    }
    
    if (!validateEmail(resetEmail)) {
      setResetMsg(t("invalid_email", "Invalid email address"));
      return;
    }
    
    setIsResetSubmit(true);
    
    try {
      // Call the backend endpoint to request a password reset
      const { data, error } = await apiService.post(
        `/user/password-reset/request`,
        { email: resetEmail }
      );

      if (error) {
        setResetMsg(error || t("reset_email_failed", "Failed to send reset email"));
      } else {
        setResetMsg(data?.message || t("reset_email_sent", "Password reset link sent. Please check your email"));
        // Clear email input after successful request
        setResetEmail("");
        // Auto-hide the reset form after a few seconds
        setTimeout(() => {
          setShowReset(false);
        }, 5000);
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.detail || err?.response?.data?.message || err?.message || t("unexpected_error", "An unexpected error occurred. Failed to send reset email");
      setResetMsg(errorMessage);
    } finally {
      setIsResetSubmit(false);
    }
  };

  return (
    <div className="signin-container">
      <form
        className="signin-form"
        onSubmit={onClickSignIn}
        dir={isRTL ? "rtl" : "ltr"}
        aria-label="Sign in form"
      >
        <h2 className="signin-title">{t("sign_in", "Login")}</h2>
        
        <div
          className={`signin-message ${message.color === "#DC2626" ? "error" : message.color === "#16A34A" ? "success" : ""}`}
          role={message.color === "#DC2626" ? "alert" : "status"}
          aria-live="polite"
          style={{ opacity: message.message ? 1 : 0 }}
        >
          {message.message}
        </div>

        <div className="signin-fields">
          <div className="input-group">
            <label className="input-label" htmlFor="username-email">
              {t("username_or_email", "Username or Email")}
            </label>
            <input
              id="username-email"
              className="input-field"
              value={form.usernameOrEmail}
              placeholder={t("enter_username_or_email", "Enter your username, email, or Google name")}
              onChange={(e) => setForm({ ...form, usernameOrEmail: e.target.value })}
              autoComplete="username"
              required
              minLength={3}
              maxLength={50}
            />
          </div>
          
          <div className="input-group">
            <label className="input-label" htmlFor="password">
              {t("password", "Password")}
            </label>
            <input
              id="password"
              type="password"
              className="input-field"
              value={form.password}
              placeholder={t("enter_your_password", "Enter your password")}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="current-password"
              required
              minLength={8}
            />
          </div>
        </div>
        
        <button
          type="submit"
          className={`signin-button ${isSubmit ? "loading" : ""}`}
          disabled={isSubmit}
        >
          {isSubmit ? t("signing_in", "Signing in...") : t("sign_in", "Sign in")}
        </button>
        
        <div className="divider">
          {t("or", "or")}
        </div>
        
        <div className="google-signin">
          <GoogleLogin
            onSuccess={onGoogleSignIn}
            onError={(error) => { 
              console.error('Google OAuth Error:', error);
              let errorMessage = 'Google sign in failed.';
              
              if (error?.error === 'popup_blocked') {
                errorMessage = 'Google sign-in popup was blocked. Please allow popups for this site.';
              } else if (error?.error === 'access_blocked') {
                errorMessage = 'Google sign-in access was blocked. Please check your browser settings.';
              } else if (window.location.hostname === 'localhost') {
                errorMessage = 'Google sign-in failed. Make sure localhost:3000 is authorized in Google Console.';
              }
              
              setMessage({ message: errorMessage, color: '#DC2626' }); 
              setGoogleLoading(false); 
            }}
            locale={document.documentElement.lang || 'en'}
            theme="filled_blue"
            text="signin_with"
            shape="pill"
            disabled={googleLoading}
          />
        </div>

        <div className="signin-links">
          <button
            type="button"
            className="signin-link"
            onClick={() => setShowReset((v) => !v)}
          >
            {t("forgot_password", "Forgot password?")}
          </button>
          
          <button
            type="button"
            className="signin-link"
            onClick={() => navigate("/sign-up")}
          >
            {t("dont_have_account", "Don't have an account? Sign Up")}
          </button>
        </div>
      </form>

      {showReset && (
        <div className="reset-modal" onClick={(e) => e.target.className.includes('reset-modal') && setShowReset(false)}>
          <div className="reset-form" dir={isRTL ? "rtl" : "ltr"}>
            <h3 className="reset-title">{t("reset_password", "Reset Password")}</h3>
            <p className="text-sm text-gray-600 mb-4">
              {t("reset_password_instructions", "Enter your email address below and we'll send you a link to reset your password.")}
            </p>
            
            <div className="input-group">
              <label className="input-label" htmlFor="reset-email">
                {t("email", "Email")}
              </label>
              <input
                id="reset-email"
                type="email"
                className="input-field"
                value={resetEmail}
                placeholder={t("enter_email_for_reset", "Enter your email address")}
                onChange={(e) => setResetEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
            
            {resetMsg && (
              <div className={`signin-message ${resetMsg.includes("sent") ? "success" : "error"}`}>
                {resetMsg}
              </div>
            )}
            
            <div className="reset-buttons">
              <button
                type="button"
                className="reset-button secondary"
                onClick={() => setShowReset(false)}
              >
                {t("cancel", "Cancel")}
              </button>
              <button
                type="button"
                className={`reset-button primary ${isResetSubmit ? "loading" : ""}`}
                onClick={onPasswordReset}
                disabled={isResetSubmit}
              >
                {isResetSubmit ? t("sending", "Sending...") : t("send_reset_email", "Send Reset Email")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SignIn;
