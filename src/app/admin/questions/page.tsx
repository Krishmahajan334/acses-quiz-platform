import { prisma } from '@/lib/db';
import Link from 'next/link';
import BulkUploadButton from '../components/BulkUploadButton';
import BulkDeleteQuestionsButton from '../components/BulkDeleteQuestionsButton';

export const dynamic = 'force-dynamic';

export default async function QuestionBankPage(props: { searchParams: Promise<{ page?: string }> }) {
  const searchParams = await props.searchParams;
  const page = parseInt(searchParams.page || '1', 10);
  const ITEMS_PER_PAGE = 50;

  const allQuestions = await prisma.question.findMany({
    include: {
      options: true,
      event: true
    },
    orderBy: {
      id: 'asc'
    }
  });

  const totalPages = Math.ceil(allQuestions.length / ITEMS_PER_PAGE);
  const questions = allQuestions.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Question Bank</h1>
          <p className="text-gray-500 mt-1 text-sm">View all questions and their options</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <BulkDeleteQuestionsButton />
          <BulkUploadButton />
          <Link href="/admin/questions/new" className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-semibold transition shadow-sm whitespace-nowrap">
            + Add Question
          </Link>
        </div>
      </div>

      {/* Statistics Section */}
      <div className="mb-8 bg-gray-900 rounded-2xl shadow-sm border border-gray-800 p-6">
        <h2 className="text-lg font-bold text-white mb-4">Question Distribution</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700">
            <p className="text-sm font-medium text-gray-400">Total</p>
            <p className="text-2xl font-bold text-blue-400">{allQuestions.length}</p>
          </div>
          
          {['FY', 'SY', 'TY', 'Final Year'].map((year, index) => {
            const displayLabel = ['FY', 'SY', 'TY', 'LY'][index];
            const yearQs = allQuestions.filter(q => q.targetYear === year);
            const easy = yearQs.filter(q => q.difficulty === 'Easy').length;
            const med = yearQs.filter(q => q.difficulty === 'Medium').length;
            const hard = yearQs.filter(q => q.difficulty === 'Hard').length;
            
            return (
              <div key={year} className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                <p className="text-sm font-bold text-white mb-2">{displayLabel} Year</p>
                <div className="flex justify-between text-xs text-gray-400">
                  <span><span className="text-green-400">●</span> E: {easy}</span>
                  <span><span className="text-yellow-400">●</span> M: {med}</span>
                  <span><span className="text-red-400">●</span> H: {hard}</span>
                </div>
                <p className="text-lg font-bold text-white mt-1">{yearQs.length}</p>
              </div>
            );
          })}
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

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8 bg-gray-900/50 py-4 rounded-xl border border-gray-800">
          <Link 
            href={`/admin/questions?page=${Math.max(1, page - 1)}`}
            className={`px-4 py-2 rounded font-bold text-sm transition-colors ${page === 1 ? 'bg-gray-800 text-gray-600 pointer-events-none' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
          >
            &larr; Previous
          </Link>
          <span className="text-gray-400 text-sm font-bold">
            Page {page} of {totalPages}
          </span>
          <Link 
            href={`/admin/questions?page=${Math.min(totalPages, page + 1)}`}
            className={`px-4 py-2 rounded font-bold text-sm transition-colors ${page === totalPages ? 'bg-gray-800 text-gray-600 pointer-events-none' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
          >
            Next &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}
