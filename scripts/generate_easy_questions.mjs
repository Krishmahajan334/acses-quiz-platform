import fs from 'fs';

const topics = {
  "FY": ["Basic Physics", "Basic Chemistry", "Mathematics", "Introduction to C", "Engineering Graphics", "Basic Electrical Engineering"],
  "SY": ["Data Structures", "Digital Logic", "Object Oriented Programming (C++)", "Computer Architecture", "Discrete Mathematics"],
  "TY": ["Operating Systems", "Database Management Systems", "Computer Networks", "Software Engineering", "Theory of Computation", "Web Technology"],
  "LY": ["Artificial Intelligence", "Machine Learning", "Cloud Computing", "Cyber Security", "Internet of Things", "Blockchain Basics"]
};

// Templates for basic easy questions
const templates = [
  {
    template: "What does {concept} primarily deal with in {topic}?",
    answers: ["The fundamental study of {concept}", "Complex optimization", "Hardware level implementation", "Network routing protocols"]
  },
  {
    template: "Which of the following is a core component of {topic}?",
    answers: ["{concept}", "Quantum Entanglement", "Dark Matter", "Astrophysics"]
  },
  {
    template: "In the context of {topic}, what is the primary purpose of {concept}?",
    answers: ["To manage or represent {concept} effectively", "To increase physical weight", "To decrease power consumption", "To colorize the output"]
  },
  {
    template: "Which term is most closely associated with {topic}?",
    answers: ["{concept}", "Photosynthesis", "Mitosis", "Thermodynamics"]
  }
];

const conceptsByTopic = {
  "Basic Physics": ["Newton's Laws", "Kinematics", "Electromagnetism", "Thermodynamics", "Optics"],
  "Basic Chemistry": ["Atomic Structure", "Chemical Bonding", "Periodic Table", "Stoichiometry", "States of Matter"],
  "Mathematics": ["Calculus", "Linear Algebra", "Probability", "Statistics", "Differential Equations"],
  "Introduction to C": ["Pointers", "Arrays", "Functions", "Loops", "Variables"],
  "Engineering Graphics": ["Orthographic Projections", "Isometric Views", "Sections of Solids", "Development of Surfaces", "AutoCAD Basics"],
  "Basic Electrical Engineering": ["Ohm's Law", "Kirchhoff's Laws", "AC Circuits", "Transformers", "DC Motors"],
  "Data Structures": ["Arrays", "Linked Lists", "Stacks", "Queues", "Trees", "Graphs"],
  "Digital Logic": ["Boolean Algebra", "Logic Gates", "Combinational Circuits", "Sequential Circuits", "Flip-Flops"],
  "Object Oriented Programming (C++)": ["Classes", "Objects", "Inheritance", "Polymorphism", "Encapsulation"],
  "Computer Architecture": ["CPU Design", "Memory Hierarchy", "Pipelining", "Instruction Sets", "I/O Organization"],
  "Discrete Mathematics": ["Sets", "Relations", "Functions", "Graph Theory", "Combinatorics"],
  "Operating Systems": ["Processes", "Threads", "Memory Management", "File Systems", "Deadlocks"],
  "Database Management Systems": ["Relational Model", "SQL", "Normalization", "Transactions", "Concurrency Control"],
  "Computer Networks": ["OSI Model", "TCP/IP", "Routing", "Switching", "Network Security"],
  "Software Engineering": ["SDLC", "Agile", "Requirements Engineering", "Software Design", "Testing"],
  "Theory of Computation": ["Automata Theory", "Regular Languages", "Context-Free Grammars", "Turing Machines", "Decidability"],
  "Web Technology": ["HTML", "CSS", "JavaScript", "React", "Node.js"],
  "Artificial Intelligence": ["Search Algorithms", "Knowledge Representation", "Machine Learning", "Natural Language Processing", "Expert Systems"],
  "Machine Learning": ["Supervised Learning", "Unsupervised Learning", "Neural Networks", "Deep Learning", "Reinforcement Learning"],
  "Cloud Computing": ["IaaS", "PaaS", "SaaS", "Virtualization", "AWS"],
  "Cyber Security": ["Cryptography", "Network Security", "Malware", "Ethical Hacking", "Risk Management"],
  "Internet of Things": ["Sensors", "Actuators", "IoT Protocols", "Edge Computing", "Smart Homes"],
  "Blockchain Basics": ["Cryptography", "Distributed Ledgers", "Consensus Mechanisms", "Smart Contracts", "Cryptocurrencies"]
};

const years = ["FY", "SY", "TY", "LY"];
const totalPerYear = 100;
let questions = [];

for (const year of years) {
  const yearTopics = topics[year];
  let generatedForYear = 0;
  
  while (generatedForYear < totalPerYear) {
    for (const topic of yearTopics) {
      if (generatedForYear >= totalPerYear) break;
      
      const concepts = conceptsByTopic[topic] || ["Basic Concept"];
      const concept = concepts[Math.floor(Math.random() * concepts.length)];
      
      const templateObj = templates[Math.floor(Math.random() * templates.length)];
      const text = templateObj.template.replace(/\{topic\}/g, topic).replace(/\{concept\}/g, concept);
      
      // Shuffle answers but keep track of the correct one (index 0 is always correct in template)
      let options = templateObj.answers.map((ans, idx) => ({
        text: ans.replace(/\{topic\}/g, topic).replace(/\{concept\}/g, concept),
        isCorrect: idx === 0,
        originalIndex: idx
      }));
      
      // Fisher-Yates shuffle
      for (let i = options.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }
      
      // Assign keys A, B, C, D
      const keys = ["A", "B", "C", "D"];
      options = options.map((opt, idx) => ({
        text: opt.text,
        isCorrect: opt.isCorrect,
        optionKey: keys[idx]
      }));
      
      questions.push({
        text,
        difficulty: "EASY",
        topic: topic,
        targetYear: year,
        options
      });
      
      generatedForYear++;
    }
  }
}

fs.writeFileSync('./public/easy_questions_seed.json', JSON.stringify(questions, null, 2));
console.log(`Generated ${questions.length} easy questions!`);
