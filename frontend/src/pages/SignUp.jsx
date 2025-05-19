import { useEffect, useState } from "react";
import PrimaryInput from "../components/inputs/PrimaryInput";
import PrimaryButton from "../components/buttons/PrimaryButton";
import { apiService } from "../lib/apiService";
import SecondaryButton from "../components/buttons/SecondaryButton";
import { useNavigate, Link } from "react-router-dom";
import { useGlobalProvider } from "../context/GlobalProvider";
<<<<<<< Updated upstream

const SignUp = () => {
    const navigate = useNavigate();
=======
import { validatePhone, validateEmail, validatePassword } from "../lib/authUtils";
import { sendOtpEmail, sendWelcomeEmail } from "../lib/emailService";
import { GoogleLogin, googleLogout } from '@react-oauth/google';
import { useTranslation } from "react-i18next";
import GoogleButton from "../components/buttons/GoogleButton";
import { Helmet } from "react-helmet";

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
>>>>>>> Stashed changes

    const [form, setForm] = useState({ username: "", password: "", email: "", phone_number: "" });
    const [isSubmit, setIsSubmit] = useState(false);
    const [message, setMessage] = useState({ message: "", color: "" });
    const {token}=useGlobalProvider()


    if(token)
        navigate("/")

    const onClickSignUp = async () => {
        if (isSubmit) return;
        setIsSubmit(true);
        const { data, error } = await apiService.post("/user", form);
        setIsSubmit(false);

        if (error) {
            setMessage({ message: error, color: "#DC2626" });
            return;
        }
        setMessage({ message: "User created successfully", color: "#16A34A" });

        setForm({ username: "", password: "", email: "", phone_number: "" });
    };

<<<<<<< Updated upstream
    return (
        <div className="flex justify-center items-start min-h-screen bg-primary p-4">
            <div className="p-6 bg-secondary rounded-lg shadow-lg space-y-5 mt-5 w-full sm:w-[80%] md:w-[60%] lg:w-[40%] h-auto">
                <h2 className="text-center text-accent text-2xl font-bold">Create An Account</h2>
                <p className={`text-center font-bold transition-all ${message.message ? "scale-100" : "scale-0"} w-full h-5`}
                    style={{ color: message.color }}
                >
                    {message.message}
                </p>
=======
  // Handler for Google Sign Up
  const handleGoogleLogin = async (credentialResponse) => {
    setGoogleLoading(true);
    setMessage({ message: "", color: "" });
    
    try {
      const { data, error } = await apiService.post('/user/google-auth', {
        token: credentialResponse.credential
      });
      
      if (error) {
        throw new Error(error);
      }
      
      if (data?.access_token) {
        localStorage.setItem('token', data.access_token);
        
        // Send welcome email if it's a new registration
        if (data.is_new_user) {
          try {
            await sendWelcomeEmail({ to_email: data.email });
          } catch (emailErr) {
            console.error('Error sending welcome email:', emailErr);
          }
        }
        
        window.location.href = '/'; // Force reload to update auth context
      }
    } catch (err) {
      console.error('Google sign-in error:', err);
      setMessage({ 
        message: t("signup_google_error") || "Failed to sign up with Google. Please try again.", 
        color: "#DC2626" 
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-fadeIn">
      <Helmet>
        <title>{t('signup')} - MonkeyZ</title>
        <meta name="description" content={t('signup_meta_description') || "Create an account on MonkeyZ to access exclusive products and services."} />
      </Helmet>
      
      <form
        className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-lg space-y-5 mt-5 w-full sm:w-[80%] md:w-[60%] lg:w-[40%] h-auto border border-gray-200 dark:border-gray-700"
        onSubmit={otpSent ? onVerifyOtp : onSubmitSignUp}
        aria-label="Sign up form"
      >
        <h2 className="text-center text-primary dark:text-accent text-2xl font-bold">
          {t('create_account')}
        </h2>
        <p
          className={`text-center font-bold transition-all ${message.message ? "scale-100" : "scale-0"} w-full h-5`}
          style={{ color: message.color }}
          role={message.color === "#DC2626" ? "alert" : "status"}
          aria-live="polite"
        >
          {message.message}
        </p>
>>>>>>> Stashed changes

                <div className="flex flex-col sm:flex-row sm:space-x-5 space-y-5 sm:space-y-0 justify-center py-5">
                    <div className="space-y-5 w-full">
                        <PrimaryInput
                            title="Username"
                            value={form.username}
                            placeholder="Enter your username"
                            onChange={(e) => setForm({ ...form, username: e.target.value })}
                        />

                        <PrimaryInput
                            type="password"
                            title="Password"
                            value={form.password}
                            placeholder="Enter your password"
                            onChange={(e) => setForm({ ...form, password: e.target.value })}
                        />
                    </div>

                    <div className="space-y-5 w-full">
                        <PrimaryInput
                            type="email"
                            title="Email"
                            value={form.email}
                            placeholder="Enter your email"
                            otherStyle="w-full"
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />

                        <PrimaryInput
                            title="Phone Number"
                            type="number"
                            value={form.phone_number}
                            placeholder="Enter your phone number"
                            onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                        />
                    </div>
                </div>

                <SecondaryButton title="Sign Up" onClick={onClickSignUp} otherStyle="w-full mt-5" />
                <PrimaryButton title="Already have an account?" onClick={() => navigate("/sign-in")} otherStyle="w-full" />
            </div>
        </div>
<<<<<<< Updated upstream
    );
=======

        {/* Google Sign Up */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                {t('or_continue_with')}
              </span>
            </div>
          </div>

          <div className="mt-6">
            <GoogleLogin
              onSuccess={handleGoogleLogin}
              onError={() => {
                setMessage({
                  message: t('google_signin_failed') || 'Google sign in failed.',
                  color: '#DC2626'
                });
              }}
              theme="outline"
              text="signup_with"
              shape="rectangular"
              locale={i18n.language}
              useOneTap
              render={({ onClick }) => (
                <GoogleButton
                  onClick={onClick}
                  text={t('signup_with_google')}
                  isLoading={googleLoading}
                />
              )}
            />
          </div>
        </div>

        <div className="mt-4 text-center text-sm">
          <p className="text-gray-600 dark:text-gray-400">
            {t('already_have_account')}?{' '}
            <Link to="/signin" className="text-primary dark:text-accent font-medium hover:underline">
              {t('signin')}
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
>>>>>>> Stashed changes
};

export default SignUp;
