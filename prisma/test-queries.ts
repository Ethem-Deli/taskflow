import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

interface TestResult {
  name: string;
  status: "PASS" | "FAIL";
  duration: number;
  message?: string;
}

const results: TestResult[] = [];

async function runTest(testName: string, testFn: () => Promise<void>) {
  const startTime = Date.now();
  try {
    await testFn();
    const duration = Date.now() - startTime;
    results.push({ name: testName, status: "PASS", duration });
    console.log(`✓ ${testName} (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - startTime;
    results.push({
      name: testName,
      status: "FAIL",
      duration,
      message: error instanceof Error ? error.message : String(error),
    });
    console.error(`✗ ${testName} (${duration}ms)`, error);
  }
}

async function main() {
  console.log("🧪 Starting Database Query Tests with Real Data\n");

  // ============================================================
  // SETUP: Create test data
  // ============================================================
  console.log("📝 Setting up test data...\n");

  // Create test users
  const hashedPassword = await bcrypt.hash("password123", 10);

  const user1 = await db.user.upsert({
    where: { email: "alice@test.com" },
    update: {},
    create: {
      email: "alice@test.com",
      name: "Alice Johnson",
      passwordHash: hashedPassword,
    },
  });

  const user2 = await db.user.upsert({
    where: { email: "bob@test.com" },
    update: {},
    create: {
      email: "bob@test.com",
      name: "Bob Smith",
      passwordHash: hashedPassword,
    },
  });

  const user3 = await db.user.upsert({
    where: { email: "charlie@test.com" },
    update: {},
    create: {
      email: "charlie@test.com",
      name: "Charlie Brown",
      passwordHash: hashedPassword,
    },
  });

  // Create test projects
  const project1 = await db.project.create({
    data: {
      name: "Web App Redesign",
      description: "Redesign the entire web application UI",
      ownerId: user1.id,
    },
  });

  const project2 = await db.project.create({
    data: {
      name: "Mobile App",
      description: "Native mobile application development",
      ownerId: user2.id,
    },
  });

  // Create project memberships
  await db.projectMember.createMany({
    data: [
      { projectId: project1.id, userId: user1.id, role: "OWNER" },
      { projectId: project1.id, userId: user2.id, role: "MEMBER" },
      { projectId: project1.id, userId: user3.id, role: "MEMBER" },
      { projectId: project2.id, userId: user2.id, role: "OWNER" },
      { projectId: project2.id, userId: user1.id, role: "MEMBER" },
    ],
  });

  // Create test tasks
  const task1 = await db.task.create({
    data: {
      title: "Design homepage mockup",
      description: "Create high-fidelity mockups for the new homepage",
      priority: "HIGH",
      status: "IN_PROGRESS",
      projectId: project1.id,
      assigneeId: user2.id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    },
  });

  const task2 = await db.task.create({
    data: {
      title: "Implement authentication",
      description: "Add JWT-based authentication system",
      priority: "HIGH",
      status: "TODO",
      projectId: project1.id,
      assigneeId: user3.id,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
    },
  });

  const task3 = await db.task.create({
    data: {
      title: "Update documentation",
      description: "Update API documentation",
      priority: "MEDIUM",
      status: "TODO",
      projectId: project1.id,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    },
  });

  const task4 = await db.task.create({
    data: {
      title: "Setup CI/CD pipeline",
      description: "Configure GitHub Actions for deployment",
      priority: "HIGH",
      status: "IN_PROGRESS",
      projectId: project2.id,
      assigneeId: user2.id,
    },
  });

  // Create test comments
  const comment1 = await db.comment.create({
    data: {
      content: "Started working on the homepage design today",
      taskId: task1.id,
      userId: user2.id,
    },
  });

  const comment2 = await db.comment.create({
    data: {
      content: "Need clarification on the authentication flow",
      taskId: task2.id,
      userId: user3.id,
    },
  });

  const comment3 = await db.comment.create({
    data: {
      content: "Let me know when you're ready to review",
      taskId: task1.id,
      userId: user1.id,
    },
  });

  console.log("✓ Test data created\n");

  // ============================================================
  // TESTS: Query Performance and Correctness
  // ============================================================
  console.log("🧪 Running query tests...\n");

  // Test 1: Get all projects for a user
  await runTest("Get all projects for user", async () => {
    const memberships = await db.projectMember.findMany({
      where: { userId: user1.id },
      include: {
        project: {
          select: { id: true, name: true, description: true },
        },
      },
    });

    if (memberships.length === 0) {
      throw new Error("Expected to find projects for user");
    }
    console.log(`  → Found ${memberships.length} projects`);
  });

  // Test 2: Get all tasks for a project with filters
  await runTest("Get all tasks in project (with status filter)", async () => {
    const tasks = await db.task.findMany({
      where: {
        projectId: project1.id,
        status: "IN_PROGRESS",
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    if (tasks.length === 0) {
      throw new Error("Expected to find IN_PROGRESS tasks");
    }
    console.log(`  → Found ${tasks.length} IN_PROGRESS tasks`);
  });

  // Test 3: Get tasks by priority
  await runTest("Get all HIGH priority tasks in project", async () => {
    const tasks = await db.task.findMany({
      where: {
        projectId: project1.id,
        priority: "HIGH",
      },
    });

    if (tasks.length < 2) {
      throw new Error("Expected to find multiple HIGH priority tasks");
    }
    console.log(`  → Found ${tasks.length} HIGH priority tasks`);
  });

  // Test 4: Get recent comments on a task
  await runTest("Get comments for a task (sorted by date)", async () => {
    const task = await db.task.findUnique({
      where: { id: task1.id },
      include: {
        comments: {
          orderBy: { createdAt: "asc" },
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!task || task.comments.length === 0) {
      throw new Error("Expected to find comments on task");
    }
    console.log(`  → Found ${task.comments.length} comments on task`);
  });

  // Test 5: Get all members of a project
  await runTest("Get all project members", async () => {
    const members = await db.projectMember.findMany({
      where: { projectId: project1.id },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    if (members.length === 0) {
      throw new Error("Expected to find project members");
    }
    console.log(`  → Found ${members.length} members`);
  });

  // Test 6: Get project owner
  await runTest("Get project owner info", async () => {
    const project = await db.project.findUnique({
      where: { id: project1.id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    });

    if (!project || !project.owner) {
      throw new Error("Expected to find project owner");
    }
    console.log(`  → Project owner: ${project.owner.name}`);
  });

  // Test 7: Search tasks by text
  await runTest("Search tasks by title/description", async () => {
    const searchQuery = "design";
    const tasks = await db.task.findMany({
      where: {
        projectId: project1.id,
        OR: [
          { title: { contains: searchQuery } },
          { description: { contains: searchQuery } },
        ],
      },
    });

    if (tasks.length === 0) {
      throw new Error("Expected to find matching tasks");
    }
    console.log(`  → Found ${tasks.length} tasks matching "${searchQuery}"`);
  });

  // Test 8: Get tasks assigned to a user
  await runTest("Get all tasks assigned to user", async () => {
    const tasks = await db.task.findMany({
      where: { assigneeId: user2.id },
      include: {
        project: { select: { id: true, name: true } },
      },
    });

    if (tasks.length === 0) {
      throw new Error("Expected to find assigned tasks");
    }
    console.log(`  → Found ${tasks.length} tasks assigned to user`);
  });

  // Test 9: Get tasks by due date (upcoming)
  await runTest("Get tasks due within 10 days", async () => {
    const tenDaysFromNow = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    const tasks = await db.task.findMany({
      where: {
        projectId: project1.id,
        dueDate: {
          lte: tenDaysFromNow,
          gte: new Date(),
        },
      },
      orderBy: { dueDate: "asc" },
    });

    console.log(`  → Found ${tasks.length} tasks due within next 10 days`);
  });

  // Test 10: Count comments per task
  await runTest("Get task with comment count", async () => {
    const tasks = await db.task.findMany({
      where: { projectId: project1.id },
      include: {
        _count: { select: { comments: true } },
      },
    });

    const totalComments = tasks.reduce((sum, t) => sum + t._count.comments, 0);
    console.log(`  → Total comments across tasks: ${totalComments}`);
  });

  // Test 11: Get unassigned tasks
  await runTest("Get unassigned tasks in project", async () => {
    const tasks = await db.task.findMany({
      where: {
        projectId: project1.id,
        assigneeId: null,
      },
    });

    console.log(`  → Found ${tasks.length} unassigned tasks`);
  });

  // Test 12: Relational integrity - verify task belongs to project
  await runTest("Validate task belongs to project", async () => {
    const task = await db.task.findFirst({
      where: { id: task1.id, projectId: project1.id },
      select: { id: true, projectId: true },
    });

    if (!task || task.projectId !== project1.id) {
      throw new Error("Task does not belong to project");
    }
    console.log("  → Task correctly belongs to project");
  });

  // Test 13: Relational integrity - verify assignee is project member
  await runTest("Validate assignee is project member", async () => {
    const membership = await db.projectMember.findUnique({
      where: { projectId_userId: { projectId: project1.id, userId: user2.id } },
      select: { userId: true },
    });

    if (!membership) {
      throw new Error("Assignee is not a project member");
    }
    console.log("  → Assignee is valid project member");
  });

  // Test 14: Complex query - Tasks by status and priority
  await runTest("Get HIGH priority IN_PROGRESS tasks", async () => {
    const tasks = await db.task.findMany({
      where: {
        projectId: project1.id,
        priority: "HIGH",
        status: "IN_PROGRESS",
      },
      include: {
        assignee: { select: { name: true } },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log(`  → Found ${tasks.length} HIGH priority IN_PROGRESS tasks`);
  });

  // Test 15: Project statistics
  await runTest("Get project statistics", async () => {
    const [totalTasks, completedTasks, inProgressTasks, todoTasks] =
      await Promise.all([
        db.task.count({ where: { projectId: project1.id } }),
        db.task.count({
          where: { projectId: project1.id, status: "DONE" },
        }),
        db.task.count({
          where: { projectId: project1.id, status: "IN_PROGRESS" },
        }),
        db.task.count({
          where: { projectId: project1.id, status: "TODO" },
        }),
      ]);

    console.log(`  → Total: ${totalTasks}, Done: ${completedTasks}, In Progress: ${inProgressTasks}, TODO: ${todoTasks}`);
  });

  // ============================================================
  // RESULTS
  // ============================================================
  console.log("\n" + "=".repeat(60));
  console.log("📊 TEST RESULTS");
  console.log("=".repeat(60));

  const passCount = results.filter((r) => r.status === "PASS").length;
  const failCount = results.filter((r) => r.status === "FAIL").length;
  const totalTime = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`\n✓ Passed: ${passCount}/${results.length}`);
  console.log(`✗ Failed: ${failCount}/${results.length}`);
  console.log(`⏱  Total time: ${totalTime}ms`);

  if (failCount > 0) {
    console.log("\n❌ Failed tests:");
    results
      .filter((r) => r.status === "FAIL")
      .forEach((r) => {
        console.log(`  - ${r.name}: ${r.message}`);
      });
  }

  console.log("\n" + "=".repeat(60));

  // Cleanup
  await db.$disconnect();

  process.exit(failCount > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error("Test suite error:", error);
  process.exit(1);
});
