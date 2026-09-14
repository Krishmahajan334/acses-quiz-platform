'use client';
import { useEffect } from 'react';

export function AdminFetchPatcher() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      let [resource, config] = args;
      
      // Only patch /api/admin requests
      if (typeof resource === 'string' && resource.startsWith('/api/admin')) {
        config = config || {};
        const token = localStorage.getItem('admin_token_override');
        
        if (token) {
          const headers = new Headers(config.headers || {});
          if (!headers.has('Authorization')) {
            headers.set('Authorization', `Bearer ${token}`);
          }
          config.headers = headers;
        }
        
        // Ensure credentials are sent
        if (!config.credentials) {
          config.credentials = 'same-origin';
        }
      }
      
      return originalFetch(resource, config);
    };
    
    return () => {
      window.fetch = originalFetch; // Restore on unmount
    };
  }, []);
  
  return null;
}
