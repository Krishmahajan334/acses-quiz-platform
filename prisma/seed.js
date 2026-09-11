const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const event = await prisma.quizEvent.create({
    data: {
      name: "Computer Science Quiz 2026",
      durationSec: 300, // 5 minutes
      questionCount: 3,
      passPercent: 66,
      status: "ACTIVE"
    }
  });

  const questions = [
    {
      text: "What does HTML stand for?",
      options: [
        { text: "Hyper Text Markup Language", isCorrect: true, key: "A" },
        { text: "Home Tool Markup Language", isCorrect: false, key: "B" },
        { text: "Hyperlinks and Text Markup Language", isCorrect: false, key: "C" }
      ]
    },
    {
      text: "Which of the following is not a JavaScript framework?",
      options: [
        { text: "React", isCorrect: false, key: "A" },
        { text: "Django", isCorrect: true, key: "B" },
        { text: "Vue", isCorrect: false, key: "C" },
        { text: "Angular", isCorrect: false, key: "D" }
      ]
    },
    {
      text: "What is the time complexity of binary search?",
      options: [
        { text: "O(1)", isCorrect: false, key: "A" },
        { text: "O(n)", isCorrect: false, key: "B" },
        { text: "O(n^2)", isCorrect: false, key: "C" },
        { text: "O(log n)", isCorrect: true, key: "D" }
      ]
    },
    {
      text: "Which data structure uses LIFO?",
      options: [
        { text: "Queue", isCorrect: false, key: "A" },
        { text: "Stack", isCorrect: true, key: "B" },
        { text: "Linked List", isCorrect: false, key: "C" }
      ]
    }
  ];

  for (const q of questions) {
    await prisma.question.create({
      data: {
        eventId: event.id,
        text: q.text,
        difficulty: "Beginner",
        topic: "General CS",
        options: {
          create: q.options.map(o => ({
            text: o.text,
            isCorrect: o.isCorrect,
            optionKey: o.key
          }))
        }
      }
    });
  }

  console.log("Database seeded successfully!");
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
