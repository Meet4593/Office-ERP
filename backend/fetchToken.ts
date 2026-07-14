import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'meet17727@gmail.com' },
    select: { resetToken: true }
  });
  console.log('RESET TOKEN:', user?.resetToken);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
