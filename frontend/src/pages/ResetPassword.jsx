import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiService } from '../lib/apiService';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const token = searchParams.get('token');
    const isRTL = i18n.language === 'he';

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);

    useEffect(() => {
        document.title = t('resetPassword.title', 'Reset Password');
    }, [t]);

    // Check password strength
    useEffect(() => {
        if (!password) {
            setPasswordStrength(0);
            return;
        }

        let strength = 0;
        // Length check
        if (password.length >= 8) strength += 1;
        // Contains number
        if (/\d/.test(password)) strength += 1;
        // Contains lowercase letter
        if (/[a-z]/.test(password)) strength += 1;
        // Contains uppercase letter
        if (/[A-Z]/.test(password)) strength += 1;
        // Contains special character
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;

        setPasswordStrength(strength);
    }, [password]);

    const getStrengthLabel = () => {
        if (passwordStrength === 0) return '';
        if (passwordStrength <= 2) return t('resetPassword.weak', 'Weak');
        if (passwordStrength <= 4) return t('resetPassword.medium', 'Medium');
        return t('resetPassword.strong', 'Strong');
    };

    const getStrengthColor = () => {
        if (passwordStrength === 0) return 'bg-gray-200';
        if (passwordStrength <= 2) return 'bg-red-500';
        if (passwordStrength <= 4) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!token) {
            setError(t('resetPassword.invalidOrMissingToken', 'Invalid or missing token. Please request a new password reset link.'));
            return;
        }

        if (password !== confirmPassword) {
            setError(t('resetPassword.passwordsDoNotMatch', 'Passwords do not match.'));
            return;
        }

        if (password.length < 8) {
            setError(t('resetPassword.passwordTooShort', 'Password must be at least 8 characters long.'));
            return;
        }

        if (passwordStrength < 3) {
            setError(t('resetPassword.passwordTooWeak', 'Password is too weak. Please use a stronger password.'));
            return;
        }

        setLoading(true);
        try {
            await apiService.post('/user/password-reset/confirm', { token, new_password: password });
            setMessage(t('resetPassword.passwordResetSuccess', 'Your password has been successfully reset. Redirecting to login page...'));
            setTimeout(() => {
                navigate('/signin');
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.detail || t('resetPassword.passwordResetFailed', 'Failed to reset password. Please try again.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Helmet>
                <title>{t('resetPassword.title', 'Reset Password')} | MonkeyZ</title>
                <meta name="description" content={t('resetPassword.metaDescription', 'Reset your password for your MonkeyZ account.')} />
            </Helmet>
            <div className="container mx-auto p-4 max-w-md my-10">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold mb-6 text-center text-primary dark:text-accent">
                        {t('resetPassword.title', 'Reset Password')}
                    </h2>
                    
                    {!token ? (
                        <div className="text-center my-8">
                            <p className="text-red-500 mb-4">{t('resetPassword.noToken', 'Invalid or missing reset token.')}</p>
                            <p className="mb-6">{t('resetPassword.requestNewLink', 'Please request a new password reset link.')}</p>
                            <button 
                                onClick={() => navigate('/signin')} 
                                className="bg-accent hover:bg-accent-dark text-white font-medium py-2 px-4 rounded transition duration-200"
                            >
                                {t('resetPassword.backToLogin', 'Back to Login')}
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
                            <div className="space-y-2">
                                <label htmlFor="password" className="block text-sm font-medium">
                                    {t('resetPassword.newPassword', 'New Password')}
                                </label>
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full p-3 border rounded focus:ring-2 focus:ring-accent focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder={t('resetPassword.enterPassword', 'Enter your new password')}
                                />
                                {password && (
                                    <>
                                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                            <div 
                                                className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor()}`} 
                                                style={{ width: `${(passwordStrength / 5) * 100}%` }} 
                                            />
                                        </div>
                                        <p className="text-sm mt-1">
                                            {t('resetPassword.passwordStrength', 'Password strength')}: <span className="font-medium">{getStrengthLabel()}</span>
                                        </p>
                                        <ul className="text-xs mt-2 list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                                            <li className={password.length >= 8 ? "text-green-500" : ""}>
                                                {t('resetPassword.min8Chars', 'At least 8 characters')}
                                            </li>
                                            <li className={/[A-Z]/.test(password) ? "text-green-500" : ""}>
                                                {t('resetPassword.uppercase', 'One uppercase letter')}
                                            </li>
                                            <li className={/[a-z]/.test(password) ? "text-green-500" : ""}>
                                                {t('resetPassword.lowercase', 'One lowercase letter')}
                                            </li>
                                            <li className={/\d/.test(password) ? "text-green-500" : ""}>
                                                {t('resetPassword.number', 'One number')}
                                            </li>
                                            <li className={/[^A-Za-z0-9]/.test(password) ? "text-green-500" : ""}>
                                                {t('resetPassword.special', 'One special character')}
                                            </li>
                                        </ul>
                                    </>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="confirmPassword" className="block text-sm font-medium">
                                    {t('resetPassword.confirmNewPassword', 'Confirm New Password')}
                                </label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="w-full p-3 border rounded focus:ring-2 focus:ring-accent focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder={t('resetPassword.confirmPassword', 'Confirm your new password')}
                                />
                                {password && confirmPassword && (
                                    <p className={`text-sm mt-1 ${password === confirmPassword ? 'text-green-500' : 'text-red-500'}`}>
                                        {password === confirmPassword 
                                            ? t('resetPassword.passwordsMatch', 'Passwords match') 
                                            : t('resetPassword.passwordsDoNotMatch', 'Passwords do not match')}
                                    </p>
                                )}
                            </div>
                            
                            {error && <div className="p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}
                            {message && <div className="p-3 bg-green-100 text-green-700 rounded-md">{message}</div>}
                            
                            <button 
                                type="submit" 
                                disabled={loading} 
                                className="w-full bg-accent hover:bg-accent-dark text-white py-3 px-4 rounded transition duration-200 font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading 
                                    ? t('resetPassword.resetting', 'Resetting...') 
                                    : t('resetPassword.resetPasswordButton', 'Reset Password')}
                            </button>
                            
                            <div className="text-center mt-4">
                                <button 
                                    type="button"
                                    onClick={() => navigate('/signin')}
                                    className="text-accent hover:underline"
                                >
                                    {t('resetPassword.backToLogin', 'Back to Login')}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </>
    );
};

export default ResetPassword;
