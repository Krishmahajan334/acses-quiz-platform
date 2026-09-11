const fs = require('fs');
const path = require('path');

const API_KEY = process.env.GEMINI_API_KEY || "YOUR_API_KEY_HERE";
const MODEL = "gemini-3.6-flash";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
const OUTPUT_FILE = path.join(__dirname, '..', 'public', 'gemini_massive_seed.json');

const YEARS = [
  { year: "FY", topics: "Physics, Basic Electronics, basic Mathematics, very basic Intro to CS.", totalNeeded: 250 },
  { year: "SY", topics: "Data Structures, C++, Object Oriented Programming, Operating Systems.", totalNeeded: 250 },
  { year: "TY", topics: "Java, Servlets, Advanced Data Structures, Web Tech.", totalNeeded: 250 },
  { year: "Final Year", topics: "System Design, Microservices, Cloud Computing, Advanced Architecture.", totalNeeded: 250 }
];

const BATCH_SIZE = 25; // Smaller batch size to prevent API truncation

async function generateBatch(yearInfo) {
  const prompt = `
Generate exactly ${BATCH_SIZE} highly distinct, creative, and completely new multiple-choice questions for engineering students in their ${yearInfo.year}.
The topics must be strictly about: ${yearInfo.topics}.
Output the result ONLY as a valid JSON array of objects. Do not include markdown formatting or backticks.
Each object must follow this exact schema:
{
  "text": "The question text",
  "topic": "One of the specific topics",
  "difficulty": "Easy", // Easy, Medium, or Hard depending on the year
  "targetYear": "${yearInfo.year}",
  "timeLimitSec": 45,
  "options": [
    { "text": "Correct Option", "isCorrect": true },
    { "text": "Wrong Option 1", "isCorrect": false },
    { "text": "Wrong Option 2", "isCorrect": false },
    { "text": "Wrong Option 3", "isCorrect": false }
  ]
}
Ensure exactly one option is true, and shuffle its position in the array. Ensure these are completely unique from common trivial questions.
`;

  let retries = 5;
  while (retries > 0) {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.9 }
        })
      });

      if (!response.ok) {
        if (response.status === 429 || response.status === 503 || response.status === 500) {
           console.log(`[${yearInfo.year}] Rate limit or API error (${response.status}). Retrying in 10s...`);
           await new Promise(r => setTimeout(r, 10000));
           retries--;
           continue;
        }
        const err = await response.text();
        console.error(`Error fetching for ${yearInfo.year}:`, err);
        return [];
      }

      const data = await response.json();
      let text = data.candidates[0].content.parts[0].text;
      
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) return parsed;
      return [];
    } catch (err) {
      console.error(`[${yearInfo.year}] Failed to parse/generate batch:`, err.message);
      console.log(`Retrying in 10s...`);
      await new Promise(r => setTimeout(r, 10000));
      retries--;
    }
  }
  return [];
}

async function main() {
  console.log("Starting massive AI Generation of 1000 Questions...");
  
  // Initialize file
  fs.writeFileSync(OUTPUT_FILE, '[\n');
  let totalGenerated = 0;
  let isFirst = true;

  for (const year of YEARS) {
    let yearGenerated = 0;
    while (yearGenerated < year.totalNeeded) {
      console.log(`Requesting batch for ${year.year} (${yearGenerated}/${year.totalNeeded})...`);
      const batch = await generateBatch(year);
      
      if (batch.length > 0) {
        // Write incrementally
        for (const q of batch) {
          if (!isFirst) fs.appendFileSync(OUTPUT_FILE, ',\n');
          fs.appendFileSync(OUTPUT_FILE, JSON.stringify(q, null, 2));
          isFirst = false;
        }
        yearGenerated += batch.length;
        totalGenerated += batch.length;
        console.log(`+ Added ${batch.length} questions. Total: ${totalGenerated}/1000`);
      } else {
        console.log(`! Failed to generate a batch for ${year.year}. Skipping to next batch.`);
      }
      
      // Delay to respect rate limits
      await new Promise(r => setTimeout(r, 5000));
    }
  }

  fs.appendFileSync(OUTPUT_FILE, '\n]');
  console.log(`\n🎉 Success! Wrote ${totalGenerated} questions to ${OUTPUT_FILE}`);
}

main();
