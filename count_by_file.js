const fs = require('fs');
const files = [
  './public/gemini_generated_seed.json',
  './public/gemini_massive_seed.json',
  './public/massive_local_seed.json',
  './public/question_bank_seed.json',
  './public/tyly1.json'
];

console.log("=== Questions per File ===");
for (const file of files) {
  if (fs.existsSync(file)) {
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      console.log(`- ${file.replace('./public/', '')}: ${data.length} questions`);
    } catch(e) {
      console.error(`- ${file.replace('./public/', '')}: Error reading file`);
    }
  }
}
