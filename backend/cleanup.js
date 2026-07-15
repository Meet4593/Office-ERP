const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function cleanup() {
  await prisma.user.deleteMany({
    where: { email: { in: ['RAVI', 'RAVI2', 'Meet2'] } }
  });
  console.log('Cleaned up test users');
}
cleanup();
