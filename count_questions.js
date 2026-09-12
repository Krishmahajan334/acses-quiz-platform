const fs = require('fs');
const files = [
  './public/gemini_generated_seed.json',
  './public/gemini_massive_seed.json',
  './public/massive_local_seed.json',
  './public/question_bank_seed.json',
  './public/tyly1.json'
];

const counts = {
  'FY': 0,
  'SY': 0,
  'TY': 0,
  'Final Year': 0,
  'ALL': 0
};

let total = 0;

for (const file of files) {
  if (fs.existsSync(file)) {
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      for (const q of data) {
        if (counts[q.targetYear] !== undefined) {
          counts[q.targetYear]++;
        } else {
          // just in case there are others
          counts[q.targetYear] = 1;
        }
        total++;
      }
    } catch(e) {
      console.error(`Error reading ${file}`);
    }
  }
}

console.log("=== Question Counts ===");
console.log(`Total Questions: ${total}`);
console.log(`FY (First Year): ${counts['FY'] || 0}`);
console.log(`SY (Second Year): ${counts['SY'] || 0}`);
console.log(`TY (Third Year): ${counts['TY'] || 0}`);
console.log(`LY (Final Year): ${counts['Final Year'] || 0}`);
console.log(`ALL (General): ${counts['ALL'] || 0}`);
