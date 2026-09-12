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

  // Deduplicate by text (ignoring variation tags), and filter out previously answered questions
  const uniqueQuestionsMap = new Map();
  
  const normalizeText = (text: string) => {
    return text
      .replace(/\(Variation \d+\)/gi, '')
      .replace(/Variation #\d+:/gi, '')
      .trim()
      .toLowerCase();
  };

  allQuestionsRaw.forEach(q => {
    const normalized = normalizeText(q.text);
    if (!uniqueQuestionsMap.has(normalized) && !pastQuestionIds.has(q.id)) {
      uniqueQuestionsMap.set(normalized, q); // store full object
    }
  });
  
  let availableQuestions = Array.from(uniqueQuestionsMap.values());

  // Fallback: If we exhausted the bank due to retakes, we must allow duplicates to ensure they can take the test.
  if (availableQuestions.length < questionCount) {
    uniqueQuestionsMap.clear();
    allQuestionsRaw.forEach(q => {
      const normalized = normalizeText(q.text);
      if (!uniqueQuestionsMap.has(normalized)) uniqueQuestionsMap.set(normalized, q); 
    });
    availableQuestions = Array.from(uniqueQuestionsMap.values());
  }

  if (availableQuestions.length < questionCount) {
    throw new Error("Not enough unique questions in the bank to generate a quiz.");
  }

  const CS_TOPICS = ['Advanced CS', 'Data Structures', 'Java Servlets', 'Java', 'OOP', 'Operating Systems'];

  // 1. Group into CS and Basic, and then into difficulty buckets
  const csBuckets: Record<string, any[]> = { 'Easy': [], 'Medium': [], 'Hard': [] };
  const basicBuckets: Record<string, any[]> = { 'Easy': [], 'Medium': [], 'Hard': [] };

  availableQuestions.forEach(q => {
    const isCS = CS_TOPICS.includes(q.topic);
    const diff = q.difficulty || 'Medium'; // default to Medium if weird
    if (isCS) {
      if (csBuckets[diff]) csBuckets[diff].push(q);
      else csBuckets['Medium'].push(q);
    } else {
      if (basicBuckets[diff]) basicBuckets[diff].push(q);
      else basicBuckets['Medium'].push(q);
    }
  });

  // 2. Shuffle all buckets
  for (const diff in csBuckets) {
    const bucket = csBuckets[diff];
    for (let i = bucket.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bucket[i], bucket[j]] = [bucket[j], bucket[i]];
    }
  }
  for (const diff in basicBuckets) {
    const bucket = basicBuckets[diff];
    for (let i = bucket.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bucket[i], bucket[j]] = [bucket[j], bucket[i]];
    }
  }

  // 3. Select questions cycling through difficulties with dynamic fallback
  const difficultyCycle = ['Easy', 'Medium', 'Hard'];
  let difficultyIndex = Math.floor(Math.random() * difficultyCycle.length);

  const pickFromBuckets = (buckets: Record<string, any[]>, count: number) => {
    const picked: any[] = [];
    while (picked.length < count) {
      const targetDiff = difficultyCycle[difficultyIndex % difficultyCycle.length];
      
      if (buckets[targetDiff].length > 0) {
        picked.push(buckets[targetDiff].pop());
      } else {
        // Fallback: Try other buckets if the target difficulty is exhausted
        const fallbacks = ['Medium', 'Easy', 'Hard'].filter(d => d !== targetDiff);
        let found = false;
        for (const fb of fallbacks) {
           if (buckets[fb].length > 0) {
              picked.push(buckets[fb].pop());
              found = true;
              break;
           }
        }
        if (!found) break; // Exhausted all difficulties in this category
      }
      difficultyIndex++;
    }
    return picked;
  };

  const selectedQuestions: any[] = [];
  
  if (participant.year === 'FY') {
    const csCount = Math.max(1, Math.round(questionCount * 0.2));
    const basicCount = questionCount - csCount;
    
    let pickedBasic = pickFromBuckets(basicBuckets, basicCount);
    let pickedCs = pickFromBuckets(csBuckets, csCount);
    
    // Fallbacks across categories if one is completely empty
    if (pickedBasic.length < basicCount) pickedCs.push(...pickFromBuckets(csBuckets, basicCount - pickedBasic.length));
    if (pickedCs.length < csCount) pickedBasic.push(...pickFromBuckets(basicBuckets, csCount - pickedCs.length));
    
    selectedQuestions.push(...pickedBasic, ...pickedCs);
  } else if (participant.year === 'SY') {
    const basicCount = Math.max(1, Math.round(questionCount * 0.2));
    const csCount = questionCount - basicCount;
    
    let pickedBasic = pickFromBuckets(basicBuckets, basicCount);
    let pickedCs = pickFromBuckets(csBuckets, csCount);
    
    if (pickedBasic.length < basicCount) pickedCs.push(...pickFromBuckets(csBuckets, basicCount - pickedBasic.length));
    if (pickedCs.length < csCount) pickedBasic.push(...pickFromBuckets(basicBuckets, csCount - pickedCs.length));
    
    selectedQuestions.push(...pickedBasic, ...pickedCs);
  } else {
    // TY/LY: 100% CS
    let pickedCs = pickFromBuckets(csBuckets, questionCount);
    if (pickedCs.length < questionCount) {
       pickedCs.push(...pickFromBuckets(basicBuckets, questionCount - pickedCs.length));
    }
    selectedQuestions.push(...pickedCs);
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
