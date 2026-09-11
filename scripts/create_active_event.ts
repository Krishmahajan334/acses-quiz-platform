import { prisma } from '../src/lib/db';

async function main() {
  console.log("Creating active event in Turso...");
  const event = await prisma.quizEvent.create({
    data: {
      name: "ACSES Mega Technical Quiz",
      durationSec: 1800, // 30 mins
      questionCount: 30, // Show 30 random questions
      passPercent: 50,
      status: "ACTIVE"
    }
  });
  console.log("Successfully created active event:", event);
}

main()
  .catch(console.error)
  .finally(() => process.exit(0));
