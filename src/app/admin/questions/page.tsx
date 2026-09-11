import { prisma } from '@/lib/db';
import Link from 'next/link';
import BulkUploadButton from '../components/BulkUploadButton';
import BulkDeleteQuestionsButton from '../components/BulkDeleteQuestionsButton';

export const dynamic = 'force-dynamic';

export default async function QuestionBankPage() {
  const questions = await prisma.question.findMany({
    include: {
      options: true,
      event: true
    },
    orderBy: {
      id: 'asc'
    }
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Question Bank</h1>
          <p className="text-gray-500 mt-1 text-sm">View all questions and their options</p>
        </div>
        <div className="flex items-center gap-4">
          <BulkDeleteQuestionsButton />
          <BulkUploadButton />
          <Link href="/admin/questions/new" className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm">
            + Add Question
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {questions.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl shadow-sm border border-gray-100">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900">No questions found</h3>
            <p className="text-gray-500 mt-1">Get started by creating a new question.</p>
          </div>
        ) : (
          questions.map((q, index) => (
            <div key={q.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-gray-100 text-gray-600 text-xs font-bold px-2 py-1 rounded">
                      Q{index + 1}
                    </span>
                    <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded">
                      {q.difficulty}
                    </span>
                    <span className="bg-purple-50 text-purple-700 text-xs font-bold px-2 py-1 rounded">
                      {q.topic}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{q.text}</h3>
                  {q.imageUrl && (
                    <div className="mt-3">
                      <img src={q.imageUrl} alt="Question Graphic" className="max-h-32 rounded border border-gray-200 shadow-sm" />
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button className="text-sm text-gray-500 hover:text-blue-600 transition">Edit</button>
                  <button className="text-sm text-red-500 hover:text-red-700 transition">Delete</button>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {q.options.map((opt) => (
                  <div 
                    key={opt.id} 
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
          ))
        )}
      </div>
    </div>
  );
}
