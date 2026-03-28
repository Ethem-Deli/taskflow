import bcrypt from "bcryptjs";
import { testDb } from "./db";

export async function createUser(
  email = "user@example.com",
  name = "Test User"
) {
  const passwordHash = await bcrypt.hash("password123", 10);
  return testDb.user.create({ data: { name, email, passwordHash } });
}

/** Creates a project and makes `userId` its OWNER. */
export async function createProject(
  userId: string,
  name = "Test Project",
  description = "A test project"
) {
  return testDb.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: { name, description, owner: { connect: { id: userId } } },
    });
    await tx.projectMember.create({
      data: { projectId: project.id, userId, role: "OWNER" },
    });
    return project;
  });
}

/** Adds `userId` as a MEMBER of `projectId`. */
export async function addMember(projectId: string, userId: string) {
  return testDb.projectMember.create({
    data: { projectId, userId, role: "MEMBER" },
  });
}

/** Creates a task inside a project. */
export async function createTask(
  projectId: string,
  title = "Test Task",
  priority: "LOW" | "MEDIUM" | "HIGH" = "MEDIUM"
) {
  return testDb.task.create({
    data: { title, projectId, priority, status: "TODO" },
  });
}
