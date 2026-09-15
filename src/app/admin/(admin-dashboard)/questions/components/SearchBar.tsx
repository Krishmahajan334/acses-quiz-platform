'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SearchBar({ initialQuery = '' }: { initialQuery?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/admin/questions?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push(`/admin/questions`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex">
      <input 
        type="text" 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search questions..." 
        className="px-4 py-2 bg-white border border-gray-300 rounded-l-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 w-48 md:w-64"
      />
      <button type="submit" className="bg-gray-100 hover:bg-gray-200 border border-l-0 border-gray-300 px-3 py-2 rounded-r-lg text-gray-600 transition">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
      </button>
    </form>
  );
}
