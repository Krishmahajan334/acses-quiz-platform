const fs = require('fs');
const files = [
  './public/gemini_generated_seed.json',
  './public/gemini_massive_seed.json',
  './public/massive_local_seed.json',
  './public/question_bank_seed.json',
  './public/tyly1.json'
];

const seen = new Set();
let totalRemoved = 0;

for (const file of files) {
  if (fs.existsSync(file)) {
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      const uniqueData = [];
      let removed = 0;

      for (const q of data) {
        // use lower case and trim to ensure fuzzy matches are caught
        const normalized = q.text.toLowerCase().trim();
        if (seen.has(normalized)) {
          removed++;
          totalRemoved++;
        } else {
          seen.add(normalized);
          uniqueData.push(q);
        }
      }

      if (removed > 0) {
        fs.writeFileSync(file, JSON.stringify(uniqueData, null, 2));
        console.log(`- Removed ${removed} duplicates from ${file.replace('./public/', '')}`);
      } else {
        console.log(`- No duplicates in ${file.replace('./public/', '')}`);
      }
    } catch(e) {
      console.error(`Error processing ${file}`);
    }
  }
}

console.log(`Total duplicate questions removed across all files: ${totalRemoved}`);
