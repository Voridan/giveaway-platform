import { PrismaService } from '@app/common';

export async function clearDb(prismaService: PrismaService) {
  const tables = ['User', 'Giveaway', 'Participant', 'Winner'];

  for (const table of tables) {
    await prismaService.$executeRawUnsafe(
      `TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE;`,
    );
  }
}
