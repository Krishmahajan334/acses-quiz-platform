import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const p = await params;
    const { id } = p;

    if (!id) {
      return NextResponse.json({ error: "Missing question ID" }, { status: 400 });
    }

    // Since this is a form POST, we can redirect back to the questions page
    await prisma.$transaction(async (tx) => {
      // Delete answers, options, and attempt linkages first due to foreign keys
      await tx.answer.deleteMany({ where: { questionId: id } });
      await tx.attemptQuestion.deleteMany({ where: { questionId: id } });
      await tx.option.deleteMany({ where: { questionId: id } });
      await tx.question.delete({ where: { id } });
    });

    return NextResponse.redirect(new URL('/admin/questions', request.url));
  } catch (error: any) {
    console.error("Delete Question Error:", error);
    return NextResponse.json({ error: error.message || "Failed to delete question" }, { status: 500 });
  }
}
