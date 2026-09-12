const fs = require('fs');
const files = [
  './public/gemini_generated_seed.json',
  './public/gemini_massive_seed.json',
  './public/massive_local_seed.json',
  './public/question_bank_seed.json',
  './public/tyly1.json'
];

let total = 0;
const difficulties = { 'Easy': 0, 'Medium': 0, 'Hard': 0 };
const topics = new Set();
const topicCounts = {};

for (const file of files) {
  if (fs.existsSync(file)) {
    try {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      for (const q of data) {
        total++;
        
        // Count Difficulties
        if (difficulties[q.difficulty] !== undefined) {
          difficulties[q.difficulty]++;
        } else {
          difficulties[q.difficulty] = 1;
        }

        // Count Topics
        if (q.topic) {
          topics.add(q.topic);
          topicCounts[q.topic] = (topicCounts[q.topic] || 0) + 1;
        }
      }
    } catch(e) {
      console.error(`Error reading ${file}`);
    }
  }
}

console.log("=== Difficulty Distribution ===");
console.log(`Easy: ${difficulties['Easy']}`);
console.log(`Medium: ${difficulties['Medium']}`);
console.log(`Hard: ${difficulties['Hard']}`);
console.log("\n=== Topic Breakdown ===");
console.log(`Total Unique Topics: ${topics.size}`);

// Sort topics by frequency
const sortedTopics = Object.entries(topicCounts).sort((a, b) => b[1] - a[1]);
for (const [topic, count] of sortedTopics) {
  console.log(`- ${topic}: ${count}`);
}
