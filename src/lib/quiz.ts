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
    select: { id: true, text: true, topic: true, difficulty: true }
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

  const CS_TOPICS = ['Advanced CS', 'Data Structures', 'Java Servlets', 'Java', 'OOP', 'Operating Systems'];
  const BASIC_TOPICS = ['Basic Electronics', 'Physics'];

  // 1. Group into CS and Basic topics
  const csQuestionsByTopic: Record<string, any[]> = {};
  const basicQuestionsByTopic: Record<string, any[]> = {};

  allQuestions.forEach(q => {
    if (CS_TOPICS.includes(q.topic)) {
      if (!csQuestionsByTopic[q.topic]) csQuestionsByTopic[q.topic] = [];
      csQuestionsByTopic[q.topic].push(q);
    } else {
      if (!basicQuestionsByTopic[q.topic]) basicQuestionsByTopic[q.topic] = [];
      basicQuestionsByTopic[q.topic].push(q);
    }
  });

  // 2. Shuffle questions inside each topic bucket for randomness
  [csQuestionsByTopic, basicQuestionsByTopic].forEach(group => {
    for (const topic in group) {
      const bucket = group[topic];
      for (let i = bucket.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bucket[i], bucket[j]] = [bucket[j], bucket[i]];
      }
    }
  });

  // 3. Round-robin pick based on participant year
  const selectedQuestions: any[] = [];
  const difficultyCycle = ['Easy', 'Medium', 'Hard'];
  let difficultyIndex = 0;

  // Helper to pick questions from a given group of topic buckets
  const pickFromGroup = (group: Record<string, any[]>, countNeeded: number) => {
    const topicKeys = Object.keys(group);
    let keepPicking = true;
    let picked = 0;
    while (picked < countNeeded && keepPicking) {
      let pickedInThisRound = false;
      for (const topic of topicKeys) {
        if (picked >= countNeeded) break;
        
        const bucket = group[topic];
        if (bucket.length > 0) {
          const targetDiff = difficultyCycle[difficultyIndex % difficultyCycle.length];
          let qIndex = bucket.findIndex(q => q.difficulty === targetDiff);
          if (qIndex === -1) qIndex = bucket.length - 1;
          
          selectedQuestions.push(bucket.splice(qIndex, 1)[0]);
          picked++;
          pickedInThisRound = true;
          difficultyIndex++;
        }
      }
      if (!pickedInThisRound) keepPicking = false;
    }
    return picked;
  };

  if (participant.year === 'FY' || participant.year === 'SY') {
    // FY/SY: Strictly basic topics (Physics, Electronics)
    const picked = pickFromGroup(basicQuestionsByTopic, questionCount);
    if (picked < questionCount) {
      // Emergency fallback only if db is literally empty
      pickFromGroup(csQuestionsByTopic, questionCount - picked);
    }
  } else {
    // TY/LY: Prioritize technical CS topics
    const picked = pickFromGroup(csQuestionsByTopic, questionCount);
    if (picked < questionCount) {
      // Fallback to basic if we run out of CS questions
      pickFromGroup(basicQuestionsByTopic, questionCount - picked);
    }
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
