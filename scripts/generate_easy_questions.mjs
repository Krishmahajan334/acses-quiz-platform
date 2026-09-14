import fs from 'fs';

const topics = {
  "FY": ["Basic Physics", "Basic Chemistry", "Mathematics", "Introduction to C", "Engineering Graphics", "Basic Electrical Engineering"],
  "SY": ["Data Structures", "Digital Logic", "Object Oriented Programming (C++)", "Computer Architecture", "Discrete Mathematics"],
  "TY": ["Operating Systems", "Database Management Systems", "Computer Networks", "Software Engineering", "Theory of Computation", "Web Technology"],
  "LY": ["Artificial Intelligence", "Machine Learning", "Cloud Computing", "Cyber Security", "Internet of Things", "Blockchain Basics"]
};

const years = ["FY", "SY", "TY", "LY"];
const totalPerYear = 100;
let questions = [];

for (const year of years) {
  const yearTopics = topics[year];
  for (let i = 0; i < totalPerYear; i++) {
    const topic = yearTopics[i % yearTopics.length];
    
    questions.push({
      text: `Easy Question ${i + 1} for ${year} (${topic}): What is the most fundamental concept of this topic?`,
      difficulty: "EASY",
      topic: topic,
      targetYear: year,
      options: [
        { text: `Correct Answer Option`, isCorrect: true, optionKey: "A" },
        { text: `Distractor Option 1`, isCorrect: false, optionKey: "B" },
        { text: `Distractor Option 2`, isCorrect: false, optionKey: "C" },
        { text: `Distractor Option 3`, isCorrect: false, optionKey: "D" }
      ]
    });
  }
}

fs.writeFileSync('./public/easy_questions_seed.json', JSON.stringify(questions, null, 2));
console.log(`Generated ${questions.length} easy questions!`);
