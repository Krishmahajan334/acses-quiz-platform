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
      uniqueQuestionsMap.set(q.text, q); // store full object
    }
  });
  
  const allQuestions = Array.from(uniqueQuestionsMap.values());

  if (allQuestions.length < questionCount) {
    throw new Error("Not enough unique questions in the bank");
  }

  // 1. Group questions by topic
  const questionsByTopic: Record<string, any[]> = {};
  allQuestions.forEach(q => {
    if (!questionsByTopic[q.topic]) {
      questionsByTopic[q.topic] = [];
    }
    questionsByTopic[q.topic].push(q);
  });

  // 2. Shuffle questions inside each topic bucket for randomness
  for (const topic in questionsByTopic) {
    const bucket = questionsByTopic[topic];
    for (let i = bucket.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bucket[i], bucket[j]] = [bucket[j], bucket[i]];
    }
  }

  // 3. Round-robin pick from each topic and alternate difficulty to guarantee diversity
  const selectedQuestions: any[] = [];
  const topicKeys = Object.keys(questionsByTopic);
  
  const difficultyCycle = ['Easy', 'Medium', 'Hard'];
  let difficultyIndex = 0;
  
  // Keep picking 1 from each topic until we hit questionCount
  let keepPicking = true;
  while (selectedQuestions.length < questionCount && keepPicking) {
    let pickedInThisRound = false;
    for (const topic of topicKeys) {
      if (selectedQuestions.length >= questionCount) break;
      
      const bucket = questionsByTopic[topic];
      if (bucket.length > 0) {
        const targetDiff = difficultyCycle[difficultyIndex % difficultyCycle.length];
        
        // Try to find a question matching the target difficulty
        let qIndex = bucket.findIndex(q => q.difficulty === targetDiff);
        
        if (qIndex === -1) {
          // Fallback: take the last item if the specific difficulty isn't available
          qIndex = bucket.length - 1;
        }

        selectedQuestions.push(bucket.splice(qIndex, 1)[0]);
        pickedInThisRound = true;
        difficultyIndex++;
      }
    }
    // If no buckets had questions left (shouldn't happen due to count check, but safety first)
    if (!pickedInThisRound) keepPicking = false;
  }

  // 4. Finally shuffle the selected questions so the student doesn't get them strictly in topic-order
  for (let i = selectedQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [selectedQuestions[i], selectedQuestions[j]] = [selectedQuestions[j], selectedQuestions[i]];
  }

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
