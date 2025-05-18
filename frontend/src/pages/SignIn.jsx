import { useEffect, useState } from "react";
import PrimaryInput from "../components/inputs/PrimaryInput";
import PrimaryButton from "../components/buttons/PrimaryButton";
import { apiService } from "../lib/apiService";
import SecondaryButton from "../components/buttons/SecondaryButton";
import { useNavigate } from "react-router-dom";
import { useGlobalProvider } from "../context/GlobalProvider";
import { validateEmail, validatePassword } from "../lib/authUtils";
import { sendPasswordResetEmail } from "../lib/emailService";
import { GoogleLogin } from '@react-oauth/google';

const SignIn = () => {
  const navigate = useNavigate();
  const { setUserAndToken, token } = useGlobalProvider();
  const [form, setForm] = useState({ username: "", password: "" });
  const [isSubmit, setIsSubmit] = useState(false);
  const [message, setMessage] = useState({ message: "", color: "" });
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMsg, setResetMsg] = useState("");

  useEffect(() => {
    if (token) navigate("/");
    // eslint-disable-next-line
  }, [token, navigate]);

  const onClickSignIn = async (e) => {
    e?.preventDefault();
    if (isSubmit) return;
    setIsSubmit(true);
    setMessage({ message: "", color: "" });
    // Accept either email or username
    const isEmail = form.username.includes("@") && validateEmail(form.username);
    if (!isEmail && form.username.length < 3) {
      setMessage({ message: "Invalid username or email.", color: "#DC2626" });
      setIsSubmit(false);
      return;
    }
    if (!validatePassword(form.password)) {
      setMessage({ message: "Password must be at least 8 characters.", color: "#DC2626" });
      setIsSubmit(false);
      return;
    }

    const formData = new URLSearchParams();
    // Send as username or email, backend should accept either
    formData.append("username_or_email", form.username);
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
    setForm({ username: "", password: "" });
  };

  // Google sign in handler
  const onGoogleSignIn = async (credentialResponse) => {
    setIsSubmit(true);
    setMessage({ message: '', color: '' });
    try {
      // Send Google credential to backend for sign in
      const { data, error } = await apiService.post('/user/google', {
        credential: credentialResponse.credential,
      });
      setIsSubmit(false);
      if (error) {
        setMessage({ message: error, color: '#DC2626' });
        return;
      }
      setMessage({ message: 'Signed in with Google successfully!', color: '#16A34A' });
      setUserAndToken(data);
      // navigate('/');
    } catch (err) {
      setIsSubmit(false);
      setMessage({ message: 'Google sign in failed.', color: '#DC2626' });
    }
  };

  const onPasswordReset = async (e) => {
    e?.preventDefault();
    setResetMsg("");
    if (!validateEmail(resetEmail)) {
      setResetMsg("Invalid email address.");
      return;
    }
    try {
      // Generate a dummy reset link (replace with real logic)
      const reset_link = `${window.location.origin}/reset-password?email=${encodeURIComponent(resetEmail)}`;
      await sendPasswordResetEmail({ to_email: resetEmail, reset_link });
      setResetMsg("Password reset email sent.");
    } catch (err) {
      setResetMsg("Failed to send reset email.");
    }
  };

  return (
    <div className="flex justify-center items-start min-h-screen bg-primary p-4">
      <form
        className="p-6 md:p-14 bg-secondary rounded-lg shadow-lg space-y-7 w-full max-w-md"
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
          title="Username"
          value={form.username}
          placeholder="Enter your username or email"
          onChange={(e) => setForm({ ...form, username: e.target.value })}
          autoComplete="username"
          required
          minLength={3}
          maxLength={32}
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
            onError={() => setMessage({ message: 'Google sign in failed.', color: '#DC2626' })}
            width="100%"
            locale={document.documentElement.lang || 'en'}
            theme="filled_blue"
            text="signin_with"
            shape="pill"
          />
        </div>
        <SecondaryButton
          title="Forgot password?"
          onClick={() => setShowReset((v) => !v)}
          otherStyle="w-full"
        />
        {showReset && (
          <div className="space-y-2 mt-4">
            <PrimaryInput
              title="Email"
              value={resetEmail}
              placeholder="Enter your email for reset"
              onChange={(e) => setResetEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <PrimaryButton
              title="Send Reset Email"
              onClick={onPasswordReset}
            />
            {resetMsg && <p className="text-center text-accent">{resetMsg}</p>}
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
