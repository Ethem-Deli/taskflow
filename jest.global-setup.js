// Runs once before all test suites. Pushes the Prisma schema to the test SQLite database.
const { execSync } = require("child_process");

module.exports = async function () {
  execSync(
    "npx prisma db push --schema=./prisma/schema.prisma --skip-generate",
    {
      env: { ...process.env, DATABASE_URL: "file:./prisma/test.db" },
      stdio: "inherit",
    }
  );
};
