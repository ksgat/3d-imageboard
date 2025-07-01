'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/util/supabase/supabase';
import type { Session } from '@supabase/supabase-js';
import Link from 'next/link';

export default function ForumLayout({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(prev =>
        prev?.access_token === data.session?.access_token ? prev : data.session
      );
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(prev =>
        prev?.access_token === session?.access_token ? prev : session
      );
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white bg-black">
        Loading...
      </div>
    );
  }

  return (
    <>
      <header className="flex items-center justify-between px-6 py-4 border-b border-white">
      <nav className="flex space-x-4">
  <Link href="/" className={tabClass()}>Main</Link>
  <Link href="/board" className={tabClass()}>Board</Link>
  <Link href="/profile" className={tabClass()}>Profile</Link>
  <Link href="/settings" className={tabClass()}>Settings</Link>
  {!user && <Link href="/signin" className={tabClass()}>Sign In</Link>}
</nav>

        {user && (
          <button onClick={signOut} className="text-red-500 text-sm hover:underline">
            Sign Out
          </button>
        )}
      </header>

      {user && (
        <div className="w-full flex justify-end px-6 py-2 text-sm text-gray-300 border-b border-white">
          user: <span className="text-white ml-1">{user.email}</span>
        </div>
      )}

      <main className="flex-1">{children}</main>
    </>
  );
}

function tabClass() {
  return `px-3 py-1 border-b-2 text-sm cursor-pointer bg-transparent text-gray-400 hover:text-white transition`;
}
