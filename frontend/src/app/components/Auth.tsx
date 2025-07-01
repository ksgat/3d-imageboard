'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/util/supabase/supabase';
import { login, signup } from '../auth/actions';
import type { Session, User } from '@supabase/supabase-js';

export default function Auth() {
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      
      await login(formData);
      // If we reach here, login was successful and redirect should happen
    } catch (err) {
      setError('Sign in failed. Please check your credentials.');
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      formData.append('username', username);
      
      await signup(formData);
      // If we reach here, signup was successful and redirect should happen
    } catch (err) {
      setError('Sign up failed. Please try again.');
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email first');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    if (error) {
      setError(error.message);
    } else {
      setError('Password reset email sent! Check your inbox.');
    }
    setLoading(false);
  };

  return (
    <div
      className="min-h-screen bg-black text-white flex items-center justify-center p-5"
      style={{ fontFamily: '"Times New Roman", Times, serif' }}
    >
      <div className="max-w-sm w-full flex flex-col gap-5 bg-black p-6 border border-white rounded-md">
        <h2 className="text-2xl text-left mb-[-5px] italic">
          <em>{mode === 'signin' ? 'Log in' : 'Sign up'}</em>
        </h2>
        <h1>
          <em>{mode === 'signin' ? 'welcome back' : 'join us'}</em>
        </h1>
        
        <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="flex flex-col gap-5">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
            required
            className="bg-black text-white text-base p-2.5 border border-white outline-none"
            style={{ fontFamily: '"Times New Roman", Times, serif' }}
          />
          
          {mode === 'signup' && (
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              required
              className="bg-black text-white text-base p-2.5 border border-white outline-none"
              style={{ fontFamily: '"Times New Roman", Times, serif' }}
            />
          )}
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            required
            className="bg-black text-white text-base p-2.5 border border-white outline-none"
            style={{ fontFamily: '"Times New Roman", Times, serif' }}
          />
          
          {error && <p className="text-red-500 text-sm text-center m-0">{error}</p>}
          
          <div className="flex gap-5 justify-center">
            <button
              type="submit"
              disabled={loading}
              className={`text-white text-base px-5 py-2.5 border border-white ${
                loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-black cursor-pointer'
              }`}
              style={{ fontFamily: '"Times New Roman", Times, serif' }}
            >
              {loading ? 'Loading...' : (mode === 'signin' ? 'Sign In' : 'Sign Up')}
            </button>
          </div>
        </form>
        
        <button
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin');
            setError(null);
          }}
          disabled={loading}
          className={`text-white text-base px-5 py-2.5 ${
            loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-black cursor-pointer'
          }`}
          style={{ fontFamily: '"Times New Roman", Times, serif' }}
        >
          {mode === 'signin' ? "don't have an account? Sign Up!" : "already have an account? Sign In!"}
        </button>
        
        {mode === 'signin' && (
          <button
            onClick={handleForgotPassword}
            disabled={loading}
            className={`text-white text-base px-5 py-2.5 ${
              loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-black cursor-pointer'
            }`}
            style={{ fontFamily: '"Times New Roman", Times, serif' }}
          >
            forgor password?
          </button>
        )}
      </div>
    </div>
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
