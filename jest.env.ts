// This file runs before the test framework is installed (setupFiles).
// Setting DATABASE_URL here ensures the Prisma singleton uses the test database
// when it is first imported by any test module.
process.env.DATABASE_URL = "file:./prisma/test.db";
process.env.NEXTAUTH_SECRET = "test-secret-for-jest";
