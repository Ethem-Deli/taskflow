import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Create hashed password for all users
  const hashedPassword = await bcrypt.hash("password123", 10);

  // Create sample users
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

  // Create sample projects
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

  // Add project members
  console.log("👨‍👩‍👧‍👦 Adding project members...");
  const memberships = [
    // TaskFlow Web App members
    { projectId: projects[0].id, userId: users[0].id, role: "OWNER" },
    { projectId: projects[0].id, userId: users[1].id, role: "MEMBER" },
    { projectId: projects[0].id, userId: users[2].id, role: "MEMBER" },

    // Mobile App members
    { projectId: projects[1].id, userId: users[1].id, role: "OWNER" },
    { projectId: projects[1].id, userId: users[0].id, role: "MEMBER" },
    { projectId: projects[1].id, userId: users[3].id, role: "MEMBER" },

    // API Backend members
    { projectId: projects[2].id, userId: users[0].id, role: "OWNER" },
    { projectId: projects[2].id, userId: users[3].id, role: "MEMBER" },

    // Design System members
    { projectId: projects[3].id, userId: users[2].id, role: "OWNER" },
    { projectId: projects[3].id, userId: users[1].id, role: "MEMBER" },
  ];

  await db.projectMember.createMany({
    data: memberships,
  });

  console.log(`✓ Added ${memberships.length} project memberships`);

  // Create sample tasks
  console.log("📋 Creating tasks...");
  const tasks = [
    // TaskFlow Web App tasks
    {
      title: "Implement user authentication",
      description: "Add login, registration, and password reset functionality",
      status: "DONE",
      priority: "HIGH",
      projectId: projects[0].id,
      assigneeId: users[1].id,
      dueDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
    },
    {
      title: "Design dashboard layout",
      description: "Create responsive dashboard with project overview",
      status: "IN_PROGRESS",
      priority: "HIGH",
      projectId: projects[0].id,
      assigneeId: users[2].id,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
    },
    {
      title: "Add task filtering",
      description: "Implement filters by status, priority, and assignee",
      status: "TODO",
      priority: "MEDIUM",
      projectId: projects[0].id,
      assigneeId: users[1].id,
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
    },
    {
      title: "Write unit tests",
      description: "Add comprehensive test coverage for components",
      status: "TODO",
      priority: "LOW",
      projectId: projects[0].id,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 1 month from now
    },

    // Mobile App tasks
    {
      title: "Setup React Native project",
      description: "Initialize project with navigation and basic screens",
      status: "DONE",
      priority: "HIGH",
      projectId: projects[1].id,
      assigneeId: users[1].id,
      dueDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
    },
    {
      title: "Implement push notifications",
      description: "Add Firebase integration for push notifications",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      projectId: projects[1].id,
      assigneeId: users[3].id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    },
    {
      title: "Design app icons",
      description: "Create app icons for different screen densities",
      status: "TODO",
      priority: "LOW",
      projectId: projects[1].id,
      dueDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 3 weeks from now
    },

    // API Backend tasks
    {
      title: "Optimize database queries",
      description: "Add indexes and optimize slow queries",
      status: "DONE",
      priority: "HIGH",
      projectId: projects[2].id,
      assigneeId: users[0].id,
      dueDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
    {
      title: "Add rate limiting",
      description: "Implement API rate limiting for security",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      projectId: projects[2].id,
      assigneeId: users[3].id,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    },

    // Design System tasks
    {
      title: "Create component library",
      description: "Build reusable UI components with Storybook",
      status: "IN_PROGRESS",
      priority: "HIGH",
      projectId: projects[3].id,
      assigneeId: users[2].id,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
    },
    {
      title: "Document design tokens",
      description: "Define and document colors, typography, spacing",
      status: "TODO",
      priority: "MEDIUM",
      projectId: projects[3].id,
      assigneeId: users[1].id,
      dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
    },
  ];

  const createdTasks = [];
  for (const task of tasks) {
    const createdTask = await db.task.create({ data: task });
    createdTasks.push(createdTask);
  }

  console.log(`✓ Created ${createdTasks.length} tasks`);

  // Create sample comments
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
  console.log("\n📊 Summary:");
  console.log(`   Users: ${users.length}`);
  console.log(`   Projects: ${projects.length}`);
  console.log(`   Project Members: ${memberships.length}`);
  console.log(`   Tasks: ${createdTasks.length}`);
  console.log(`   Comments: ${comments.length}`);

  console.log("\n🔐 Test accounts:");
  console.log("   alice@example.com / password123 (Admin)");
  console.log("   bob@example.com / password123");
  console.log("   charlie@example.com / password123");
  console.log("   diana@example.com / password123");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());