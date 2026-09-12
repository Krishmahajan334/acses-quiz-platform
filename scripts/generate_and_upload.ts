import { prisma } from '../src/lib/db';

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3.6-flash";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

const YEARS = [
  { year: "SY", topics: "Data Structures, C++, Object Oriented Programming, Operating Systems.", amount: 50, batches: 4 },
  { year: "TY", topics: "Java, Servlets, Advanced Data Structures, Web Tech.", amount: 50, batches: 5 },
  { year: "LY", topics: "System Design, Microservices, Cloud Computing, Advanced Architecture.", amount: 50, batches: 5 }
];

async function generateBatch(yearInfo: any) {
  const prompt = `
Generate exactly ${yearInfo.amount} highly distinct, creative, and completely new multiple-choice questions for engineering students in their ${yearInfo.year}.
The topics must be strictly about: ${yearInfo.topics}.
Output the result ONLY as a valid JSON array of objects. Do not include markdown formatting or backticks.
Each object must follow this exact schema:
{
  "text": "The question text",
  "topic": "One of the specific topics",
  "difficulty": "Medium",
  "targetYear": "${yearInfo.year}",
  "timeLimitSec": 45,
  "options": [
    { "text": "Correct Option", "isCorrect": true },
    { "text": "Wrong Option 1", "isCorrect": false },
    { "text": "Wrong Option 2", "isCorrect": false },
    { "text": "Wrong Option 3", "isCorrect": false }
  ]
}
Ensure exactly one option is true, and shuffle its position in the array. Ensure these are completely unique.
`;

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.9, responseMimeType: "application/json" }
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error(`Error for ${yearInfo.year}: ${response.status}`, err);
      return [];
    }

    const data = await response.json();
    let text = data.candidates[0].content.parts[0].text;
    return JSON.parse(text);
  } catch (err) {
    console.error(`Failed ${yearInfo.year}:`, err);
    return [];
  }
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function main() {
  console.log("Starting Generation & Upload for SY, TY, LY (Paid Tier Mode)...");
  
  const activeEvent = await prisma.quizEvent.findFirst({
    where: { status: 'ACTIVE' }
  });

  if (!activeEvent) throw new Error("No active event!");

  for (const year of YEARS) {
    let yearTotal = 0;
    
    for (let b = 0; b < year.batches; b++) {
      console.log(`[Batch ${b + 1}/${year.batches}] Generating ${year.amount} questions for ${year.year}...`);
      const questions = await generateBatch(year);
      console.log(`Generated ${questions.length} questions. Uploading...`);
      
      if (questions.length === 0) continue;

      let added = 0;
      for (let i = 0; i < questions.length; i += 25) {
        const chunk = questions.slice(i, i + 25);
        await prisma.$transaction(async (tx) => {
          for (const q of chunk) {
            const newQuestion = await tx.question.create({
              data: {
                eventId: activeEvent.id,
                text: q.text,
                topic: q.topic,
                difficulty: q.difficulty || "Medium",
                targetYear: q.targetYear || "ALL",
                durationSec: q.timeLimitSec ? parseInt(q.timeLimitSec) : null,
              }
            });

            const optionsData = q.options.map((opt: any, index: number) => ({
              questionId: newQuestion.id,
              text: opt.text,
              optionKey: String.fromCharCode(65 + index),
              isCorrect: Boolean(opt.isCorrect)
            }));

            await tx.option.createMany({ data: optionsData });
            added++;
          }
        }, { maxWait: 20000, timeout: 60000 });
      }
      yearTotal += added;
      console.log(`Successfully uploaded ${added} questions in this batch!`);
      
      // Just a tiny 2-second pause to prevent overloading the local DB connection pool
      await sleep(2000);
    }
    console.log(`Total for ${year.year}: ${yearTotal} questions.`);
  }
  
  console.log("All done! 1000 Question Bank reached.");
}

main().catch(console.error).finally(() => process.exit(0));
