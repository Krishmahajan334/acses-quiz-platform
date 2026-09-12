import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { cookies } from 'next/headers';

export async function DELETE(request: Request, context: any) {
  try {
    const { params } = context;
    const { id } = await params;
    
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;

    if (!token || token !== process.env.ADMIN_AUTH_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json({ error: "Batch ID is required" }, { status: 400 });
    }

    // Use transaction to ensure safe cascading manual deletes
    await prisma.$transaction(async (tx) => {
      // Find all questions for this batch
      const questions = await tx.question.findMany({
        where: { uploadBatchId: id },
        select: { id: true }
      });
      
      const questionIds = questions.map(q => q.id);

      if (questionIds.length > 0) {
        // Delete child relations
        await tx.answer.deleteMany({
          where: { questionId: { in: questionIds } }
        });
        
        await tx.attemptQuestion.deleteMany({
          where: { questionId: { in: questionIds } }
        });
        
        await tx.option.deleteMany({
          where: { questionId: { in: questionIds } }
        });
        
        // Delete the questions
        await tx.question.deleteMany({
          where: { id: { in: questionIds } }
        });
      }

      // Finally delete the history record itself
      await tx.uploadHistory.delete({
        where: { id }
      });
    }, { maxWait: 10000, timeout: 60000 });

    return NextResponse.json({ success: true, message: "Successfully reverted upload batch." });
  } catch (error: any) {
    console.error("Revert Upload Batch Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
