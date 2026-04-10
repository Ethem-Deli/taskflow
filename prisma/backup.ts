import "dotenv/config";
import { execSync } from "child_process";
import { existsSync } from "fs";
import path from "path";

function main() {
  console.log("💾 Starting database backup...");

  // Get database URL from environment
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error("❌ DATABASE_URL environment variable not set");
    process.exit(1);
  }

  // Check if it's a SQLite database
  if (!databaseUrl.startsWith("file:")) {
    console.error("❌ Backup script only supports SQLite databases");
    process.exit(1);
  }

  // Extract database file path
  const dbPath = databaseUrl.replace("file:", "");
  const dbFullPath = path.resolve(dbPath);

  if (!existsSync(dbFullPath)) {
    console.error(`❌ Database file not found: ${dbFullPath}`);
    process.exit(1);
  }

  // Create backup filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
  const backupDir = path.dirname(dbFullPath);
  const backupFilename = `backup-${timestamp}.db`;
  const backupPath = path.join(backupDir, backupFilename);

  try {
    // Copy the database file
    execSync(`cp "${dbFullPath}" "${backupPath}"`, { stdio: "inherit" });

    console.log(`✅ Database backup created: ${backupPath}`);

    // Get file size
    const stats = execSync(`ls -lh "${backupPath}" | awk '{print $5}'`, { encoding: "utf8" }).trim();
    console.log(`📊 Backup size: ${stats}`);

    console.log("\n💡 To restore from this backup, set DATABASE_URL to:");
    console.log(`   DATABASE_URL="file:${backupPath}"`);
    console.log("   Then run: npx prisma migrate deploy");

  } catch (error) {
    console.error("❌ Backup failed:", error);
    process.exit(1);
  }
}

main();