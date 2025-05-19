import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { apiService } from '../lib/apiService'; // Changed to named import
import { useTranslation } from 'react-i18next';

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState(0);

    // Calculate password strength
    useEffect(() => {
        if (!password) {
            setPasswordStrength(0);
            return;
        }

        let strength = 0;
        
        // Length check
        if (password.length >= 8) strength += 1;
        if (password.length >= 12) strength += 1;
        
        // Complexity checks
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[a-z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;
        
        setPasswordStrength(Math.min(5, strength));
    }, [password]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (!token) {
            setError(t('resetPassword.invalidOrMissingToken'));
            return;
        }

        if (password !== confirmPassword) {
            setError(t('resetPassword.passwordsDoNotMatch'));
            return;
        }

        if (password.length < 6) { // Example validation
            setError(t('resetPassword.passwordTooShort'));
            return;
        }

        setLoading(true);
        try {
            await apiService.post('/user/password-reset/confirm', { token, new_password: password });
            setMessage(t('resetPassword.passwordResetSuccess'));
            setTimeout(() => {
                navigate('/signin'); // Redirect to sign-in page
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.detail || t('resetPassword.passwordResetFailed'));
        } finally {
            setLoading(false);
        }
    };    return (
        <div className="min-h-screen flex items-center justify-center p-6 animate-fadeIn">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">{t('resetPassword.title')}</h2>
                {!token ? (
                    <div className="text-center">
                        <p className="text-red-500 mb-4">{t('resetPassword.invalidOrMissingToken')}</p>
                        <Link 
                            to="/forgot-password" 
                            className="block w-full bg-primary dark:bg-accent text-white text-center py-2 px-4 rounded-md hover:bg-primary/90 dark:hover:bg-accent/80 transition duration-200"
                        >
                            {t('resetPassword.requestNewLink')}
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6 animate-slideInFromBottom">
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('resetPassword.newPassword')}
                            </label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary dark:focus:ring-accent focus:border-primary dark:focus:border-accent dark:bg-gray-700 dark:text-white"
                            />
                            
                            {/* Password strength indicator */}
                            {password && (
                                <div className="mt-2">
                                    <div className="flex justify-between mb-1">
                                        <span className="text-xs text-gray-600 dark:text-gray-400">{t('resetPassword.passwordStrength')}</span>
                                        <span className="text-xs font-semibold">
                                            {passwordStrength === 0 && t('resetPassword.veryWeak')}
                                            {passwordStrength === 1 && t('resetPassword.weak')}
                                            {passwordStrength === 2 && t('resetPassword.fair')}
                                            {passwordStrength === 3 && t('resetPassword.good')}
                                            {passwordStrength >= 4 && t('resetPassword.strong')}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                                        <div 
                                            className={`h-1.5 rounded-full ${
                                                passwordStrength <= 1 ? 'bg-red-500' : 
                                                passwordStrength === 2 ? 'bg-yellow-500' : 
                                                passwordStrength === 3 ? 'bg-blue-500' : 'bg-green-500'
                                            }`} 
                                            style={{ width: `${Math.max(5, passwordStrength * 20)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {t('resetPassword.confirmNewPassword')}
                            </label>
                            <input
                                type="password"
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary dark:focus:ring-accent focus:border-primary dark:focus:border-accent dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        {message && (
                            <div className="text-green-500 p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-900">
                                <p className="text-sm font-medium">{message}</p>
                            </div>
                        )}
                        
                        <button 
                            type="submit" 
                            disabled={loading} 
                            className="w-full bg-primary dark:bg-accent text-white py-2 px-4 rounded-md hover:bg-primary/90 dark:hover:bg-accent/80 transition duration-200 flex items-center justify-center"
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {t('resetPassword.resetting')}
                                </>
                            ) : (
                                t('resetPassword.resetPasswordButton')
                            )}
                        </button>
                    </form>
                )}
                
                <div className="mt-6 text-center">
                    <Link to="/signin" className="text-primary dark:text-accent hover:underline text-sm">
                        {t('resetPassword.backToSignIn')}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
