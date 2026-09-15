'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Clear any existing token on mount
  useState(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token_override');
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.token) {
          localStorage.setItem('admin_token_override', data.token);
        }
        setIsLoading(false); // Force loading state to clear before routing
        window.location.href = '/admin';
      } else {
        const data = await res.json();
        setError(data.error || 'Login failed - Incorrect Password');
        setIsLoading(false);
      }
    } catch (err: any) {
      console.error("Login fetch error:", err);
      setError('Network error: Could not reach the server');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-700">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white tracking-tight">Admin Portal</h2>
          <p className="text-gray-400 mt-2 text-sm">Restricted Access Only</p>
        </div>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-white placeholder:text-gray-400 transition-all outline-none"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-key-round"><path d="M2 18v3c0 .6.4 1 1 1h4v-3h3v-3h2l1.4-1.4a6.5 6.5 0 1 0-4-4Z"/><circle cx="16.5" cy="7.5" r=".5"/></svg>
              </div>
              <input
                type="password"
                required
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-white placeholder:text-gray-400 transition-all outline-none"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter master password..."
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
          >
            {isLoading ? 'Verifying...' : 'Access Dashboard'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-700 flex flex-col items-center justify-center gap-2">
          <div className="flex flex-wrap items-center justify-center gap-2 text-[10px] text-gray-500 text-center">
            <span className="font-semibold text-gray-400">Designed & developed by Sorin Tech Lab</span>
            <span>a unit of</span>
            <Link 
              href="https://krishmahajan.dev" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 hover:text-primary transition-colors group"
            >
              <span className="font-semibold underline decoration-transparent group-hover:decoration-primary underline-offset-2 transition-all">Krish Tech Labs</span>
              <Image 
                src="/watermark_logo_light.png" 
                alt="Krish Techlabs Logo" 
                width={20} 
                height={20} 
                className="object-contain opacity-70 group-hover:opacity-100 transition-opacity"
              />
            </Link>
          </div>
          <p className="text-[10px] text-gray-600">
            This platform is the property of Sorin Tech Lab.
          </p>
        </div>
      </div>
    </div>
  );
}
