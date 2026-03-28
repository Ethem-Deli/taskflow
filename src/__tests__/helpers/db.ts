import { PrismaClient } from "@prisma/client";

// A dedicated Prisma client for test setup/teardown.
// DATABASE_URL is set to file:./prisma/test.db via jest.env.ts before this loads.
export const testDb = new PrismaClient();

/** Wipes all data in the correct foreign-key order. */
export async function cleanDatabase(): Promise<void> {
  await testDb.comment.deleteMany();
  await testDb.task.deleteMany();
  await testDb.projectMember.deleteMany();
  await testDb.project.deleteMany();
  await testDb.user.deleteMany();
}
