import { useEffect, useState } from "react";
import PrimaryInput from "../components/inputs/PrimaryInput";
import PrimaryButton from "../components/buttons/PrimaryButton";
import { apiService } from "../lib/apiService";
import SecondaryButton from "../components/buttons/SecondaryButton";
import { useNavigate } from "react-router-dom";
import { useGlobalProvider } from "../context/GlobalProvider";
import { validatePhone, validateEmail, validatePassword } from "../lib/authUtils";
import { sendOtpEmail, sendWelcomeEmail } from "../lib/emailService";
import { GoogleLogin } from '@react-oauth/google';
import { useTranslation } from "react-i18next";

const SignUp = () => {
  const { t } = useTranslation();
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
    if (!validatePhone(form.phone_number)) {
      setMessage({ message: "Invalid phone number.", color: "#DC2626" });
      setIsSubmit(false);
      return;
    }
    if (!validatePassword(form.password)) {
      setMessage({ message: "Password must be at least 8 characters.", color: "#DC2626" });
      setIsSubmit(false);
      return;
    }

    // Generate OTP and send email
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setOtp(generatedOtp);
    try {
      await sendOtpEmail({ to_email: form.email, otp: generatedOtp });
      setOtpSent(true);
      setMessage({ message: "OTP sent to your email.", color: "#16A34A" });
    } catch (err) {
      setMessage({ message: "Failed to send OTP email.", color: "#DC2626" });
      setIsSubmit(false);
      return;
    }
    setIsSubmit(false);
  };

  const onVerifyOtp = async (e) => {
    e?.preventDefault();
    if (enteredOtp !== otp) {
      setOtpError(t("invalid_otp") || "Invalid OTP.");
      return;
    }
    setOtpError("");
    setIsSubmit(true);
    const { error } = await apiService.post("/user", form);
    setIsSubmit(false);
    if (error) {
      setMessage({ message: error, color: "#DC2626" });
      return;
    }
    setMessage({ message: t("user_created_successfully") || "User created successfully!", color: "#16A34A" });
    await sendWelcomeEmail({ to_email: form.email, username: form.username });
    setForm({ username: "", password: "", email: "", phone_number: "" });
    setOtpSent(false);
    setOtp("");
    setEnteredOtp("");
    // Redirect to login page after short delay
    setTimeout(() => navigate("/sign-in"), 1200);
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
        className="p-6 bg-white dark:bg-secondary rounded-lg shadow-lg space-y-5 mt-5 w-full sm:w-[80%] md:w-[60%] lg:w-[40%] h-auto"
        onSubmit={otpSent ? onVerifyOtp : onSubmitSignUp}
        aria-label="Sign up form"
      >
        <h2 className="text-center text-accent text-2xl font-bold">
          Create An Account
        </h2>
        <p
          className={`text-center font-bold transition-all ${message.message ? "scale-100" : "scale-0"} w-full h-5`}
          style={{ color: message.color }}
          role={message.color === "#DC2626" ? "alert" : "status"}
          aria-live="polite"
        >
          {message.message}
        </p>

        <div className="space-y-5 w-full">
          <PrimaryInput
            title="Username"
            value={form.username}
            placeholder="Enter your username"
            onChange={(e) => setForm({ ...form, username: e.target.value.replace(/[^a-zA-Z0-9_-]/g, "") })}
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
            autoComplete="new-password"
            required
            minLength={8}
          />
          <PrimaryInput
            type="email"
            title="Email"
            value={form.email}
            placeholder="Enter your email"
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            autoComplete="email"
            required
          />
          <PrimaryInput
            title="Phone Number"
            type="tel"
            value={form.phone_number}
            placeholder="05XXXXXXXX or +972XXXXXXXXX"
            onChange={(e) => setForm({ ...form, phone_number: e.target.value.replace(/[^0-9+]/g, "") })}
            autoComplete="tel"
            required
            minLength={10}
            maxLength={15}
          />
        </div>

        {otpSent && (
          <div className="space-y-2">
            <PrimaryInput
              title="Enter OTP"
              value={enteredOtp}
              placeholder="Enter the OTP sent to your email"
              onChange={(e) => setEnteredOtp(e.target.value)}
              required
            />
            {otpError && <p className="text-red-500 text-center">{otpError}</p>}
            <div className="flex flex-col gap-2 mt-2">
              <PrimaryButton
                title={isSubmit ? t("signing_up") : t("verify_otp")}
                onClick={onVerifyOtp}
                otherStyle="w-full"
                disabled={isSubmit}
              />
              <SecondaryButton
                title={t("resend_otp")}
                onClick={onSubmitSignUp}
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
            otherStyle="w-full mt-5"
            disabled={isSubmit}
          />
        )}
        <SecondaryButton
          title={t("already_have_account")}
          onClick={() => navigate("/sign-in")}
          otherStyle="w-full"
        />

        <div className="flex flex-col items-center gap-2 mt-2">
          <GoogleLogin
            onSuccess={onGoogleAuth}
            onError={() => { setMessage({ message: t('google_signin_failed') || 'Google sign in failed.', color: '#DC2626' }); setGoogleLoading(false); }}
            locale={document.documentElement.lang || 'en'}
            theme="filled_blue"
            text="signup_with"
            shape="pill"
            disabled={googleLoading}
          />
          {/* NOTE: Your backend must implement POST /user/google for Google sign-in to work! */}
          {message.message && message.color === '#DC2626' && (
            <p className="text-red-500 text-center mt-2">{message.message}</p>
          )}
        </div>
      </form>
    </div>
  );
};

export default SignUp;
