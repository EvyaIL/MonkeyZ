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
    console.log("Password reset button clicked"); // Debug log
    setResetMsg("");
    
    if (!resetEmail.trim()) {
      setResetMsg(t("email_required", "Email is required"));
      return;
    }
    
    if (!validateEmail(resetEmail)) {
      setResetMsg(t("invalid_email", "Invalid email address"));
      return;
    }
    
    console.log("Sending password reset request for:", resetEmail); // Debug log
    setIsResetSubmit(true);
    
    try {
      // Call the backend endpoint to request a password reset
      const { data, error } = await apiService.post(
        `/user/password-reset/request`,
        { email: resetEmail }
      );

      console.log("Password reset response:", { data, error }); // Debug log

      if (error) {
        console.error("Password reset error:", error);
        setResetMsg(error || t("reset_email_failed", "Failed to send reset email"));
      } else {
        console.log("Password reset success:", data);
        setResetMsg(data?.message || t("reset_email_sent", "Password reset link sent. Please check your email"));
        // Clear email input after successful request
        setResetEmail("");
        // Auto-hide the reset form after a few seconds
        setTimeout(() => {
          setShowReset(false);
        }, 5000);
      }
    } catch (err) {
      console.error("Password reset catch error:", err);
      const errorMessage = err?.response?.data?.detail || err?.response?.data?.message || err?.message || t("unexpected_error", "An unexpected error occurred. Failed to send reset email");
      setResetMsg(errorMessage);
    } finally {
      setIsResetSubmit(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <form
        className="bg-white dark:bg-gray-800 border border-accent/30 dark:border-accent/30 rounded-lg shadow-lg p-4 md:p-6 backdrop-blur-sm space-y-6 w-full max-w-md"
        onSubmit={onClickSignIn}
        dir={isRTL ? "rtl" : "ltr"}
        aria-label="Sign in form"
      >
        <h2 className="text-center text-2xl font-bold text-accent">{t("sign_in", "Login")}</h2>
        
        <div
          className={`text-center font-bold transition-all ${message.message ? "scale-100" : "scale-0"} w-full h-5`}
          style={{ color: message.color }}
          role={message.color === "#DC2626" ? "alert" : "status"}
          aria-live="polite"
        >
          {message.message}
        </div>

        <div className="space-y-4">
          <PrimaryInput
            title={t("username_or_email", "Username or Email")}
            value={form.usernameOrEmail}
            placeholder={t("enter_username_or_email", "Enter your username, email, or Google name")}
            onChange={(e) => setForm({ ...form, usernameOrEmail: e.target.value })}
            autoComplete="username"
            required
            minLength={3}
            maxLength={50}
          />
          <PrimaryInput
            type="password"
            title={t("password", "Password")}
            value={form.password}
            placeholder={t("enter_your_password", "Enter your password")}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            autoComplete="current-password"
            required
            minLength={8}
          />
        </div>
        
        <PrimaryButton
          title={isSubmit ? t("signing_in", "Signing in...") : t("sign_in", "Sign in")}
          onClick={onClickSignIn}
          otherStyle="w-full"
          disabled={isSubmit}
        />
        
        <div className="relative mt-4">
          <div className="absolute inset-0 flex items-center">            <div className="w-full border-t border-accent/30 dark:border-accent/30"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 text-accent/70 bg-white dark:bg-gray-800">{t("or", "or")}</span>
          </div>
        </div>
        
        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={onGoogleSignIn}
            onError={() => { setMessage({ message: 'Google sign in failed.', color: '#DC2626' }); setGoogleLoading(false); }}
            locale={document.documentElement.lang || 'en'}
            theme="filled_blue"
            text="signin_with"
            shape="pill"
            disabled={googleLoading}
          />
        </div>

        <SecondaryButton
          title={t("forgot_password", "Forgot password?")}
          onClick={() => setShowReset((v) => !v)}
          otherStyle="w-full"
        />

        {showReset && (
          <div className="p-4 mt-4 border border-accent/30 dark:border-accent/30 rounded-lg bg-gray-50 dark:bg-gray-800/50 space-y-3" dir={isRTL ? "rtl" : "ltr"}>
            <h3 className="text-lg font-medium text-center mb-3">{t("reset_password", "Reset Password")}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              {t("reset_password_instructions", "Enter your email address below and we'll send you a link to reset your password.")}
            </p>
            <div>
              <PrimaryInput
                title={t("email", "Email")}
                value={resetEmail}
                placeholder={t("enter_email_for_reset", "Enter your email address")}
                onChange={(e) => setResetEmail(e.target.value)}
                autoComplete="email"
                required
                type="email"
              />
              <div className="mt-3">
                <PrimaryButton
                  title={isResetSubmit ? t("sending", "Sending...") : t("send_reset_email", "Send Reset Email")}
                  onClick={onPasswordReset}
                  otherStyle="w-full"
                  disabled={isResetSubmit}
                />
              </div>
              {resetMsg && (
                <p className={`text-center p-2 mt-2 rounded ${resetMsg.includes("sent") ? "bg-green-100/70 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100/70 text-red-600 dark:bg-red-900/30 dark:text-red-300"}`}>
                  {resetMsg}
                </p>
              )}
            </div>
          </div>
        )}

        <SecondaryButton
          title={t("dont_have_account", "Don't have an account? Sign Up")}
          onClick={() => navigate("/sign-up")}
          otherStyle="w-full"
        />
      </form>
    </div>
  );
};

export default SignIn;
