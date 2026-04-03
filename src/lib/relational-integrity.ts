import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Validates that a task belongs to a project
 */
export async function validateTaskBelongsToProject(
  taskId: string,
  projectId: string
) {
  const task = await db.task.findFirst({
    where: { id: taskId, projectId },
    select: { id: true, projectId: true },
  });

  if (!task || task.projectId !== projectId) {
    return {
      valid: false,
      error: NextResponse.json({ error: "Task does not belong to this project" }, { status: 400 }),
    };
  }

  return { valid: true, error: null };
}

/**
 * Validates that an assignee is a member of the project
 */
export async function validateAssigneeIsProjectMember(
  assigneeId: string,
  projectId: string
) {
  const membership = await db.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId: assigneeId } },
    select: { userId: true },
  });

  if (!membership) {
    return {
      valid: false,
      error: NextResponse.json(
        { error: "Assignee is not a member of this project" },
        { status: 400 }
      ),
    };
  }

  return { valid: true, error: null };
}

/**
 * Validates that a comment belongs to a task and task belongs to project
 */
export async function validateCommentBelongsToProject(
  commentId: string,
  projectId: string
) {
  const comment = await db.comment.findFirst({
    where: {
      id: commentId,
      task: { projectId },
    },
    select: {
      id: true,
      taskId: true,
      task: { select: { projectId: true } },
    },
  });

  if (!comment) {
    return {
      valid: false,
      error: NextResponse.json(
        { error: "Comment does not belong to a task in this project" },
        { status: 404 }
      ),
    };
  }

  return { valid: true, error: null };
}

/**
 * Validates that a user is a member of a project
 */
export async function validateUserIsMember(userId: string, projectId: string) {
  const membership = await db.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
    select: { userId: true },
  });

  if (!membership) {
    return {
      valid: false,
      error: NextResponse.json(
        { error: "User is not a member of this project" },
        { status: 403 }
      ),
    };
  }

  return { valid: true, error: null };
}

/**
 * Validates that a project exists
 */
export async function validateProjectExists(projectId: string) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });

  if (!project) {
    return {
      valid: false,
      error: NextResponse.json({ error: "Project not found" }, { status: 404 }),
    };
  }

  return { valid: true, error: null };
}

/**
 * Validates that a task exists
 */
export async function validateTaskExists(taskId: string) {
  const task = await db.task.findUnique({
    where: { id: taskId },
    select: { id: true },
  });

  if (!task) {
    return {
      valid: false,
      error: NextResponse.json({ error: "Task not found" }, { status: 404 }),
    };
  }

  return { valid: true, error: null };
}

/**
 * Validates that a user exists
 */
export async function validateUserExists(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    return {
      valid: false,
      error: NextResponse.json({ error: "User not found" }, { status: 404 }),
    };
  }

  return { valid: true, error: null };
}

/**
 * Validates that a comment exists
 */
export async function validateCommentExists(commentId: string) {
  const comment = await db.comment.findUnique({
    where: { id: commentId },
    select: { id: true },
  });

  if (!comment) {
    return {
      valid: false,
      error: NextResponse.json({ error: "Comment not found" }, { status: 404 }),
    };
  }

  return { valid: true, error: null };
}

/**
 * Validates that role is valid
 */
export function validateRole(role: string) {
  const validRoles = ["OWNER", "MEMBER"];
  if (!validRoles.includes(role)) {
    return {
      valid: false,
      error: NextResponse.json(
        { error: `Invalid role. Must be one of: ${validRoles.join(", ")}` },
        { status: 400 }
      ),
    };
  }
  return { valid: true, error: null };
}

/**
 * Type guard to check if a string is a valid ProjectRole
 */
export function isValidProjectRole(role: string): role is "OWNER" | "MEMBER" {
  return ["OWNER", "MEMBER"].includes(role);
}

/**
 * Checks if there are any orphaned tasks when removing a team member
 * (tasks assigned to a removed member)
 */
export async function getOrphanedTasksAfterMemberRemoval(
  userId: string,
  projectId: string
) {
  const orphanedTasks = await db.task.findMany({
    where: {
      projectId,
      assigneeId: userId,
    },
    select: {
      id: true,
      title: true,
      assigneeId: true,
    },
  });

  return orphanedTasks;
}
