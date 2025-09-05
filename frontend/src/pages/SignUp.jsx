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
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <form
        className="bg-white dark:bg-gray-800 border border-accent/30 dark:border-accent/30 rounded-lg shadow-lg p-4 md:p-6 backdrop-blur-sm space-y-5 w-full max-w-md"
        onSubmit={otpSent ? onVerifyOtp : onSubmitSignUp}
        dir={i18n.language === 'he' ? "rtl" : "ltr"}
        aria-label="Sign up form"
      >
        <h2 className="text-center text-2xl font-bold text-accent">
          {t("create_account", "Create An Account")}
        </h2>
        
        <div
          className={`text-center font-bold transition-all ${message.message ? "scale-100" : "scale-0"} w-full h-5`}
          style={{ color: message.color }}
          role={message.color === "#DC2626" ? "alert" : "status"}
          aria-live="polite"
        >
          {message.message}
        </div>

        <div className="flex flex-col gap-6">

          <div className="space-y-4">
            <PrimaryInput
              title={t("username", "Username")}
              value={form.username}
              placeholder={t("enter_your_username", "Enter your username")}
              onChange={(e) => setForm({ ...form, username: e.target.value.replace(/[^a-zA-Z0-9_-]/g, "") })}
              autoComplete="username"
              required
              minLength={3}
              maxLength={32}
            />
            <PrimaryInput
              type="password"
              title={t("password", "Password")}
              value={form.password}
              placeholder={t("enter_your_password", "Enter your password")}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="new-password"
              required
              minLength={8}
            />
            
            {/* Password Strength Indicator */}
            {form.password && (
              <div className="mt-2">
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        passwordStrength <= 2 ? 'bg-red-500' :
                        passwordStrength <= 4 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${(passwordStrength / 5) * 100}%` }}
                    ></div>
                  </div>
                  <span className={`text-sm font-medium ${
                    passwordStrength <= 2 ? 'text-red-500' :
                    passwordStrength <= 4 ? 'text-yellow-500' : 'text-green-500'
                  }`}>
                    {passwordStrength <= 2 ? t('weak', 'Weak') :
                     passwordStrength <= 4 ? t('medium', 'Medium') : t('strong', 'Strong')}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {t('password_requirements', 'Use 8+ characters with uppercase, lowercase, numbers & symbols')}
                </p>
              </div>
            )}
            
            <PrimaryInput
              type="password"
              title={t("confirm_password", "Confirm Password")}
              value={confirmPassword}
              placeholder={t("confirm_your_password", "Confirm your password")}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
            />
            
            <PrimaryInput
              type="email"
              title={t("email", "Email")}
              value={form.email}
              placeholder={t("enter_your_email", "Enter your email")}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              autoComplete="email"
              required
            />
            <PrimaryInput
              title={t("phone_number", "Phone Number (Optional)")}
              type="tel"
              value={form.phone_number}
              placeholder="Enter your phone number"
              onChange={(e) => setForm({ ...form, phone_number: e.target.value.replace(/[^0-9+]/g, "") })}
              autoComplete="tel"
              minLength={10}
              maxLength={15}
            />
          </div>

          <div className="relative mb-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 text-gray-500 bg-white dark:bg-gray-800">{t("or", "or")}</span>
            </div>
          </div>

          <div className="flex justify-center mb-4">
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

          {otpSent && (
            <div className="space-y-4">
              <PrimaryInput
                title={t("enter_otp", "Enter OTP")}
                value={enteredOtp}
                placeholder={t("enter_the_otp", "Enter the OTP sent to your email")}
                onChange={(e) => setEnteredOtp(e.target.value)}
                required
              />
              {otpError && <p className="text-red-500 text-center">{otpError}</p>}
              <div className="flex flex-col gap-2">
                <PrimaryButton
                  title={isSubmit ? t("signing_up") : t("verify_otp")}
                  onClick={onVerifyOtp}
                  otherStyle="w-full"
                  disabled={isSubmit}
                />
                <SecondaryButton
                  title={t("resend_otp")}
                  onClick={onResendOtp}
                  otherStyle="w-full text-xs py-1"
                  disabled={isSubmit}
                />
              </div>
            </div>
          )}

          {!otpSent && (
            <PrimaryButton
              title={isSubmit ? t("signing_up") : t("sign_up")}
              onClick={onSubmitSignUp}
              otherStyle="w-full"
              disabled={isSubmit}
            />
          )}
          
          <SecondaryButton
            title={t("already_have_account")}
            onClick={() => navigate("/sign-in")}
            otherStyle="w-full"
          />
          
          {message.message && message.color === '#DC2626' && (
            <p className="text-red-500 text-center">{message.message}</p>
          )}
        </div>
      </form>
    </div>
  );
};

export default SignUp;
