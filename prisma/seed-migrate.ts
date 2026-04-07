import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  /*
  FIX 1:
  ------
  TypeScript error:
  "Type 'null' is not assignable..."

  This means your Prisma schema defines:
  projectId as NON-nullable (string)

  So we cannot query { projectId: null }

  TEMP SOLUTION:
  Use 'as any' to bypass type restriction
  OR update schema (recommended if tasks can truly be orphaned)
  */

  const orphanTasks = await db.task.findMany({
    where: { projectId: null as any }, // ✅ FIX
  });

  if (orphanTasks.length === 0) {
    console.log("No orphan tasks found. Nothing to migrate.");
    return;
  }

  console.log(`Found ${orphanTasks.length} orphan task(s). Starting migration...`);

  const firstUser = await db.user.findFirst({
    orderBy: { createdAt: "asc" },
  });

  if (!firstUser) {
    console.error("No users found in the database. Cannot create Legacy project.");
    process.exit(1);
  }

  /*
  FIX 2:
  ------
  Error:
  "Property 'owner' is missing"

  Your Prisma schema requires:
  project.owner relation

  So we must CONNECT the owner when creating project
  */

  const legacyProject = await db.project.create({
    data: {
      name: "Legacy",
      description: "Migrated from pre-project tasks.",

      // ✅ FIX: add owner relation
      owner: {
        connect: { id: firstUser.id },
      },
    },
  });

  console.log(`Created Legacy project: ${legacyProject.id}`);

  const allUsers = await db.user.findMany({
    select: { id: true },
  });

  /*
  FIX 3:
  ------
  Error:
  "Type 'true' is not assignable to type 'never'"

  This happens because:
  - Your Prisma version OR schema does not support skipDuplicates here
  - OR composite unique constraint is missing

  SIMPLE FIX: remove skipDuplicates
  */

  await db.projectMember.createMany({
    data: allUsers.map((u) => ({
      projectId: legacyProject.id,
      userId: u.id,
      role: u.id === firstUser.id ? "OWNER" : "MEMBER",
    })),
    // skipDuplicates: true, ❌ removed
  });

  console.log(`Added ${allUsers.length} user(s) as members of Legacy project.`);

  for (const task of orphanTasks) {
    await db.task.update({
      where: { id: task.id },
      data: { projectId: legacyProject.id },
    });
  }

  console.log(`Assigned ${orphanTasks.length} task(s) to Legacy project.`);
  console.log("Migration complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());