import { useEffect, useState } from "react";
import PrimaryInput from "../components/inputs/PrimaryInput";
import PrimaryButton from "../components/buttons/PrimaryButton";
import { apiService } from "../lib/apiService";
import SecondaryButton from "../components/buttons/SecondaryButton";
import { useNavigate } from "react-router-dom";
import { useGlobalProvider } from "../context/GlobalProvider";
import { validateEmail, validatePassword } from "../lib/authUtils";
import { GoogleLogin } from '@react-oauth/google';
import { checkServerConnection, checkDatabaseConnection } from "../lib/connectionUtils";

const SignIn = () => {
  const navigate = useNavigate();
  const { setUserAndToken, token } = useGlobalProvider();
  const [form, setForm] = useState({ username: "", password: "" });
  const [isSubmit, setIsSubmit] = useState(false);
  const [message, setMessage] = useState({ message: "", color: "" });
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetMsg, setResetMsg] = useState("");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState({
    checking: false,
    serverConnected: true,
    dbConnected: true,
    message: ""
  });

  useEffect(() => {
    if (token) navigate("/");
    // eslint-disable-next-line
  }, [token, navigate]);

  // Check connection to server and database
  const checkConnections = async () => {
    setConnectionStatus(prev => ({ ...prev, checking: true }));
    
    // Check server connection first
    const serverStatus = await checkServerConnection();
    if (!serverStatus.isConnected) {
      setConnectionStatus({
        checking: false,
        serverConnected: false,
        dbConnected: false,
        message: serverStatus.message
      });
      return false;
    }
    
    // Then check database connection
    const dbStatus = await checkDatabaseConnection();
    setConnectionStatus({
      checking: false,
      serverConnected: true,
      dbConnected: dbStatus.isConnected,
      message: dbStatus.isConnected ? "" : dbStatus.message
    });
    
    return serverStatus.isConnected && dbStatus.isConnected;
  };

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

    // Check connections before attempting login
    try {
      const connectionsOk = await checkConnections();
      if (!connectionsOk) {
        setMessage({ message: "Connection issues detected. Please try again later.", color: "#DC2626" });
        setIsSubmit(false);
        return;
      }
      
      const formData = new URLSearchParams();
      // Send as username (can be username or email), backend expects 'username'
      formData.append("username", form.username);
      formData.append("password", form.password);

      const { data, error } = await apiService.post(
        "/user/login",
        formData,
        "application/x-www-form-urlencoded",
      );
      setIsSubmit(false);

      if (error) {
        if (error.includes("No response from the server")) {
          // Double check connections if we get a server error
          await checkConnections();
        }
        setMessage({ message: error, color: "#DC2626" });
        return;
      }

      setMessage({ message: "User Login Successfully", color: "#16A34A" });
      setUserAndToken(data);
      setForm({ username: "", password: "" });
    } catch (err) {
      console.error("Login error:", err);
      setMessage({ message: "Login failed. Please try again.", color: "#DC2626" });
      setIsSubmit(false);
    }
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
      setResetMsg("Invalid email address.");
      return;
    }
    setIsSubmit(true); // Indicate loading/submission state
    try {
      // Call the backend endpoint to request a password reset
      const { data, error } = await apiService.post(
        `/user/password-reset/request`, // Remove email from query params
        { email: resetEmail } // Send email in the request body
      );

      if (error) {
        setResetMsg(error || "Failed to send reset email.");
      } else {
        setResetMsg(data?.message || "Password reset link sent. Please check your email.");
      }
    } catch (err) {
      setResetMsg("An unexpected error occurred. Failed to send reset email.");
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
