'use client';

import Link from 'next/link';
import { Gamepad2, Lock } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginWithGoogle } from '@/firebase';

export default function AdminLogin() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setIsLoading(true);
    setError('');
    try {
      await loginWithGoogle();
      router.push('/admin/dashboard');
    } catch (err: any) {
      console.error(err);
      setError('Inloggen mislukt. Zorg dat je een admin account gebruikt.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0a0514] p-6">
      {/* Background Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
      
      <div className="relative w-full max-w-md">
        <div className="bg-[#110a24]/80 backdrop-blur-md border border-purple-500/20 rounded-[2rem] p-8 md:p-12 shadow-2xl">
          
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20 mb-6">
              <Gamepad2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="font-heading text-3xl font-bold text-white mb-2">Admin Portal</h1>
            <p className="text-sm text-purple-200/60">Log in met je Google account om het dashboard te beheren</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20 text-center">
              {error}
            </div>
          )}

          {/* Login Button */}
          <button 
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 text-white font-medium rounded-xl px-4 py-4 shadow-lg shadow-purple-500/25 transition-all duration-300 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Lock className="w-4 h-4" />
            {isLoading ? 'BEZIG...' : 'INLOGGEN MET GOOGLE'}
          </button>

          {/* Footer Link */}
          <div className="mt-8 text-center">
            <Link 
              href="/" 
              className="text-xs text-purple-200/40 hover:text-purple-200/80 transition-colors flex items-center justify-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Terug naar home
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}
