'use client';

import { useState } from 'react';
import DeleteQuestionButton from '../../components/DeleteQuestionButton';

type QuestionType = {
  id: string;
  eventId: string;
  text: string;
  imageUrl: string | null;
  durationSec: number | null;
  difficulty: string;
  topic: string;
  targetYear?: string | null;
  options: { id: string; optionKey: string; text: string; isCorrect: boolean }[];
};

type EventType = {
  id: string;
  name: string;
};

export default function QuestionCard({ 
  question, 
  index, 
  events 
}: { 
  question: QuestionType, 
  index: number,
  events: EventType[]
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [qData, setQData] = useState<QuestionType>(question);

  // Form states
  const [eventId, setEventId] = useState(question.eventId);
  const [text, setText] = useState(question.text);
  const [imageUrl, setImageUrl] = useState(question.imageUrl || '');
  const [difficulty, setDifficulty] = useState(question.difficulty);
  const [topic, setTopic] = useState(question.topic);
  const [durationSec, setDurationSec] = useState(question.durationSec ? question.durationSec.toString() : '');
  const [options, setOptions] = useState(question.options.map(o => ({ ...o })));

  const handleOptionChange = (optIndex: number, field: string, value: string | boolean) => {
    const newOptions = [...options];
    if (field === 'isCorrect') {
      newOptions.forEach(opt => opt.isCorrect = false);
      newOptions[optIndex].isCorrect = true;
    } else {
      (newOptions[optIndex] as any)[field] = value;
    }
    setOptions(newOptions);
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/questions/${question.id}`, {
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

      const { question: updatedQ } = await res.json();
      setQData(updatedQ);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEventId(qData.eventId);
    setText(qData.text);
    setImageUrl(qData.imageUrl || '');
    setDifficulty(qData.difficulty);
    setTopic(qData.topic);
    setDurationSec(qData.durationSec ? qData.durationSec.toString() : '');
    setOptions(qData.options.map(o => ({ ...o })));
    setIsEditing(false);
    setError('');
  };

  if (isEditing) {
    return (
      <div className="bg-white p-6 rounded-2xl shadow-lg border-2 border-blue-200 transition">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-gray-900">Edit Question</h3>
          <button onClick={handleCancel} className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg text-sm font-medium border border-red-100">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Event</label>
              <select value={eventId} onChange={(e) => setEventId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white">
                {events.map(ev => <option key={ev.id} value={ev.id}>{ev.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Topic</label>
              <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Question Text</label>
            <textarea value={text} onChange={(e) => setText(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px] text-gray-900 bg-white" required />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Difficulty</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white">
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Image URL</label>
              <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white" placeholder="https://" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Time Limit (Sec)</label>
              <input type="number" value={durationSec} onChange={(e) => setDurationSec(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white" placeholder="Empty for default" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Options</label>
            <div className="space-y-2">
              {options.map((opt, i) => (
                <div key={i} className={`flex items-center gap-3 p-2 rounded-lg border ${opt.isCorrect ? 'border-green-400 bg-green-50' : 'border-gray-200'}`}>
                  <input type="radio" name={`correct-${qData.id}`} checked={opt.isCorrect} onChange={() => handleOptionChange(i, 'isCorrect', true)} className="w-4 h-4 text-green-600 focus:ring-green-500" />
                  <span className="font-bold text-gray-700 w-5">{opt.optionKey}</span>
                  <input type="text" value={opt.text} onChange={(e) => handleOptionChange(i, 'text', e.target.value)} className="flex-1 px-3 py-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 bg-white" required />
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button onClick={handleCancel} disabled={loading} className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 transition">Cancel</button>
            <button onClick={handleSave} disabled={loading} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition">{loading ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </div>
      </div>
    );
  }

  // VIEW MODE
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded">
              Q{index + 1}
            </span>
            <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded">
              {qData.difficulty}
            </span>
            <span className="bg-purple-50 text-purple-700 text-xs font-bold px-2 py-1 rounded">
              {qData.topic}
            </span>
            {qData.targetYear && (
              <span className="bg-orange-50 text-orange-700 text-xs font-bold px-2 py-1 rounded">
                {qData.targetYear} Year
              </span>
            )}
          </div>
          <h3 className="text-lg font-bold text-gray-900">{qData.text}</h3>
          {qData.imageUrl && (
            <div className="mt-3">
              <img src={qData.imageUrl} alt="Question Graphic" className="max-h-32 rounded border border-gray-200 shadow-sm" />
            </div>
          )}
        </div>
        <div className="flex space-x-2">
          <button onClick={() => setIsEditing(true)} className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition bg-blue-50 px-3 py-1 rounded-md">Edit</button>
          <DeleteQuestionButton questionId={qData.id} />
        </div>
      </div>
      
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        {qData.options.map((opt) => (
          <div 
            key={opt.id || opt.optionKey} 
            className={`p-3 rounded-lg border text-sm flex items-center ${
              opt.isCorrect 
                ? 'border-green-500 bg-green-50 text-green-900 font-medium' 
                : 'border-gray-200 bg-gray-50 text-gray-700'
            }`}
          >
            <span className="mr-3 text-xs font-bold bg-white px-2 py-1 border rounded shadow-sm">
              {opt.optionKey}
            </span>
            {opt.text}
            {opt.isCorrect && (
              <svg className="w-5 h-5 ml-auto text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
