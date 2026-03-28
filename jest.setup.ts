// Runs after the test framework is installed (setupFilesAfterFramework).
// Any global mock configuration goes here.

// Silence Prisma logs during tests
process.env.DATABASE_URL = "file:./prisma/test.db";
