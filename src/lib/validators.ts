import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const taskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  dueDate: z.string().optional(),
});

export const projectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100),
  description: z.string().max(500).optional(),
});

export const inviteMemberSchema = z.object({
  email: z.email("Valid email is required"),
});

export const projectTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  dueDate: z.string().optional(),
  assigneeIds: z.array(z.string()).optional().default([]),
});

export const updateProjectTaskSchema = projectTaskSchema.partial();

// ─────────────────────────────────────────────
// QUERY PARAM VALIDATORS
// Used to validate URL search params in GET endpoints.
// ─────────────────────────────────────────────

/**
 * Validates filter query params for GET /api/projects/:projectId/tasks
 * Example: ?status=IN_PROGRESS&priority=HIGH
 */
export const taskFilterSchema = z.object({
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
});

/**
 * Validates query params for GET /api/projects/:projectId/tasks/search
 * Example: ?q=homepage&status=IN_PROGRESS&priority=HIGH
 */
export const taskSearchSchema = z.object({
  q: z
    .string()
    .min(1, "Search query cannot be empty")
    .max(100, "Search query is too long"),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).optional(),
});

/**
 * Validates comments request
 */

export const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(1000, "Comment is too long"),
});