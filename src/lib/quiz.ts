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

  const normalizeText = (text: string) => {
    return text
      .replace(/\(Variation \d+\)/gi, '')
      .replace(/Variation #\d+:/gi, '')
      .replace(/\(Case \d+\)/gi, '')
      .replace(/\[Case \d+\]/gi, '')
      .replace(/Case #\d+:/gi, '')
      .replace(/[^a-z0-9]/gi, '') // Strip all non-alphanumeric characters (spaces, punctuation, etc.)
      .toLowerCase();
  };

  // Fetch previously answered questions to avoid duplicates (and their variations) in multiple attempts
  const pastAttempts = await prisma.attemptQuestion.findMany({
    where: { attempt: { participantId } },
    select: { question: { select: { text: true } } }
  });
  const pastNormalizedTexts = new Set(pastAttempts.map(aq => normalizeText(aq.question.text)));

  const targetYears = participant.year === 'FY' ? ['ALL', 'FY'] :
                      participant.year === 'SY' ? ['ALL', 'FY', 'SY'] :
                      participant.year === 'TY' ? ['ALL', 'FY', 'SY', 'TY'] :
                      ['ALL', 'FY', 'SY', 'TY', 'LY'];

  // Fetch the configuration for this year
  const yearConfig = await prisma.eventYearConfig.findUnique({
    where: { eventId_year: { eventId, year: participant.year } }
  });

  const excludedTopicsArray = yearConfig?.excludedTopics 
    ? yearConfig.excludedTopics.split(',').map(t => t.trim()).filter(Boolean)
    : [];

  const allQuestionsRaw = await prisma.question.findMany({
    where: { 
      eventId, 
      status: 'ACTIVE',
      targetYear: { in: targetYears },
      ...(excludedTopicsArray.length > 0 ? { topic: { notIn: excludedTopicsArray } } : {})
    },
    select: { id: true, text: true, topic: true, difficulty: true }
  });

  // Deduplicate by text (ignoring variation tags), and filter out previously answered questions
  const uniqueQuestionsMap = new Map();
  
  allQuestionsRaw.forEach(q => {
    const normalized = normalizeText(q.text);
    if (!uniqueQuestionsMap.has(normalized) && !pastNormalizedTexts.has(normalized)) {
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

  // 3. Determine exact difficulty counts from YearConfig
  const hardTarget = yearConfig ? yearConfig.hardCount : Math.max(1, Math.round(questionCount * 0.2));
  const easyTarget = yearConfig ? yearConfig.easyCount : Math.max(1, Math.round(questionCount * 0.4));
  const mediumTarget = yearConfig ? yearConfig.mediumCount : Math.max(0, questionCount - hardTarget - easyTarget);
  
  // Update questionCount to match the configured sum
  const totalTarget = easyTarget + mediumTarget + hardTarget;

  const requiredDifficulties: string[] = [
    ...Array(easyTarget).fill('Easy'),
    ...Array(mediumTarget).fill('Medium'),
    ...Array(hardTarget).fill('Hard')
  ];

  // Shuffle the required difficulties array
  for (let i = requiredDifficulties.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [requiredDifficulties[i], requiredDifficulties[j]] = [requiredDifficulties[j], requiredDifficulties[i]];
  }

  const selectedQuestions: any[] = [];
  
  // Define CS vs Basic split
  let csCount = 0;
  let basicCount = 0;
  
  if (participant.year === 'FY') {
    csCount = Math.max(1, Math.round(totalTarget * 0.2));
    basicCount = totalTarget - csCount;
  } else if (participant.year === 'SY') {
    basicCount = Math.max(1, Math.round(totalTarget * 0.2));
    csCount = totalTarget - basicCount;
  } else {
    // TY/LY: 100% CS
    csCount = totalTarget;
    basicCount = 0;
  }

  // Assign difficulties to Basic slots and CS slots
  const basicDifficulties = requiredDifficulties.slice(0, basicCount);
  const csDifficulties = requiredDifficulties.slice(basicCount);

  // Helper to safely pick from a category
  const pickExact = (targetDiff: string, primaryBuckets: Record<string, any[]>, fallbackBuckets: Record<string, any[]>) => {
    const normDiff = targetDiff.charAt(0).toUpperCase() + targetDiff.slice(1).toLowerCase();
    
    // Check Case-Insensitive keys just in case
    const findBucket = (buckets: Record<string, any[]>, diff: string) => {
      const key = Object.keys(buckets).find(k => k.toLowerCase() === diff.toLowerCase());
      return key ? buckets[key] : [];
    };

    const primaryBucket = findBucket(primaryBuckets, normDiff);
    if (primaryBucket && primaryBucket.length > 0) return primaryBucket.pop();

    // Fallback 1: Same category, different difficulty
    const allDiffs = ['Medium', 'Easy', 'Hard'];
    for (const d of allDiffs) {
      const fb = findBucket(primaryBuckets, d);
      if (fb && fb.length > 0) return fb.pop();
    }

    // Fallback 2: Different category, same difficulty
    const secBucket = findBucket(fallbackBuckets, normDiff);
    if (secBucket && secBucket.length > 0) return secBucket.pop();

    // Fallback 3: Different category, different difficulty
    for (const d of allDiffs) {
      const fb = findBucket(fallbackBuckets, d);
      if (fb && fb.length > 0) return fb.pop();
    }
    
    return null;
  };

  // Pick Basic Questions
  for (const diff of basicDifficulties) {
    const q = pickExact(diff, basicBuckets, csBuckets);
    if (q) selectedQuestions.push(q);
  }

  // Pick CS Questions
  for (const diff of csDifficulties) {
    const q = pickExact(diff, csBuckets, basicBuckets);
    if (q) selectedQuestions.push(q);
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
        targetYear: participant.year,
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
