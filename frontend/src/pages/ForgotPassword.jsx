import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../lib/apiService';
import { useTranslation } from 'react-i18next';
import { validateEmail } from '../lib/authUtils';
import { Helmet } from 'react-helmet';

const ForgotPassword = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');
        
        if (!validateEmail(email)) {
            setError(t('forgotPassword.invalidEmail'));
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await apiService.post('/user/password-reset/request', { email });
            
            if (error) {
                throw new Error(error);
            }
            
            setIsSubmitted(true);
            setMessage(t('forgotPassword.resetLinkSent'));
        } catch (err) {
            // Even if the email is not found, show success message for security reasons
            setIsSubmitted(true);
            setMessage(t('forgotPassword.resetLinkSent'));
            console.error('Password reset request error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 animate-fadeIn">
            <Helmet>
                <title>{t('forgotPassword.title')} - MonkeyZ</title>
                <meta name="description" content={t('forgotPassword.metaDescription')} />
            </Helmet>
            
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-200 dark:border-gray-700">
                <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-6">
                    {t('forgotPassword.title')}
                </h1>

                {isSubmitted ? (
                    <div className="text-center animate-slideInFromBottom">
                        <div className="text-green-500 mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-lg font-medium">{message}</p>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">{t('forgotPassword.checkEmail')}</p>
                        <Link 
                            to="/signin" 
                            className="block w-full bg-primary dark:bg-accent text-white text-center py-2 px-4 rounded-md hover:bg-primary/90 dark:hover:bg-accent/80 transition duration-200"
                        >
                            {t('forgotPassword.backToSignIn')}
                        </Link>
                    </div>
                ) : (
                    <>
                        <p className="text-gray-600 dark:text-gray-300 mb-6">
                            {t('forgotPassword.instructions')}
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {t('email')}
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-primary dark:focus:ring-accent focus:border-primary dark:focus:border-accent dark:bg-gray-700 dark:text-white"
                                    placeholder={t('email')}
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            {error && <p className="text-red-500 text-sm">{error}</p>}
                            {message && <p className="text-green-500 text-sm">{message}</p>}

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-primary dark:bg-accent text-white py-2 px-4 rounded-md hover:bg-primary/90 dark:hover:bg-accent/80 transition duration-200 flex items-center justify-center"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {t('forgotPassword.processing')}
                                    </>
                                ) : (
                                    t('forgotPassword.sendResetLink')
                                )}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <Link to="/signin" className="text-primary dark:text-accent hover:underline">
                                {t('forgotPassword.backToSignIn')}
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ForgotPassword;
