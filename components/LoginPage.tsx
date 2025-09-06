import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ContractraIcon, GoogleIcon } from './icons';

type ViewType = 'sign_in' | 'sign_up' | 'forgot_password';

const LoginPage: React.FC = () => {
    const [view, setView] = useState<ViewType>('sign_in');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleOAuthSignIn = async (provider: 'google') => {
        setIsLoading(true);
        const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: { redirectTo: window.location.origin },
        });
        if (error) {
            setError(error.message);
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setIsLoading(true);

        if (view === 'sign_up' && password !== confirmPassword) {
            setError("Passwords do not match.");
            setIsLoading(false);
            return;
        }

        try {
            let authError = null;
            if (view === 'sign_in') {
                ({ error: authError } = await supabase.auth.signInWithPassword({ email, password }));
            } else if (view === 'sign_up') {
                ({ error: authError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { data: { full_name: name } },
                }));
                if (!authError) setMessage('Success! Please check your email for a verification link.');
            } else if (view === 'forgot_password') {
                ({ error: authError } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: window.location.origin,
                }));
                 if (!authError) setMessage('Success! Please check your email for a password reset link.');
            }
            if (authError) throw authError;
        } catch (error: any) {
            setError(error.error_description || error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const renderForm = () => {
        const commonFields = {
            email: (
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
                    <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                        className="mt-1 block w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mustard"
                        placeholder="alex.jordan@gmail.com" />
                </div>
            ),
            password: (
                <div>
                    <label htmlFor="password-input" className="block text-sm font-medium text-gray-700">Password</label>
                    <input id="password-input" name="password" type="password" autoComplete={view === 'sign_in' ? "current-password" : "new-password"} required
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        className="mt-1 block w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mustard"
                        placeholder="••••••••" />
                </div>
            ),
        };

        const googleButtonText = view === 'sign_up' ? "Sign up with Google" : "Continue with Google";

        const googleAuthButton = (
            <>
                <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center" aria-hidden="true"><div className="w-full border-t border-gray-200" /></div>
                    <div className="relative flex justify-center text-sm"><span className="px-2 bg-surface text-gray-500">OR</span></div>
                </div>
                <button type="button" onClick={() => handleOAuthSignIn('google')}
                    className="w-full flex justify-center items-center py-3 px-4 border border-gray-200 rounded-xl shadow-sm bg-white text-sm font-semibold text-charcoal hover:bg-gray-50 transition duration-300">
                    <GoogleIcon className="w-5 h-5 mr-3" /> {googleButtonText}
                </button>
            </>
        );

        switch (view) {
            case 'sign_up': return {
                title: 'Create your account',
                subtitle: 'Join and start designing with ease.',
                buttonText: 'Create account',
                fields: <>
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                        <input id="name" name="name" type="text" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)}
                            className="mt-1 block w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mustard"
                            placeholder="Alex Jordan" />
                    </div>
                    {commonFields.email}
                    {commonFields.password}
                    <div>
                        <label htmlFor="confirm-password">Confirm password</label>
                        <input id="confirm-password" name="confirm-password" type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                            className="mt-1 block w-full px-4 py-3 bg-white border border-gray-200 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-mustard"
                            placeholder="••••••••" />
                    </div>
                </>,
                footer: <p className="text-sm text-center text-gray-500">Have an account? <button type="button" onClick={() => setView('sign_in')} className="font-semibold text-charcoal hover:underline">Log in</button></p>,
                googleButton: googleAuthButton,
            };
            case 'forgot_password': return {
                title: 'Reset your password',
                subtitle: "We'll email you instructions to reset it.",
                buttonText: 'Send Reset Link',
                fields: <>{commonFields.email}</>,
                footer: <p className="text-sm text-center text-gray-500">Remembered your password? <button type="button" onClick={() => setView('sign_in')} className="font-semibold text-charcoal hover:underline">Sign In</button></p>,
                googleButton: null,
            };
            case 'sign_in': default: return {
                title: 'Welcome back',
                subtitle: 'Build your design system effortlessly.',
                buttonText: 'Log in',
                fields: <>
                    {commonFields.email}
                    {commonFields.password}
                    <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center">
                            <label htmlFor="remember-me-toggle" className="text-sm text-gray-900 mr-3 cursor-pointer">Remember me</label>
                            <button type="button" onClick={() => setRememberMe(!rememberMe)}
                                className={`${rememberMe ? 'bg-mustard' : 'bg-gray-200'} relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mustard`}
                                aria-pressed={rememberMe} id="remember-me-toggle">
                                <span aria-hidden="true" className={`${rememberMe ? 'translate-x-5' : 'translate-x-0'} pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`} />
                            </button>
                        </div>
                        <button type="button" onClick={() => setView('forgot_password')} className="text-sm font-medium text-gray-600 hover:text-charcoal hover:underline">Forgot password?</button>
                    </div>
                </>,
                footer: <p className="text-sm text-center text-gray-500">Don't have an account? <button type="button" onClick={() => setView('sign_up')} className="font-semibold text-charcoal hover:underline">Sign up</button></p>,
                googleButton: googleAuthButton,
            };
        }
    };

    const { title, subtitle, buttonText, fields, footer, googleButton } = renderForm();

    return (
        <div className="flex items-center justify-center min-h-screen bg-cream p-4">
            <div className="w-full max-w-5xl bg-surface rounded-3xl shadow-2xl md:grid md:grid-cols-2 overflow-hidden">
                <div className="hidden md:block relative">
                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1556761175-5973dc0f32e7?q=80&w=1935&auto=format&fit=crop')" }}></div>
                    <div className="absolute inset-0 bg-charcoal bg-opacity-30"></div>
                    <div className="relative p-12 flex flex-col justify-between h-full text-white">
                        <ContractraIcon className="w-9 h-9" />
                        <div>
                            <p className="text-3xl font-bold leading-tight">"Simply all the tools that my team and I need."</p>
                            <div className="mt-6">
                                <p className="font-semibold">Karen Yue</p>
                                <p className="text-sm text-gray-200">Director of Digital Marketing Technology</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-12 md:p-16 flex flex-col justify-center">
                    <div>
                        <h1 className="text-4xl font-bold text-charcoal">{title}</h1>
                        <p className="mt-3 text-gray-500">{subtitle}</p>
                    </div>
                    <div className="mt-8">
                        {error && <p className="mb-4 p-3 text-center text-sm text-red-800 bg-red-100 rounded-xl">{error}</p>}
                        {message && <p className="mb-4 p-3 text-center text-sm text-green-800 bg-green-100 rounded-xl">{message}</p>}
                        <form onSubmit={handleSubmit} noValidate>
                            <div className="space-y-6">{fields}</div>
                            <div className="mt-8">
                                <button type="submit" disabled={isLoading}
                                    className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-base font-semibold text-charcoal bg-mustard hover:bg-mustard/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mustard disabled:bg-amber-300 disabled:cursor-not-allowed transition-all duration-300">
                                    {isLoading ? 'Processing...' : buttonText}
                                </button>
                            </div>
                        </form>
                        {googleButton}
                        {footer && <div className="mt-8">{footer}</div>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;