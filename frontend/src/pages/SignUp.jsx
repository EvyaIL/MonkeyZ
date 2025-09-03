import { useEffect, useState } from "react";
import PrimaryInput from "../components/inputs/PrimaryInput";
import PrimaryButton from "../components/buttons/PrimaryButton";
import { apiService } from "../lib/apiService";
import SecondaryButton from "../components/buttons/SecondaryButton";
import { useNavigate } from "react-router-dom";
import { useGlobalProvider } from "../context/GlobalProvider";
import { validatePhone, validateEmail, validateStrongPassword, getPasswordStrength } from "../lib/authUtils";
import { GoogleLogin } from '@react-oauth/google';
import { useTranslation } from "react-i18next";
import "./SignUp.css";

const SignUp = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    password: "",
    email: "",
    phone_number: "",
  });
  const [isSubmit, setIsSubmit] = useState(false);
  const [message, setMessage] = useState({ message: "", color: "" });
  const { token } = useGlobalProvider();
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [enteredOtp, setEnteredOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [confirmPassword, setConfirmPassword] = useState("");

  // Update password strength when password changes
  useEffect(() => {
    setPasswordStrength(getPasswordStrength(form.password));
  }, [form.password]);

  useEffect(() => {
    if (token) navigate("/");
    // eslint-disable-next-line
  }, [token, navigate]);

  const onSubmitSignUp = async (e) => {
    e?.preventDefault();
    if (isSubmit) return;
    setIsSubmit(true);
    setMessage({ message: "", color: "" });

    // Validation
    if (!validateEmail(form.email)) {
      setMessage({ message: "Invalid email address.", color: "#DC2626" });
      setIsSubmit(false);
      return;
    }
    
    // Phone is now optional - only validate if provided
    if (form.phone_number && !validatePhone(form.phone_number)) {
      setMessage({ message: "Invalid phone number format. Use 05XXXXXXXX or +972XXXXXXXXX format, or leave empty.", color: "#DC2626" });
      setIsSubmit(false);
      return;
    }
    
    // Strong password validation
    const passwordValidation = validateStrongPassword(form.password);
    if (!passwordValidation.isValid) {
      setMessage({ message: passwordValidation.message, color: "#DC2626" });
      setIsSubmit(false);
      return;
    }
    
    // Confirm password validation
    if (form.password !== confirmPassword) {
      setMessage({ message: "Passwords do not match.", color: "#DC2626" });
      setIsSubmit(false);
      return;
    }

    // Request OTP from backend and send email
    try {
      const { data, error } = await apiService.post("/user/otp/request", { 
        email: form.email 
      });
      
      if (error) {
        // If user doesn't exist, create user first then request OTP
        if (error.includes("User not found")) {
          // Create user account first - convert empty phone to null
          const userPayload = {
            ...form,
            phone_number: form.phone_number.trim() === "" ? null : parseInt(form.phone_number)
          };
          
          const createResult = await apiService.post("/user", userPayload);
          if (createResult.error) {
            setMessage({ message: createResult.error, color: "#DC2626" });
            setIsSubmit(false);
            return;
          }
          
          // Now request OTP for the newly created user
          const otpResult = await apiService.post("/user/otp/request", { 
            email: form.email 
          });
          
          if (otpResult.error) {
            setMessage({ message: otpResult.error, color: "#DC2626" });
            setIsSubmit(false);
            return;
          }
          
          setOtpSent(true);
          setMessage({ message: "Account created! OTP sent to your email.", color: "#16A34A" });
        } else {
          setMessage({ message: error, color: "#DC2626" });
          setIsSubmit(false);
          return;
        }
      } else {
        setOtpSent(true);
        setMessage({ message: "OTP sent to your email.", color: "#16A34A" });
      }
    } catch (err) {
      setMessage({ message: "Failed to send OTP. Please try again.", color: "#DC2626" });
      setIsSubmit(false);
      return;
    }
    setIsSubmit(false);
  };

  const onVerifyOtp = async (e) => {
    e?.preventDefault();
    setOtpError("");
    setIsSubmit(true);
    
    try {
      // Verify OTP with backend
      const { data, error } = await apiService.post("/user/otp/verify", {
        email: form.email,
        otp: enteredOtp
      });
      
      if (error) {
        setOtpError(error);
        setIsSubmit(false);
        return;
      }
      
      setMessage({ message: t("email_verified_successfully") || "Email verified successfully!", color: "#16A34A" });
      
      // Reset form and redirect
      setForm({ username: "", password: "", email: "", phone_number: "" });
      setOtpSent(false);
      setOtp("");
      setEnteredOtp("");
      
      // Redirect to login page after short delay
      setTimeout(() => navigate("/sign-in"), 1200);
      
    } catch (err) {
      setOtpError(t("verification_failed") || "Verification failed. Please try again.");
      setIsSubmit(false);
    }
  };

  const onResendOtp = async () => {
    if (isSubmit) return;
    setIsSubmit(true);
    setMessage({ message: "", color: "" });
    setOtpError("");

    try {
      const { data, error } = await apiService.post("/user/otp/request", { 
        email: form.email 
      });
      
      if (error) {
        setMessage({ message: error, color: "#DC2626" });
      } else {
        setMessage({ message: "OTP resent to your email.", color: "#16A34A" });
      }
    } catch (err) {
      setMessage({ message: "Failed to resend OTP. Please try again.", color: "#DC2626" });
    }
    
    setIsSubmit(false);
  };

  // Google sign up/sign in handler
  const { setUserAndToken } = useGlobalProvider();
  const onGoogleAuth = async (credentialResponse) => {
    setGoogleLoading(true);
    setIsSubmit(true);
    setMessage({ message: '', color: '' });
    try {
      // Make sure Google Cloud Console has https://monkeyz.co.il and https://www.monkeyz.co.il as authorized origins!
      const { data, error } = await apiService.post('/user/google', {
        credential: credentialResponse.credential,
        skip_otp: true, // Tell backend to skip OTP for Google
        custom_username: form.username || null, // Send custom username if provided
      });
      setIsSubmit(false);
      setGoogleLoading(false);
      if (error) {
        setMessage({ message: error, color: '#DC2626' });
        return;
      }
      if (data.user_created) {
        setMessage({ message: t('user_created_successfully') || 'Signed up with Google successfully!', color: '#16A34A' });
      } else {
        setMessage({ message: t('user_login_success') || 'Signed in with Google successfully!', color: '#16A34A' });
      }
      setUserAndToken(data); // Set user and token in context (auto-login)
      navigate('/'); // Redirect to home or profile
    } catch (err) {
      setIsSubmit(false);
      setGoogleLoading(false);
      setMessage({ message: t('google_signin_failed') || 'Google sign in failed.', color: '#DC2626' });
    }
  };

  return (
    <div className="signup-container">
      <form
        className="signup-form"
        onSubmit={otpSent ? onVerifyOtp : onSubmitSignUp}
        dir={i18n.language === 'he' ? "rtl" : "ltr"}
        aria-label="Sign up form"
      >
        <h2 className="signup-title">
          {t("create_account", "Create An Account")}
        </h2>
        
        <div
          className={`signin-message ${message.color === "#DC2626" ? "error" : message.color === "#16A34A" ? "success" : ""}`}
          role={message.color === "#DC2626" ? "alert" : "status"}
          aria-live="polite"
          style={{ opacity: message.message ? 1 : 0 }}
        >
          {message.message}
        </div>

        {!otpSent ? (
          <>
            <div className="signup-fields">
              <div className="signup-fields-grid">
                <div className="input-group">
                  <label className="input-label" htmlFor="username">
                    {t("username", "Username")}
                  </label>
                  <input
                    id="username"
                    className="input-field"
                    value={form.username}
                    placeholder={t("enter_your_username", "Enter your username")}
                    onChange={(e) => setForm({ ...form, username: e.target.value.replace(/[^a-zA-Z0-9_-]/g, "") })}
                    autoComplete="username"
                    required
                    minLength={3}
                    maxLength={32}
                  />
                </div>
                
                <div className="input-group field-full-width">
                  <label className="input-label" htmlFor="email">
                    {t("email", "Email")}
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="input-field"
                    value={form.email}
                    placeholder={t("enter_your_email", "Enter your email")}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    autoComplete="email"
                    required
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
                    autoComplete="new-password"
                    required
                    minLength={8}
                  />
                  {form.password && (
                    <div className={`password-strength-indicator password-strength-${passwordStrength <= 2 ? 'weak' : passwordStrength <= 4 ? 'medium' : 'strong'}`}>
                      <div className="password-strength-bar">
                        <div className="password-strength-fill"></div>
                      </div>
                      <span>{passwordStrength <= 2 ? t('weak', 'Weak') : passwordStrength <= 4 ? t('medium', 'Medium') : t('strong', 'Strong')} Password</span>
                    </div>
                  )}
                </div>
                
                <div className="input-group">
                  <label className="input-label" htmlFor="confirm-password">
                    {t("confirm_password", "Confirm Password")}
                  </label>
                  <input
                    id="confirm-password"
                    type="password"
                    className="input-field"
                    value={confirmPassword}
                    placeholder={t("confirm_your_password", "Confirm your password")}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    minLength={8}
                  />
                </div>
                
                <div className="input-group field-full-width">
                  <label className="input-label" htmlFor="phone">
                    {t("phone_number", "Phone Number (Optional)")}
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    className="input-field"
                    value={form.phone_number}
                    placeholder="Enter your phone number"
                    onChange={(e) => setForm({ ...form, phone_number: e.target.value.replace(/[^0-9+]/g, "") })}
                    autoComplete="tel"
                    minLength={10}
                    maxLength={15}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className={`signup-button ${isSubmit ? "loading" : ""}`}
              disabled={isSubmit}
            >
              {isSubmit ? t("signing_up", "Signing up...") : t("sign_up", "Sign Up")}
            </button>

            <div className="divider">
              {t("or", "or")}
            </div>

            <div className="google-signin">
              <GoogleLogin
                onSuccess={onGoogleAuth}
                onError={(error) => { 
                  console.error('Google OAuth Error:', error);
                  setMessage({ 
                    message: t('google_signin_failed') || 'Google sign in failed. Please check your internet connection and try again.', 
                    color: '#DC2626' 
                  }); 
                  setGoogleLoading(false); 
                }}
                locale={document.documentElement.lang || 'en'}
                theme="filled_blue"
                text="signup_with"
                shape="pill"
                disabled={googleLoading}
              />
            </div>

            <div className="signin-links">
              <button
                type="button"
                className="signin-link"
                onClick={() => navigate("/sign-in")}
              >
                {t("already_have_account", "Already have an account? Sign In")}
              </button>
            </div>
          </>
        ) : (
          <div className="otp-section">
            <h3 className="otp-title">
              {t("verify_email", "Verify Your Email")}
            </h3>
            <p className="otp-description">
              {t("otp_sent_to", "We've sent a verification code to")} {form.email}
            </p>
            
            <div className="input-group">
              <label className="input-label" htmlFor="otp">
                {t("enter_otp", "Enter Verification Code")}
              </label>
              <input
                id="otp"
                className="otp-input"
                value={enteredOtp}
                placeholder={t("enter_the_otp", "Enter the 6-digit code")}
                onChange={(e) => setEnteredOtp(e.target.value)}
                maxLength={6}
                required
              />
            </div>
            
            {otpError && (
              <div className="signin-message error">
                {otpError}
              </div>
            )}
            
            <div className="otp-buttons">
              <button
                type="button"
                className="otp-button secondary"
                onClick={onResendOtp}
                disabled={isSubmit}
              >
                {t("resend_otp", "Resend Code")}
              </button>
              <button
                type="submit"
                className={`otp-button primary ${isSubmit ? "loading" : ""}`}
                disabled={isSubmit}
              >
                {isSubmit ? t("verifying", "Verifying...") : t("verify_otp", "Verify")}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};

export default SignUp;
