import "dotenv/config";
import { PrismaClient, ProjectRole, TaskStatus, TaskPriority } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  const hashedPassword = await bcrypt.hash("password123", 10);

  console.log("👥 Creating users...");
  const users = await Promise.all([
    db.user.upsert({
      where: { email: "alice@example.com" },
      update: {},
      create: {
        email: "alice@example.com",
        name: "Alice Johnson",
        passwordHash: hashedPassword,
      },
    }),
    db.user.upsert({
      where: { email: "bob@example.com" },
      update: {},
      create: {
        email: "bob@example.com",
        name: "Bob Smith",
        passwordHash: hashedPassword,
      },
    }),
    db.user.upsert({
      where: { email: "charlie@example.com" },
      update: {},
      create: {
        email: "charlie@example.com",
        name: "Charlie Brown",
        passwordHash: hashedPassword,
      },
    }),
    db.user.upsert({
      where: { email: "diana@example.com" },
      update: {},
      create: {
        email: "diana@example.com",
        name: "Diana Prince",
        passwordHash: hashedPassword,
      },
    }),
  ]);

  console.log(`✓ Created ${users.length} users`);

  console.log("📁 Creating projects...");
  const projects = await Promise.all([
    db.project.create({
      data: {
        name: "TaskFlow Web App",
        description: "Main web application development",
        ownerId: users[0].id,
      },
    }),
    db.project.create({
      data: {
        name: "Mobile App",
        description: "Native mobile application for iOS and Android",
        ownerId: users[1].id,
      },
    }),
    db.project.create({
      data: {
        name: "API Backend",
        description: "REST API and database optimization",
        ownerId: users[0].id,
      },
    }),
    db.project.create({
      data: {
        name: "Design System",
        description: "Component library and design guidelines",
        ownerId: users[2].id,
      },
    }),
  ]);

  console.log(`✓ Created ${projects.length} projects`);

  console.log("👨‍👩‍👧‍👦 Adding project members...");
  const memberships = [
    { projectId: projects[0].id, userId: users[0].id, role: ProjectRole.OWNER },
    { projectId: projects[0].id, userId: users[1].id, role: ProjectRole.MEMBER },
    { projectId: projects[0].id, userId: users[2].id, role: ProjectRole.MEMBER },

    { projectId: projects[1].id, userId: users[1].id, role: ProjectRole.OWNER },
    { projectId: projects[1].id, userId: users[0].id, role: ProjectRole.MEMBER },
    { projectId: projects[1].id, userId: users[3].id, role: ProjectRole.MEMBER },

    { projectId: projects[2].id, userId: users[0].id, role: ProjectRole.OWNER },
    { projectId: projects[2].id, userId: users[3].id, role: ProjectRole.MEMBER },

    { projectId: projects[3].id, userId: users[2].id, role: ProjectRole.OWNER },
    { projectId: projects[3].id, userId: users[1].id, role: ProjectRole.MEMBER },
  ];

  await db.projectMember.createMany({
    data: memberships,
  });

  console.log(`✓ Added ${memberships.length} project memberships`);

  console.log("📋 Creating tasks...");
  const tasks = [
    {
      title: "Implement user authentication",
      description: "Add login, registration, and password reset functionality",
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      projectId: projects[0].id,
      assigneeId: users[1].id,
      dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      title: "Design dashboard layout",
      description: "Create responsive dashboard with project overview",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      projectId: projects[0].id,
      assigneeId: users[2].id,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    },
    {
      title: "Add task filtering",
      description: "Implement filters by status, priority, and assignee",
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      projectId: projects[0].id,
      assigneeId: users[1].id,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
    {
      title: "Write unit tests",
      description: "Add comprehensive test coverage for components",
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
      projectId: projects[0].id,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },

    {
      title: "Setup React Native project",
      description: "Initialize project with navigation and basic screens",
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      projectId: projects[1].id,
      assigneeId: users[1].id,
      dueDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    },
    {
      title: "Implement push notifications",
      description: "Add Firebase integration for push notifications",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.MEDIUM,
      projectId: projects[1].id,
      assigneeId: users[3].id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
    {
      title: "Design app icons",
      description: "Create app icons for different screen densities",
      status: TaskStatus.TODO,
      priority: TaskPriority.LOW,
      projectId: projects[1].id,
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    },

    {
      title: "Optimize database queries",
      description: "Add indexes and optimize slow queries",
      status: TaskStatus.DONE,
      priority: TaskPriority.HIGH,
      projectId: projects[2].id,
      assigneeId: users[0].id,
      dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
    {
      title: "Add rate limiting",
      description: "Implement API rate limiting for security",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.MEDIUM,
      projectId: projects[2].id,
      assigneeId: users[3].id,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    },

    {
      title: "Create component library",
      description: "Build reusable UI components with Storybook",
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      projectId: projects[3].id,
      assigneeId: users[2].id,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    },
    {
      title: "Document design tokens",
      description: "Define and document colors, typography, spacing",
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      projectId: projects[3].id,
      assigneeId: users[1].id,
      dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    },
  ];

  const createdTasks = [];
  for (const task of tasks) {
    const createdTask = await db.task.create({ data: task });
    createdTasks.push(createdTask);
  }

  console.log(`✓ Created ${createdTasks.length} tasks`);

  console.log("💬 Creating comments...");
  const comments = [
    {
      content: "Authentication system is now complete with JWT tokens and secure password hashing.",
      taskId: createdTasks[0].id,
      userId: users[1].id,
    },
    {
      content: "Working on the responsive grid layout. Should be done by tomorrow.",
      taskId: createdTasks[1].id,
      userId: users[2].id,
    },
    {
      content: "Can you clarify what filter options we need? Status, priority, assignee, and due date?",
      taskId: createdTasks[2].id,
      userId: users[1].id,
    },
    {
      content: "Yes, those filters plus search by title/description would be great.",
      taskId: createdTasks[2].id,
      userId: users[0].id,
    },
    {
      content: "React Native project is set up with Expo. Navigation is configured.",
      taskId: createdTasks[4].id,
      userId: users[1].id,
    },
    {
      content: "Firebase integration is almost done. Testing push notifications now.",
      taskId: createdTasks[5].id,
      userId: users[3].id,
    },
    {
      content: "Database optimization complete. Query performance improved by 60%.",
      taskId: createdTasks[7].id,
      userId: users[0].id,
    },
    {
      content: "Rate limiting implemented using Redis. Ready for testing.",
      taskId: createdTasks[8].id,
      userId: users[3].id,
    },
    {
      content: "Component library structure is set up. Working on the first components now.",
      taskId: createdTasks[9].id,
      userId: users[2].id,
    },
  ];

  await db.comment.createMany({
    data: comments,
  });

  console.log(`✓ Created ${comments.length} comments`);

  console.log("\n🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());