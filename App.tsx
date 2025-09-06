import React, { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, supabaseError } from './lib/supabaseClient';
import LoginPage from './components/LoginPage';
import DashboardPage from './components/DashboardPage';
import { ContractraLogo } from './components/icons';

const App: React.FC = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    // Handle missing Supabase configuration gracefully
    if (supabaseError) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-cream p-4">
                <div className="w-full max-w-lg p-8 space-y-6 text-center bg-surface rounded-2xl shadow-xl">
                    <div className="flex justify-center mb-4">
                        <ContractraLogo iconClassName="text-charcoal" />
                    </div>
                    <h2 className="text-xl font-semibold text-red-600">Application Configuration Error</h2>
                    <div className="p-4 text-left text-sm text-red-800 bg-red-100 rounded-md">
                        <p className="font-bold">Error Details:</p>
                        <p>{supabaseError}</p>
                    </div>
                    <p className="text-sm text-gray-500">
                        This application requires a connection to a Supabase backend. Please ensure the necessary environment variables are correctly configured by the application host.
                    </p>
                </div>
            </div>
        );
    }

    useEffect(() => {
        setLoading(true);
        
        // onAuthStateChange is called right away with the current session, so we don't need getSession()
        const { data: { subscription } } = supabase!.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-cream">
                <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-mustard"></div>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen antialiased">
            {session && session.user ? (
                <DashboardPage session={session} />
            ) : (
                <LoginPage />
            )}
        </div>
    );
};

export default App;