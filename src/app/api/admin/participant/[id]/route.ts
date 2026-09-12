import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: participantId } = await params;
    if (!participantId) {
      return NextResponse.json({ error: "Participant ID is required" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      const attempts = await tx.attempt.findMany({
        where: { participantId },
        select: { id: true }
      });
      const attemptIds = attempts.map(a => a.id);

      if (attemptIds.length > 0) {
        await tx.answer.deleteMany({
          where: { attemptId: { in: attemptIds } }
        });
        await tx.attemptQuestion.deleteMany({
          where: { attemptId: { in: attemptIds } }
        });
        await tx.coupon.deleteMany({
          where: { participantId }
        });
        await tx.attempt.deleteMany({
          where: { id: { in: attemptIds } }
        });
      }

      await tx.participant.delete({
        where: { id: participantId }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting participant:", error);
    return NextResponse.json({ error: error.message || "Failed to delete participant" }, { status: 500 });
  }
}
