const fs = require('fs');
const path = require('path');

const API_KEY = process.env.GEMINI_API_KEY || "YOUR_API_KEY_HERE";
const MODEL = "gemini-3.6-flash";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

const YEARS = [
  { year: "FY", topics: "Physics, Basic Electronics, basic Mathematics, very basic Intro to CS.", count: 40 },
  { year: "SY", topics: "Data Structures, C++, Object Oriented Programming, Operating Systems.", count: 40 },
  { year: "TY", topics: "Java, Servlets, Advanced Data Structures, Web Tech.", count: 40 },
  { year: "Final Year", topics: "System Design, Microservices, Cloud Computing, Advanced Architecture.", count: 40 }
];

async function generateQuestionsForYear(yearInfo) {
  const prompt = `
Generate exactly ${yearInfo.count} high-quality, distinct multiple-choice questions for engineering students in their ${yearInfo.year}.
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
Make sure exactly one option is correct. The correct option should be randomly placed (don't always put it first).
Make the questions realistic for a college technical quiz.
`;

  let retries = 3;
  while (retries > 0) {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7 }
        })
      });

      if (!response.ok) {
        if (response.status === 429 || response.status === 503) {
           console.log(`Rate limit or 503. Retrying in 5s...`);
           await new Promise(r => setTimeout(r, 5000));
           retries--;
           continue;
        }
        const err = await response.text();
        console.error(`Error fetching for ${yearInfo.year}:`, err);
        return [];
      }

      const data = await response.json();
      let text = data.candidates[0].content.parts[0].text;
      
      // Clean up markdown if model still included it
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      return JSON.parse(text);
    } catch (err) {
      console.error(`Failed to generate questions for ${yearInfo.year}:`, err.message);
      if (retries > 1) {
          console.log(`Retrying in 5s...`);
          await new Promise(r => setTimeout(r, 5000));
          retries--;
          continue;
      }
      return [];
    }
  }
  return [];
}

async function main() {
  console.log("Starting AI Generation of Questions...");
  let allQuestions = [];

  for (const year of YEARS) {
    console.log(`Generating ${year.count} questions for ${year.year}...`);
    const q = await generateQuestionsForYear(year);
    console.log(`Received ${q.length} questions for ${year.year}.`);
    allQuestions = allQuestions.concat(q);
  }

  const outputPath = path.join(__dirname, '..', 'public', 'gemini_generated_seed.json');
  fs.writeFileSync(outputPath, JSON.stringify(allQuestions, null, 2));
  console.log(`\nSuccess! Wrote ${allQuestions.length} questions to ${outputPath}`);
}

main();
