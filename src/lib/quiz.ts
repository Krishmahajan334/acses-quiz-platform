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

  // Fetch previously answered questions to avoid duplicates in multiple attempts
  const pastAttempts = await prisma.attemptQuestion.findMany({
    where: { attempt: { participantId } },
    select: { questionId: true }
  });
  const pastQuestionIds = new Set(pastAttempts.map(aq => aq.questionId));

  // Fetch active questions targeting their specific year (or ALL)
  const allQuestionsRaw = await prisma.question.findMany({
    where: { 
      eventId, 
      status: 'ACTIVE',
      targetYear: { in: [participant.year, 'ALL'] }
    },
    select: { id: true, text: true, topic: true, difficulty: true }
  });

  // Deduplicate by text, and filter out previously answered questions
  const uniqueQuestionsMap = new Map();
  allQuestionsRaw.forEach(q => {
    if (!uniqueQuestionsMap.has(q.text) && !pastQuestionIds.has(q.id)) {
      uniqueQuestionsMap.set(q.text, q); // store full object
    }
  });
  
  let availableQuestions = Array.from(uniqueQuestionsMap.values());

  // Fallback: If we exhausted the bank due to retakes, we must allow duplicates to ensure they can take the test.
  if (availableQuestions.length < questionCount) {
    uniqueQuestionsMap.clear();
    allQuestionsRaw.forEach(q => {
      if (!uniqueQuestionsMap.has(q.text)) uniqueQuestionsMap.set(q.text, q); 
    });
    availableQuestions = Array.from(uniqueQuestionsMap.values());
  }

  if (availableQuestions.length < questionCount) {
    throw new Error("Not enough unique questions in the bank to generate a quiz.");
  }

  // 1. Group into difficulty buckets
  const difficultyBuckets: Record<string, any[]> = {
    'Easy': [],
    'Medium': [],
    'Hard': []
  };

  availableQuestions.forEach(q => {
    if (difficultyBuckets[q.difficulty]) {
      difficultyBuckets[q.difficulty].push(q);
    } else {
      difficultyBuckets['Medium'].push(q); // safe fallback for weird data
    }
  });

  // 2. Shuffle each bucket using Fisher-Yates
  for (const diff in difficultyBuckets) {
    const bucket = difficultyBuckets[diff];
    for (let i = bucket.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bucket[i], bucket[j]] = [bucket[j], bucket[i]];
    }
  }

  // 3. Select questions cycling through difficulties with dynamic fallback
  const selectedQuestions: any[] = [];
  const difficultyCycle = ['Easy', 'Medium', 'Hard'];
  let difficultyIndex = Math.floor(Math.random() * difficultyCycle.length);

  while (selectedQuestions.length < questionCount) {
    const targetDiff = difficultyCycle[difficultyIndex % difficultyCycle.length];
    
    if (difficultyBuckets[targetDiff].length > 0) {
      selectedQuestions.push(difficultyBuckets[targetDiff].pop());
    } else {
      // Fallback: Try other buckets if the target difficulty is exhausted
      const fallbacks = ['Medium', 'Easy', 'Hard'].filter(d => d !== targetDiff);
      for (const fb of fallbacks) {
         if (difficultyBuckets[fb].length > 0) {
            selectedQuestions.push(difficultyBuckets[fb].pop());
            break;
         }
      }
    }
    difficultyIndex++;
  }

  // 4. Final shuffle so the student gets questions in a completely random difficulty order
  for (let i = selectedQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selectedQuestions[i], selectedQuestions[j]] = [selectedQuestions[j], selectedQuestions[i]];
  }

  // Calculate deadline
  const startedAt = new Date();
  const deadlineAt = new Date(startedAt.getTime() + durationSec * 1000);

  // Transaction
  const attempt = await prisma.$transaction(async (tx) => {
    // 1. Check for COMPLETED attempts (prevent retaking unless multiple attempts allowed)
    const activeEvent = await tx.quizEvent.findUnique({ where: { id: eventId } });
    if (!activeEvent?.allowMultipleAttempts) {
      const completedAttempt = await tx.attempt.findFirst({
        where: { participantId, eventId, status: 'COMPLETED' }
      });
      if (completedAttempt) {
        throw new Error("You have already completed the quiz. Multiple attempts are not allowed.");
      }
    }

    // 2. Check for ACTIVE attempts
    const activeAttempts = await tx.attempt.findMany({
      where: { participantId, eventId, status: 'ACTIVE' }
    });

    for (const active of activeAttempts) {
      if (active.deadlineAt > new Date()) {
        // Still valid time left, they should resume, not restart
        throw new Error("You already have an active attempt. Please refresh the page to resume.");
      } else {
        // Time has expired (glitch or they closed the browser). Delete it so they can start fresh.
        await tx.attemptQuestion.deleteMany({ where: { attemptId: active.id } });
        await tx.attempt.delete({ where: { id: active.id } });
      }
    }

    // 3. Create the new attempt
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
    sameSite: 'none',
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
