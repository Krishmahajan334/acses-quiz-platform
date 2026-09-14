'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, AlertCircle } from 'lucide-react';

type YearConfig = {
  id?: string;
  year: string;
  easyCount: number;
  mediumCount: number;
  hardCount: number;
  excludedTopics: string; // comma separated
};

type EventSettingsClientProps = {
  activeEvent: {
    id: string;
    questionCount: number;
    yearConfigs: any[];
  };
  allTopics: string[];
};

const YEARS = ['FY', 'SY', 'TY', 'LY'];

export default function EventSettingsClient({ activeEvent, allTopics }: EventSettingsClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('FY');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Initialize configs state
  const [configs, setConfigs] = useState<Record<string, YearConfig>>(() => {
    const state: Record<string, YearConfig> = {};
    YEARS.forEach(y => {
      const existing = activeEvent.yearConfigs.find(c => c.year === y);
      if (existing) {
        state[y] = {
          id: existing.id,
          year: y,
          easyCount: existing.easyCount,
          mediumCount: existing.mediumCount,
          hardCount: existing.hardCount,
          excludedTopics: existing.excludedTopics || ''
        };
      } else {
        // Defaults
        state[y] = {
          year: y,
          easyCount: 2,
          mediumCount: 2,
          hardCount: 1,
          excludedTopics: ''
        };
      }
    });
    return state;
  });

  const handleConfigChange = (year: string, field: keyof YearConfig, value: any) => {
    setConfigs(prev => ({
      ...prev,
      [year]: {
        ...prev[year],
        [field]: value
      }
    }));
  };

  const handleTopicToggle = (year: string, topic: string) => {
    const config = configs[year];
    const excludedList = config.excludedTopics ? config.excludedTopics.split(',').filter(Boolean) : [];
    
    let newExcluded;
    if (excludedList.includes(topic)) {
      // It was excluded (OFF), now include it (ON)
      newExcluded = excludedList.filter(t => t !== topic);
    } else {
      // It was included (ON), now exclude it (OFF)
      newExcluded = [...excludedList, topic];
    }

    handleConfigChange(year, 'excludedTopics', newExcluded.join(','));
  };

  const saveSettings = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/event/year-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: activeEvent.id,
          configs: Object.values(configs)
        })
      });

      if (res.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
        router.refresh();
      } else {
        const err = await res.json();
        setMessage({ type: 'error', text: err.error || 'Failed to save settings' });
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: e.message || 'Network error' });
    } finally {
      setIsSaving(false);
    }
  };

  const currentConfig = configs[activeTab];
  const excludedTopicsArray = currentConfig.excludedTopics ? currentConfig.excludedTopics.split(',').filter(Boolean) : [];
  const totalQuestions = currentConfig.easyCount + currentConfig.mediumCount + currentConfig.hardCount;

  return (
    <div className="bg-secondary/20 border border-border rounded-xl overflow-hidden">
      
      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-border bg-secondary/50 p-2 gap-2">
        {YEARS.map(year => (
          <button
            key={year}
            onClick={() => setActiveTab(year)}
            className={`px-6 py-3 rounded-lg font-bold text-sm tracking-widest transition-all ${
              activeTab === year 
                ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            }`}
          >
            {year} Settings
          </button>
        ))}
      </div>

      <div className="p-6 md:p-8">
        
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-destructive/10 text-destructive border border-destructive/20'}`}>
            <AlertCircle className="w-5 h-5" />
            <p className="font-bold">{message.text}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Difficulty Configuration */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold uppercase tracking-tight text-foreground mb-2">Difficulty Spread</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Set exactly how many questions of each difficulty a {activeTab} participant will receive.
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-background/50 border border-border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <span className="font-bold block text-green-400">Easy</span>
                  <span className="text-xs text-muted-foreground uppercase">Questions</span>
                </div>
                <input 
                  type="number" 
                  min="0"
                  value={currentConfig.easyCount}
                  onChange={(e) => handleConfigChange(activeTab, 'easyCount', parseInt(e.target.value) || 0)}
                  className="w-24 bg-secondary text-foreground font-bold p-2 text-center rounded-md border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div className="bg-background/50 border border-border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <span className="font-bold block text-yellow-400">Medium</span>
                  <span className="text-xs text-muted-foreground uppercase">Questions</span>
                </div>
                <input 
                  type="number" 
                  min="0"
                  value={currentConfig.mediumCount}
                  onChange={(e) => handleConfigChange(activeTab, 'mediumCount', parseInt(e.target.value) || 0)}
                  className="w-24 bg-secondary text-foreground font-bold p-2 text-center rounded-md border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
              </div>

              <div className="bg-background/50 border border-border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <span className="font-bold block text-red-400">Hard</span>
                  <span className="text-xs text-muted-foreground uppercase">Questions</span>
                </div>
                <input 
                  type="number" 
                  min="0"
                  value={currentConfig.hardCount}
                  onChange={(e) => handleConfigChange(activeTab, 'hardCount', parseInt(e.target.value) || 0)}
                  className="w-24 bg-secondary text-foreground font-bold p-2 text-center rounded-md border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                />
              </div>
            </div>
            
            <div className="mt-4 p-4 bg-primary/10 border border-primary/20 rounded-lg flex justify-between items-center">
              <span className="font-bold text-sm uppercase tracking-widest text-primary">Total Per Quiz</span>
              <span className="text-2xl font-black text-foreground">{totalQuestions}</span>
            </div>
          </div>

          {/* Topic Configuration */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold uppercase tracking-tight text-foreground mb-2">Topic Selection</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Turn off topics you do NOT want to appear in {activeTab} quizzes.
              </p>
            </div>

            <div className="bg-background/50 border border-border rounded-lg p-1 overflow-hidden h-[400px] overflow-y-auto">
              {allTopics.length === 0 && (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No topics found in the question bank.
                </div>
              )}
              {allTopics.map(topic => {
                const isExcluded = excludedTopicsArray.includes(topic);
                const isEnabled = !isExcluded;
                
                return (
                  <div 
                    key={topic}
                    className={`flex items-center justify-between p-3 mb-1 rounded-md transition-colors ${isEnabled ? 'bg-secondary/40' : 'bg-background opacity-60'}`}
                  >
                    <span className={`font-medium ${isEnabled ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                      {topic}
                    </span>
                    <button
                      onClick={() => handleTopicToggle(activeTab, topic)}
                      className={`w-12 h-6 rounded-full transition-colors relative ${isEnabled ? 'bg-primary' : 'bg-secondary border border-border'}`}
                    >
                      <span 
                        className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-0'}`} 
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        <div className="mt-12 flex justify-end border-t border-border pt-6">
          <button
            onClick={saveSettings}
            disabled={isSaving}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-lg font-bold uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/20 disabled:opacity-50"
          >
            {isSaving ? (
              <span className="animate-pulse">Saving...</span>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save All Changes
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
