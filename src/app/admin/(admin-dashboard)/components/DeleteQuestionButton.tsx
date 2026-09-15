'use client';

export default function DeleteQuestionButton({ questionId }: { questionId: string }) {
  return (
    <form method="POST" action={`/api/admin/questions/${questionId}/delete`} onSubmit={(e) => {
      if (!confirm('Are you sure you want to delete this question?')) e.preventDefault();
    }}>
      <button type="submit" className="text-sm font-semibold text-red-600 hover:text-red-800 transition bg-red-50 px-3 py-1 rounded-md">Delete</button>
    </form>
  );
}
