'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/util/supabase/supabase';
import type { Session } from '@supabase/supabase-js';

import ResizableLayout from './components/Board';
import Auth from './components/Auth';

type TabType = 'board' | 'profile' | 'settings' | 'signin';

export default function Page() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('board');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      // If user signs in while on sign in tab, switch to board
      if (session && activeTab === 'signin') {
        setActiveTab('board');
      }
    });

    return () => listener?.subscription.unsubscribe();
  }, [activeTab]);

  const user = session?.user;

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setActiveTab('signin');
  };

  const handleTabClick = (tab: TabType) => {
    // Don't allow switching to signin tab if user is already signed in
    if (tab === 'signin' && user) return;
    setActiveTab(tab);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center text-lg font-serif">
        Loading...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white font-serif flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white">
        <div className="text-2xl">Your Forum</div>
        <div className="flex items-center space-x-4">
          {/* Custom Tab Navigation */}
          <nav className="flex space-x-4">
            <button
              onClick={() => handleTabClick('board')}
              className={tabClass(activeTab === 'board')}
            >
              Board
            </button>
            <button
              onClick={() => handleTabClick('profile')}
              className={tabClass(activeTab === 'profile')}
            >
              Profile
            </button>
            <button
              onClick={() => handleTabClick('settings')}
              className={tabClass(activeTab === 'settings')}
            >
              Settings
            </button>
            {!user && (
              <button
                onClick={() => handleTabClick('signin')}
                className={tabClass(activeTab === 'signin')}
              >
                Sign In
              </button>
            )}
          </nav>

          {user && (
            <button
              onClick={signOut}
              className="text-red-500 bg-transparent border-none text-sm hover:underline"
            >
              Sign Out
            </button>
          )}
        </div>
      </header>

      {/* Welcome */}
      {user && (
        <div className="w-full flex justify-end px-6 py-2 text-sm text-gray-300 border-b border-white">
          user: <span className="text-white ml-1">{user.email}</span>
        </div>
      )}

      {/* Tab Content */}
      <div className="flex-1">
        {activeTab === 'board' && (
          <div key="board">
            <ResizableLayout />
          </div>
        )}
        
        {activeTab === 'profile' && (
          <div key="profile" className="p-6">
            Profile content coming soon...
          </div>
        )}
        
        {activeTab === 'settings' && (
          <div key="settings" className="p-6">
            Settings content coming soon...
          </div>
        )}
        
        {activeTab === 'signin' && !user && (
          <div key="signin" className="p-6">
            <Auth />
          </div>
        )}
      </div>
    </main>
  );
}

function tabClass(isActive: boolean) {
  return `px-3 py-1 border-b-2 text-sm cursor-pointer bg-transparent ${
    isActive ? 'border-white text-white' : 'border-transparent text-gray-400 hover:text-white'
  } transition`;
}

