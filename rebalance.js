const fs = require('fs');
const files = [
  './public/gemini_generated_seed.json',
  './public/gemini_massive_seed.json',
  './public/massive_local_seed.json',
  './public/question_bank_seed.json',
  './public/tyly1.json'
];

// Pool all questions
let allQuestions = [];
for (const file of files) {
  if (fs.existsSync(file)) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    // attach source file so we can write it back
    data.forEach(q => {
      q._sourceFile = file;
      allQuestions.push(q);
    });
  }
}

// Shuffle array
for (let i = allQuestions.length - 1; i > 0; i--) {
  const j = Math.floor(Math.random() * (i + 1));
  [allQuestions[i], allQuestions[j]] = [allQuestions[j], allQuestions[i]];
}

// Re-assign target years evenly
const years = ['FY', 'SY', 'TY', 'Final Year'];
let yearIndex = 0;

allQuestions.forEach(q => {
  q.targetYear = years[yearIndex % years.length];
  yearIndex++;
});

// Group back to source files
const filesData = {};
files.forEach(f => filesData[f] = []);

allQuestions.forEach(q => {
  const source = q._sourceFile;
  delete q._sourceFile;
  filesData[source].push(q);
});

// Write back
for (const [file, data] of Object.entries(filesData)) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

console.log("Questions perfectly rebalanced across all years!");
