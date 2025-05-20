import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
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
    };

    return (
        <div className="container mx-auto p-4 max-w-md">
            <h2 className="text-2xl font-bold mb-4 text-center">{t('resetPassword.title')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="password">{t('resetPassword.newPassword')}</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full p-2 border rounded"
                    />
                </div>
                <div>
                    <label htmlFor="confirmPassword">{t('resetPassword.confirmNewPassword')}</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="w-full p-2 border rounded"
                    />
                </div>
                {error && <p className="text-red-500">{error}</p>}
                {message && <p className="text-green-500">{message}</p>}
                <button type="submit" disabled={loading} className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-gray-400">
                    {loading ? t('resetPassword.resetting') : t('resetPassword.resetPasswordButton')}
                </button>
            </form>
        </div>
    );
};

export default ResetPassword;
