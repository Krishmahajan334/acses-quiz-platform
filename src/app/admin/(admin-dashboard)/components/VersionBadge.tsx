'use client';

import { useState } from 'react';
import { Info, X, GitCommit, GitBranch, Clock } from 'lucide-react';

interface VersionBadgeProps {
  sha?: string;
  message?: string;
  author?: string;
  branch?: string;
}

export function VersionBadge({ sha, message, author, branch }: VersionBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  // Display fallback if not deployed on Vercel
  const shortSha = sha ? sha.substring(0, 7) : 'local';
  
  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="ml-auto inline-flex items-center gap-1.5 px-2 py-1 bg-secondary/50 hover:bg-primary/20 border border-border hover:border-primary/30 rounded text-[10px] font-mono text-muted-foreground hover:text-primary transition-colors cursor-pointer"
        title="View deployment details"
      >
        <GitCommit className="w-3 h-3" />
        v-{shortSha}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border flex items-center justify-between bg-secondary/30">
              <h3 className="font-bold uppercase tracking-widest text-sm flex items-center gap-2">
                <Info className="w-4 h-4 text-primary" />
                Deployment Details
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 space-y-4 text-sm">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Environment</span>
                <span className="font-medium">{sha ? 'Production (Vercel)' : 'Local Development'}</span>
              </div>
              
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <GitCommit className="w-3 h-3" /> Commit SHA
                </span>
                <span className="font-mono bg-secondary px-2 py-1 rounded text-xs break-all">
                  {sha || 'N/A'}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <GitBranch className="w-3 h-3" /> Branch
                </span>
                <span className="font-medium">{branch || 'N/A'}</span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Commit Message</span>
                <span className="font-medium text-foreground/80 italic">{message || 'N/A'}</span>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Author</span>
                <span className="font-medium">{author || 'N/A'}</span>
              </div>
            </div>
            
            <div className="p-4 bg-secondary/50 border-t border-border flex justify-end">
              <button 
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest rounded transition-all hover:brightness-110 active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
