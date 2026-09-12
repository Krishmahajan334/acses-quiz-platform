const fs = require('fs');
const files = [
  './public/gemini_generated_seed.json',
  './public/gemini_massive_seed.json',
  './public/massive_local_seed.json',
  './public/question_bank_seed.json',
  './public/tyly1.json'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      const counts = { 'FY': 0, 'SY': 0, 'TY': 0, 'Final Year': 0 };
      
      for (const q of data) {
        if (counts[q.targetYear] !== undefined) {
          counts[q.targetYear]++;
        } else {
          counts[q.targetYear] = 1;
        }
      }
      
      console.log(`\n📄 ${file.replace('./public/', '')} (${data.length} Total):`);
      if (counts['FY'] > 0) console.log(`   - FY: ${counts['FY']}`);
      if (counts['SY'] > 0) console.log(`   - SY: ${counts['SY']}`);
      if (counts['TY'] > 0) console.log(`   - TY: ${counts['TY']}`);
      if (counts['Final Year'] > 0) console.log(`   - Final Year: ${counts['Final Year']}`);
      
    } catch(e) {
      console.error(`- ${file.replace('./public/', '')}: Error reading file`);
    }
  }
}
