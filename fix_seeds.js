const fs = require('fs');
const files = [
  './public/gemini_generated_seed.json',
  './public/gemini_massive_seed.json',
  './public/massive_local_seed.json',
  './public/question_bank_seed.json',
  './public/tyly1.json'
];

for (const file of files) {
  if (!fs.existsSync(file)) {
    console.log(`Skipping ${file} - does not exist.`);
    continue;
  }
  
  let raw = fs.readFileSync(file, 'utf8');
  
  // 1. Fix targetYear LY to Final Year
  raw = raw.replace(/"targetYear"\s*:\s*"LY"/g, '"targetYear": "Final Year"');
  
  // 2. Fix common JSON concatenation errors like "} ["
  // If they pasted two arrays together, they often have "}\n  ]\n[" or similar.
  // We already fixed tyly1 manually, but we can do a broad regex for `]\s*\[` -> `,`
  raw = raw.replace(/\]\s*\[/g, ',');
  
  // Also try to fix double closing brackets at the end if it's `] ]`
  raw = raw.replace(/\]\s*\]\s*$/, ']');
  
  // 3. Try to parse to ensure it's valid
  try {
    const json = JSON.parse(raw);
    fs.writeFileSync(file, JSON.stringify(json, null, 2));
    console.log(`✅ ${file} fixed and validated (${json.length} questions).`);
  } catch(e) {
    console.error(`❌ Error parsing ${file}: ${e.message}`);
    // Still write the targetYear fixes back so the user doesn't lose them
    fs.writeFileSync(file, raw);
  }
}
