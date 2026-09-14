import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.admin.update({
    where: { username: 'admin' },
    data: { role: 'SUPER_ADMIN' }
  });
  console.log("Updated admin role to SUPER_ADMIN");
}
main().catch(console.error).finally(() => prisma.$disconnect());
