const fs = require('fs');

/**
 * INSTRUCTIONS:
 * 1. To run this script and generate actual AI questions, you need the @google/genai SDK:
 *    npm install @google/genai
 * 2. Set your API key in your terminal before running:
 *    export GEMINI_API_KEY="your_api_key_here"
 * 3. Run the script:
 *    node scripts/generate_questions.js
 */

async function generateQuestions() {
  let GoogleGenAI;
  try {
    const genai = require('@google/genai');
    GoogleGenAI = genai.GoogleGenAI;
  } catch (e) {
    console.error("Please install the SDK first: npm install @google/genai");
    process.exit(1);
  }

  const ai = new GoogleGenAI({});

  const targets = [
    { year: "FY", count: 100, prompt: "Generate multiple-choice questions for First Year engineering students. Topics: Basic Physics, Basic Electronics, very basic introductory programming." },
    { year: "SY", count: 300, prompt: "Generate multiple-choice questions for Second Year computer science students. Topics: C, C++, Data Structures, Algorithms, Object Oriented Programming, Microprocessors, Operating Systems." },
    { year: "TY", count: 300, prompt: "Generate multiple-choice questions for Third Year computer science students. Topics: Java, Java Servlets, deep OOP, advanced C++, advanced DSA." },
    { year: "Final Year", count: 300, prompt: "Generate multiple-choice questions for Final Year computer science students. Topics: Advanced CS, System Design, Microservices, Cloud Computing, Advanced databases, Machine Learning basics." },
  ];

  let allQuestions = [];

  for (const target of targets) {
    console.log(`Generating ${target.count} questions for ${target.year}...`);
    
    // To avoid hitting token limits in a single shot, we'd loop in batches of 50
    const batches = Math.ceil(target.count / 50);
    
    for (let i = 0; i < batches; i++) {
      console.log(`  Batch ${i+1}/${batches}...`);
      
      const prompt = `
        ${target.prompt}
        Generate EXACTLY 50 multiple choice questions.
        Return ONLY a valid JSON array matching this exact schema:
        [
          {
            "text": "Question text here?",
            "topic": "Topic Name",
            "difficulty": "Easy/Medium/Hard",
            "targetYear": "${target.year}",
            "durationSec": 45,
            "options": [
              { "text": "Option A", "isCorrect": false },
              { "text": "Option B", "isCorrect": true },
              { "text": "Option C", "isCorrect": false },
              { "text": "Option D", "isCorrect": false }
            ]
          }
        ]
        Do not use markdown formatting like \`\`\`json. Return raw JSON.
      `;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            temperature: 0.7
          }
        });

        let text = response.text;
        // Clean up markdown if AI includes it
        if (text.startsWith('\`\`\`json')) text = text.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '');
        
        const parsed = JSON.parse(text);
        allQuestions.push(...parsed);
      } catch (err) {
        console.error(`Failed on batch ${i+1} for ${target.year}:`, err.message);
      }
    }
  }

  fs.writeFileSync('./public/massive_question_bank.json', JSON.stringify(allQuestions, null, 2));
  console.log(`\nSuccess! Wrote ${allQuestions.length} questions to public/massive_question_bank.json`);
}

generateQuestions();
