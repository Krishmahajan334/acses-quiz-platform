'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { use } from 'react';

export default function EditQuestionPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [events, setEvents] = useState<{id: string, name: string}[]>([]);
  
  const [eventId, setEventId] = useState('');
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [difficulty, setDifficulty] = useState('Easy');
  const [topic, setTopic] = useState('General');
  const [durationSec, setDurationSec] = useState('');
  
  const [options, setOptions] = useState([
    { optionKey: 'A', text: '', isCorrect: true },
    { optionKey: 'B', text: '', isCorrect: false },
    { optionKey: 'C', text: '', isCorrect: false },
    { optionKey: 'D', text: '', isCorrect: false },
  ]);
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch events for the dropdown
  useEffect(() => {
    Promise.all([
      fetch('/api/admin/dashboard').then(res => res.json()),
      fetch(`/api/admin/questions/${id}`).then(res => {
        if (!res.ok) throw new Error("Failed to load question details");
        return res.json();
      })
    ]).then(([eventsData, questionData]) => {
      if (eventsData.events && eventsData.events.length > 0) {
        setEvents(eventsData.events);
      }
      
      // Populate question data
      setEventId(questionData.eventId || '');
      setText(questionData.text || '');
      setImageUrl(questionData.imageUrl || '');
      setDifficulty(questionData.difficulty || 'Easy');
      setTopic(questionData.topic || 'General');
      setDurationSec(questionData.durationSec ? questionData.durationSec.toString() : '');
      
      if (questionData.options && questionData.options.length === 4) {
        setOptions(questionData.options.map((opt: any) => ({
          optionKey: opt.optionKey,
          text: opt.text,
          isCorrect: opt.isCorrect
        })));
      }
      setInitialLoading(false);
    }).catch(err => {
      setError(err.message);
      setInitialLoading(false);
    });
  }, [id]);

  const handleOptionChange = (index: number, field: string, value: string | boolean) => {
    const newOptions = [...options];
    if (field === 'isCorrect') {
      // Only one can be correct
      newOptions.forEach(opt => opt.isCorrect = false);
      newOptions[index].isCorrect = true;
    } else {
      (newOptions[index] as any)[field] = value;
    }
    setOptions(newOptions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/questions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          text,
          imageUrl: imageUrl.trim() || null,
          durationSec: durationSec || null,
          difficulty,
          topic,
          options
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update question');
      }

      router.push('/admin/questions');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Edit Question</h1>
          <p className="text-gray-500 mt-1">Modify the question details and options.</p>
        </div>
        <Link href="/admin/questions" className="text-sm font-medium text-blue-600 hover:text-blue-800 transition">
          &larr; Back to Question Bank
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm font-medium border border-red-100">
              {error}
            </div>
          )}

          {initialLoading ? (
            <div className="flex justify-center items-center py-20 text-gray-500 font-medium">
              Loading question details...
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Target Quiz Event</label>
              <select 
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-gray-50"
                required
              >
                {events.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Topic / Category</label>
              <input 
                type="text" 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="e.g. React, DB, General"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Question Text</label>
            <textarea 
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition min-h-[120px] text-lg"
              placeholder="What is the time complexity of..."
              required
            ></textarea>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Difficulty</label>
              <select 
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-gray-50"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Image URL (Optional)</label>
              <input 
                type="url" 
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="https://example.com/image.png"
              />
              <p className="text-xs text-gray-500 mt-1">Paste a direct link to an image.</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Time Limit (Seconds)</label>
              <input 
                type="number" 
                value={durationSec}
                onChange={(e) => setDurationSec(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                placeholder="Leave blank for equal distribution"
              />
              <p className="text-xs text-gray-500 mt-1">If empty, time will be distributed equally.</p>
            </div>
          </div>
          
          {imageUrl && (
            <div className="mt-4">
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Image Preview</label>
              <img src={imageUrl} alt="Preview" className="max-h-48 rounded-lg border border-gray-200 shadow-sm object-contain" />
            </div>
          )}

          <hr className="border-gray-200" />

          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Options</h3>
            <p className="text-sm text-gray-500 mb-6">Provide 4 options and select which one is the correct answer.</p>
            
            <div className="space-y-4">
              {options.map((opt, index) => (
                <div key={index} className={`flex items-center gap-4 p-4 rounded-xl border-2 transition ${opt.isCorrect ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                  <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                    <input 
                      type="radio" 
                      name="correctOption" 
                      checked={opt.isCorrect}
                      onChange={() => handleOptionChange(index, 'isCorrect', true)}
                      className="w-5 h-5 text-green-600 border-gray-300 focus:ring-green-500"
                    />
                    <span className="font-bold text-gray-700 w-6 text-center">{opt.optionKey}</span>
                  </label>
                  
                  <input 
                    type="text"
                    value={opt.text}
                    onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                    placeholder={`Option ${opt.optionKey} text`}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button 
              type="submit" 
              disabled={loading}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
          </>
          )}
        </form>
      </div>
    </div>
  );
}
