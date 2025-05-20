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
  const navigate = useNavigate();
  const { setUserAndToken, token } = useGlobalProvider();
  const { t } = useTranslation();
  const [form, setForm] = useState({ usernameOrEmail: "", password: "" });
  const [isSubmit, setIsSubmit] = useState(false);
  const [message, setMessage] = useState({ message: "", color: "" });
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMsg, setResetMsg] = useState("");
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
    // Send as username (backend expects 'username' field)
    formData.append("username", form.usernameOrEmail);
    formData.append("password", form.password);

    const { data, error } = await apiService.post(
      "/user/login",
      formData,
      "application/x-www-form-urlencoded",
    );
    setIsSubmit(false);

    if (error) {
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
    if (!validateEmail(resetEmail)) {
      setResetMsg(t("invalid_email", "Invalid email address"));
      return;
    }
    setIsSubmit(true); // Indicate loading/submission state
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
      setResetMsg(t("unexpected_error", "An unexpected error occurred. Failed to send reset email"));
    } finally {
      setIsSubmit(false); // Reset loading/submission state
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <form
        className="p-6 md:p-10 bg-white dark:bg-secondary rounded-lg shadow-lg space-y-6 w-full max-w-md"
        onSubmit={onClickSignIn}
        aria-label="Sign in form"
      >
        <h2 className="text-center text-accent text-2xl font-bold">Login</h2>
        <p
          className={`text-center font-bold transition-all w-full h-5 ${message.message ? "scale-100" : "scale-0"}`}
          style={{ color: message.color }}
          role={message.color === "#DC2626" ? "alert" : "status"}
          aria-live="polite"
        >
          {message.message}
        </p>

        <PrimaryInput
          title="Username or Email"
          value={form.usernameOrEmail}
          placeholder="Enter your username or email"
          onChange={(e) => setForm({ ...form, usernameOrEmail: e.target.value })}
          autoComplete="username"
          required
          minLength={3}
          maxLength={50}
        />
        <PrimaryInput
          type="password"
          title="Password"
          value={form.password}
          placeholder="Enter your password"
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          autoComplete="current-password"
          required
          minLength={8}
        />
        <PrimaryButton
          title={isSubmit ? "Signing in..." : "Sign in"}
          onClick={onClickSignIn}
          otherStyle="w-full"
          disabled={isSubmit}
        />
        <div className="flex flex-col items-center gap-2 mt-2">
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
          title="Forgot password?"
          onClick={() => setShowReset((v) => !v)}
          otherStyle="w-full"
        />
        {showReset && (
          <div className="p-4 mt-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50 space-y-3">
            <h3 className="text-lg font-medium text-center mb-3">{t("reset_password", "Reset Password")}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              {t("reset_password_instructions", "Enter your email address below and we'll send you a link to reset your password.")}
            </p>
            <PrimaryInput
              title={t("email", "Email")}
              value={resetEmail}
              placeholder={t("enter_email_for_reset", "Enter your email address")}
              onChange={(e) => setResetEmail(e.target.value)}
              autoComplete="email"
              required
              type="email"
            />
            <PrimaryButton
              title={isSubmit ? t("sending", "Sending...") : t("send_reset_email", "Send Reset Email")}
              onClick={onPasswordReset}
              otherStyle="w-full"
              disabled={isSubmit}
            />
            {resetMsg && (
              <p className={`text-center p-2 rounded ${resetMsg.includes("sent") ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300"}`}>
                {resetMsg}
              </p>
            )}
          </div>
        )}
        <SecondaryButton
          title="Don't have an account? Sign Up"
          onClick={() => navigate("/sign-up")}
          otherStyle="w-full"
        />
      </form>
    </div>
  );
};

export default SignIn;
