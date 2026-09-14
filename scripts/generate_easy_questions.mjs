import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("Please set GEMINI_API_KEY in .env");
  process.exit(1);
}

const years = ['FY', 'SY', 'TY', 'LY'];
const questionsPerYear = 100;
const BATCH_SIZE = 25; // Generate 25 at a time to avoid token limits

async function generateBatch(year, count) {
  const prompt = `You are an expert curriculum designer for a college computer science/IT department. 
Generate a JSON array of ${count} "EASY" multiple-choice quiz questions for students in their ${year} (where FY=First Year, SY=Second Year, TY=Third Year, LY=Last Year).
The questions should cover general tech, computer science basics, logical reasoning, and year-appropriate programming concepts.

Ensure the output is strictly a JSON array of objects with the following schema:
[
  {
    "text": "The question text",
    "topic": "The broad topic category (e.g. Programming, Networking, Logic)",
    "difficulty": "EASY",
    "targetYear": "${year}",
    "durationSec": 30,
    "options": [
      { "text": "Option A", "isCorrect": true },
      { "text": "Option B", "isCorrect": false },
      { "text": "Option C", "isCorrect": false },
      { "text": "Option D", "isCorrect": false }
    ]
  }
]

CRITICAL INSTRUCTIONS:
- You must return ONLY the raw JSON array. Do not include markdown formatting (like \`\`\`json) or any other text.
- Make sure exactly one option has "isCorrect": true.
- Shuffle the correct option so it's not always the first one.
- Generate exactly ${count} questions.
`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${API_KEY}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error: ${response.status} ${errorText}`);
  }

  const data = await response.json();
  let text = data.candidates[0].content.parts[0].text.trim();
  
  // Clean up potential markdown formatting if the model still includes it
  if (text.startsWith('```json')) {
    text = text.substring(7);
  } else if (text.startsWith('```')) {
    text = text.substring(3);
  }
  if (text.endsWith('```')) {
    text = text.substring(0, text.length - 3);
  }

  try {
    const questions = JSON.parse(text);
    return questions;
  } catch (err) {
    console.error("Failed to parse JSON. Raw output:", text);
    throw err;
  }
}

async function main() {
  console.log("Starting question generation...");
  let allQuestions = [];

  for (const year of years) {
    console.log(`Generating ${questionsPerYear} questions for ${year}...`);
    let yearQuestions = [];
    
    // Process in batches
    for (let i = 0; i < questionsPerYear; i += BATCH_SIZE) {
      const batchCount = Math.min(BATCH_SIZE, questionsPerYear - i);
      console.log(`  - Fetching batch ${Math.floor(i/BATCH_SIZE) + 1}...`);
      
      let retries = 3;
      while (retries > 0) {
        try {
          const batch = await generateBatch(year, batchCount);
          yearQuestions = yearQuestions.concat(batch);
          console.log(`    -> Got ${batch.length} questions.`);
          break; // Success
        } catch (error) {
          console.error(`    -> Error fetching batch: ${error.message}`);
          retries--;
          if (retries === 0) throw new Error("Failed after 3 retries");
          console.log(`    -> Retrying... (${retries} left)`);
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    }
    
    console.log(`Finished ${year}: ${yearQuestions.length} questions generated.\n`);
    allQuestions = allQuestions.concat(yearQuestions);
  }

  const payload = {
    filename: "generated_easy_questions_400.json",
    questions: allQuestions
  };

  const outPath = path.join(process.cwd(), 'generated_easy_questions_400.json');
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));
  
  console.log(`\nSuccess! Generated ${allQuestions.length} questions and saved to ${outPath}`);
}

main().catch(console.error);
