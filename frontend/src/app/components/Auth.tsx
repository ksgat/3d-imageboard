'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/util/supabase/supabase';
import type { Session, User } from '@supabase/supabase-js';

export default function Page() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener?.subscription.unsubscribe();
  }, []);

  if (loading)
    return (
      <div
        className="min-h-screen bg-black text-white flex items-center justify-center text-lg"
        style={{ fontFamily: '"Times New Roman", Times, serif' }}
      >
        Loading...
      </div>
    );

  if (!session) return <AuthForm />;

  return <Dashboard user={session.user} />;
}

function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <div
      className="min-h-screen bg-black text-white flex items-center justify-center p-5"
      style={{ fontFamily: '"Times New Roman", Times, serif' }}
    >
      <div className="max-w-sm w-full flex flex-col gap-5 bg-black p-6 border border-white rounded-md">
        {isSignUp ? (
          <SignUpForm setIsSignUp={setIsSignUp} error={error} setError={setError} loading={loading} setLoading={setLoading} />
        ) : (
          <SignInForm setIsSignUp={setIsSignUp} error={error} setError={setError} loading={loading} setLoading={setLoading} />
        )}
      </div>
    </div>
  );
}

function SignInForm({
  setIsSignUp,
  error,
  setError,
  loading,
  setLoading
}: {
  setIsSignUp: (v: boolean) => void;
  error: string | null;
  setError: (msg: string | null) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const signIn = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <>
      <h2 className="text-2xl italic">Log in</h2>
      <h1><em>welcome back</em></h1>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
        className="bg-black text-white p-2.5 border border-white"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
        className="bg-black text-white p-2.5 border border-white"
      />
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

      <button onClick={signIn} disabled={loading} className="border border-white py-2.5">
        Sign In
      </button>

      <button onClick={() => setIsSignUp(true)} disabled={loading} className="text-sm underline text-center">
        Don't have an account? Sign up
      </button>
    </>
  );
}

function SignUpForm({
  setIsSignUp,
  error,
  setError,
  loading,
  setLoading
}: {
  setIsSignUp: (v: boolean) => void;
  error: string | null;
  setError: (msg: string | null) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState(''); // example additional field

  const signUp = async () => {
    setLoading(true);
    setError(null);
  
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      setLoading(false);
      return;
    }
  
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
  
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
  
    if (data.user) {
      // Insert profile for the new user
      const { error: profileError } = await supabase
        .from("profile")
        .insert([
          {
            id: data.user.id,       // important: link profile to auth user id
            username: username,
            // add other default profile fields here if you want
          },
        ]);
  
      if (profileError) {
        setError(`Failed to create profile: ${profileError.message}`);
      }
    }
  
    setLoading(false);
  };
  

  return (
    <>
      <h2 className="text-2xl italic">Sign up</h2>
      <h1><em>create your account</em></h1>

      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        disabled={loading}
        className="bg-black text-white p-2.5 border border-white"
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={loading}
        className="bg-black text-white p-2.5 border border-white"
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={loading}
        className="bg-black text-white p-2.5 border border-white"
      />
      <input
        type="password"
        placeholder="Confirm Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        disabled={loading}
        className="bg-black text-white p-2.5 border border-white"
      />
      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

      <button onClick={signUp} disabled={loading} className="border border-white py-2.5">
        Create Account
      </button>

      <button onClick={() => setIsSignUp(false)} disabled={loading} className="text-sm underline text-center">
        Already have an account? Log in
      </button>
    </>
  );
}


interface DashboardProps {
  user: User | null;
}

function Dashboard({ user }: DashboardProps) {
  const signOut = async () => {
    await supabase.auth.signOut();
  };

  if (!user) return null;

  return (
    <div
      className="min-h-screen bg-black text-white flex items-center justify-center p-5"
      style={{ fontFamily: '"Times New Roman", Times, serif' }}
    >
      <div className="max-w-sm w-full flex flex-col gap-5 items-center bg-black p-6 border border-white rounded-md">
        <h1 className="text-xl text-center">Welcome, {user.email}</h1>
        <button
          onClick={signOut}
          className="bg-black text-white text-base px-5 py-2.5 border border-white cursor-pointer"
          style={{ fontFamily: '"Times New Roman", Times, serif' }}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
