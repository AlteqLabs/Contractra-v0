import React, { useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { ContractraLogo } from './icons';
import { supabase } from '../lib/supabaseClient';
import ContractUploadPage from './ContractUploadPage';

interface DashboardPageProps {
    session: Session;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ session }) => {
    const [activeView, setActiveView] = useState('upload');

    const handleLogout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Error signing out:', error);
        }
    };

    const navItems = [
        { id: 'dashboard', label: 'Dashboard' },
        { id: 'upload', label: 'Contract Upload' },
    ];

    return (
        <div className="flex flex-col min-h-screen bg-cream">
            <header className="flex items-center justify-between w-full px-4 sm:px-6 lg:px-8 py-4 bg-surface border-b border-gray-200/80 sticky top-0 z-10">
                <ContractraLogo iconClassName="text-charcoal" textClassName="text-charcoal" />
                <div className="flex items-center space-x-4">
                    <span className="text-sm text-gray-600 hidden sm:block" aria-label="User email">
                        {session.user.email}
                    </span>
                    <button
                        onClick={handleLogout}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-mustard transition-colors"
                    >
                        Logout
                    </button>
                </div>
            </header>

            <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                 <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveView(item.id)}
                                className={`${
                                    activeView === item.id
                                        ? 'border-mustard text-charcoal'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors focus:outline-none`}
                                aria-current={activeView === item.id ? 'page' : undefined}
                            >
                                {item.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <main className="py-10">
                   {activeView === 'dashboard' && (
                        <div>
                            <h1 className="text-3xl font-bold text-charcoal tracking-tight">Dashboard</h1>
                            <div className="mt-8 p-10 bg-surface border border-gray-200/80 rounded-2xl shadow-sm">
                                <h2 className="text-2xl font-semibold text-charcoal">Welcome to your Dashboard</h2>
                                <p className="mt-2 text-gray-500">
                                    You have successfully logged in. This area is now ready for your amazing content.
                                </p>
                                <div className="mt-6 p-4 bg-cream rounded-xl">
                                    <p className="text-sm text-charcoal font-medium">Authentication Details</p>
                                    <p className="mt-1 text-xs text-gray-500">
                                        This dashboard is connected to a real authentication session provided by Supabase. Your user information is securely handled.
                                    </p>
                                </div>
                            </div>
                        </div>
                   )}
                   {activeView === 'upload' && <ContractUploadPage />}
                </main>
            </div>
            
            <footer className="py-6 text-center text-sm text-gray-500">
                © {new Date().getFullYear()} Crextio. All rights reserved.
            </footer>
        </div>
    );
};

export default DashboardPage;