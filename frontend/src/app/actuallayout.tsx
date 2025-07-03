'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/util/supabase/supabase';
import type { Session } from '@supabase/supabase-js';
import Auth from '@/app/components/Auth';
export default function Shell({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const pathname = usePathname();
  const [username, setUsername] = useState<string | null>(null);



  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session);
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_events, session) => {
      setSession(prev =>
        prev?.access_token === session?.access_token ? prev : session
      );

      if (session) {
        setShowAuthModal(false);
      } 
    });

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  const user = session?.user;


  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const openAuthModal = () => {
    setShowAuthModal(true);
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
  };

  useEffect(() => {
    if (!user) return;
  
    const fetchUsername = async () => {
      console.log('Fetching username for user:', user.id);
      const { data, error } = await supabase
        .from('profile')
        .select('username')
        .eq('id', user.id)
        .single();
  
      console.log('Username fetch result:', data, error);
      if (error) {
        console.error('Failed to fetch username:', error.message);
        setUsername(null);
      } else {
        setUsername(data?.username ?? null);
      }
    };
  
    fetchUsername();
  }, [user]);
  
  return (
    <div 
      className="min-h-screen bg-black text-white"
      style={{ fontFamily: '"Times New Roman", Times, serif' }}
    >
      <header className="flex items-center justify-between px-6 py-4 border-b border-white">
        <div className="text-2xl">Your Forum</div>
        <nav className="flex space-x-4">
  <Tab href="/" label="Main" active={pathname === '/'} />
  <Tab href="/board" label="Board" active={pathname.startsWith('/board')} />
  {user && (
    <>
      <Tab href={`/profile/${username}`} label="Profile" active={pathname.startsWith('/profile')} />
      <Tab href="/settings" label="Settings" active={pathname.startsWith('/settings')} />
    </>
  )}
  {!user && (
    <button 
      onClick={openAuthModal}
      className="px-3 py-1 border-b-2 text-sm cursor-pointer bg-transparent border-transparent text-gray-400 hover:text-white transition"
    >
      Sign In
    </button>
  )}
</nav>
        {user && (
          <button onClick={signOut} className="text-red-500 text-sm hover:underline">
            Sign Out
          </button>
        )}
      </header>

      {user && (
        <div className="w-full flex justify-end px-6 py-2 text-sm text-gray-300 border-b border-white">
          user: <span className="text-white ml-1">{username ?? "loading.."}</span>
        </div>
      )}

      <main className="flex-1">
        {loading ? (
          <div className="flex items-center justify-center min-h-screen">Loading...</div>
        ) : (
          children
        )}
      </main>

      {/* Auth Modal using your component */}
      {showAuthModal && (
        <AuthModalOverlay onClose={closeAuthModal} />
      )}
    </div>
  );
}

function Tab({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`px-3 py-1 border-b-2 text-sm cursor-pointer bg-transparent ${
        active ? 'border-white text-white' : 'border-transparent text-gray-400 hover:text-white'
      } transition`}
    >
      {label}
    </Link>
  );
}

function AuthModalOverlay({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="relative">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 text-gray-400 hover:text-white text-xl w-8 h-8 flex items-center justify-center"
        >
          ×
        </button>
        
        {/* Your Auth component */}
        <Auth/>
      </div>
    </div>
  );
}