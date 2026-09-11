import { prisma } from './db';
import { cookies } from 'next/headers';
import crypto from 'crypto';

export async function getActiveEvent() {
  return await prisma.quizEvent.findFirst({
    where: { status: 'ACTIVE' }
  });
}

export async function generateAttempt(participantId: string, eventId: string, durationSec: number, questionCount: number) {
  // Fetch the participant to get their academic year
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
    select: { year: true }
  });

  if (!participant) {
    throw new Error("Participant not found");
  }

  // Fetch active questions targeting their specific year (or ALL)
  const allQuestionsRaw = await prisma.question.findMany({
    where: { 
      eventId, 
      status: 'ACTIVE',
      targetYear: { in: [participant.year, 'ALL'] }
    },
    select: { id: true, text: true }
  });

  // Deduplicate by text in case admin accidentally uploaded the same questions multiple times
  const uniqueQuestionsMap = new Map();
  allQuestionsRaw.forEach(q => {
    if (!uniqueQuestionsMap.has(q.text)) {
      uniqueQuestionsMap.set(q.text, q.id);
    }
  });
  const allQuestions = Array.from(uniqueQuestionsMap.values()).map(id => ({ id }));

  if (allQuestions.length < questionCount) {
    throw new Error("Not enough unique questions in the bank");
  }

  // Proper Fisher-Yates Shuffle
  for (let i = allQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
  }
  
  const selectedQuestions = allQuestions.slice(0, questionCount);

  // Calculate deadline
  const startedAt = new Date();
  const deadlineAt = new Date(startedAt.getTime() + durationSec * 1000);

  // Transaction
  const attempt = await prisma.$transaction(async (tx) => {
    // 1. Check if user already has an active attempt
    const existingActive = await tx.attempt.findFirst({
      where: {
        participantId,
        eventId,
        status: 'ACTIVE',
        deadlineAt: { gt: new Date() }
      }
    });

    if (existingActive) {
      throw new Error("You already have an active attempt.");
    }

    // 2. Create the attempt
    const newAttempt = await tx.attempt.create({
      data: {
        participantId,
        eventId,
        startedAt,
        deadlineAt,
        status: 'ACTIVE'
      }
    });

    // 3. Store the assigned questions
    const attemptQuestionsData = selectedQuestions.map((q, index) => ({
      attemptId: newAttempt.id,
      questionId: q.id,
      position: index + 1
    }));

    await tx.attemptQuestion.createMany({
      data: attemptQuestionsData
    });

    return newAttempt;
  });

  // Set secure cookie
  const cookieStore = await cookies();
  cookieStore.set('quiz_attempt_id', attempt.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: durationSec + 60, // Keep cookie slightly longer than quiz duration
    path: '/'
  });

  return attempt;
}

export async function getActiveAttempt() {
  const cookieStore = await cookies();
  const attemptId = cookieStore.get('quiz_attempt_id')?.value;

  if (!attemptId) return null;

  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: { event: true }
  });

  if (!attempt || attempt.status !== 'ACTIVE' || attempt.deadlineAt < new Date()) {
    return null;
  }

  return attempt;
}
