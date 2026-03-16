import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  const orphanTasks = await db.task.findMany({
    where: { projectId: null },
  });

  if (orphanTasks.length === 0) {
    console.log("No orphan tasks found. Nothing to migrate.");
    return;
  }

  console.log(`Found ${orphanTasks.length} orphan task(s). Starting migration...`);

  const firstUser = await db.user.findFirst({ orderBy: { createdAt: "asc" } });

  if (!firstUser) {
    console.error("No users found in the database. Cannot create Legacy project.");
    process.exit(1);
  }

  const legacyProject = await db.project.create({
    data: { name: "Legacy", description: "Migrated from pre-project tasks." },
  });

  console.log(`Created Legacy project: ${legacyProject.id}`);

  const allUsers = await db.user.findMany({ select: { id: true } });

  await db.projectMember.createMany({
    data: allUsers.map((u) => ({
      projectId: legacyProject.id,
      userId: u.id,
      role: u.id === firstUser.id ? "OWNER" : "MEMBER",
    })),
    skipDuplicates: true,
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
