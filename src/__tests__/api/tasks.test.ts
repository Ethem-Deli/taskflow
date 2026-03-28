import { GET, POST } from "@/app/api/projects/[projectId]/tasks/route";
import {
  GET as getTask,
  PATCH as patchTask,
  DELETE as deleteTask,
} from "@/app/api/projects/[projectId]/tasks/[taskId]/route";
import { cleanDatabase, testDb } from "../helpers/db";
import { createUser, createProject, addMember, createTask } from "../helpers/fixtures";

jest.mock("@/lib/auth", () => ({ authOptions: {} }));
jest.mock("next-auth", () => ({
  __esModule: true,
  default: jest.fn(),
  getServerSession: jest.fn(),
}));

import { getServerSession } from "next-auth";
const mockSession = getServerSession as jest.Mock;

function asSession(userId: string) {
  mockSession.mockResolvedValue({ user: { id: userId }, expires: "" });
}
function asNoSession() {
  mockSession.mockResolvedValue(null);
}

function makeRequest(url: string, method = "GET", body?: unknown) {
  return new Request(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
}

function taskListParams(projectId: string) {
  return { params: Promise.resolve({ projectId }) };
}

function taskParams(projectId: string, taskId: string) {
  return { params: Promise.resolve({ projectId, taskId }) };
}

beforeEach(async () => {
  await cleanDatabase();
  mockSession.mockReset();
});

afterAll(async () => {
  await testDb.$disconnect();
});

// ---------------------------------------------------------------------------
// GET /api/projects/[projectId]/tasks
// ---------------------------------------------------------------------------
describe("GET /api/projects/[projectId]/tasks", () => {
  it("returns 401 when not authenticated", async () => {
    asNoSession();
    const res = await GET(makeRequest("http://localhost/api/projects/x/tasks"), taskListParams("x"));
    expect(res.status).toBe(401);
  });

  it("returns 403 for a non-member", async () => {
    const owner = await createUser("owner@example.com");
    const stranger = await createUser("stranger@example.com");
    const project = await createProject(owner.id);
    asSession(stranger.id);
    const res = await GET(
      makeRequest(`http://localhost/api/projects/${project.id}/tasks`),
      taskListParams(project.id)
    );
    expect(res.status).toBe(403);
  });

  it("returns all tasks for the project", async () => {
    const user = await createUser();
    const project = await createProject(user.id);
    await createTask(project.id, "Task A");
    await createTask(project.id, "Task B");
    asSession(user.id);
    const res = await GET(
      makeRequest(`http://localhost/api/projects/${project.id}/tasks`),
      taskListParams(project.id)
    );
    expect(res.status).toBe(200);
    const { tasks } = await res.json();
    expect(tasks).toHaveLength(2);
  });

  it("filters tasks by status", async () => {
    const user = await createUser();
    const project = await createProject(user.id);
    await testDb.task.create({ data: { title: "Todo", projectId: project.id, priority: "MEDIUM", status: "TODO" } });
    await testDb.task.create({ data: { title: "Done", projectId: project.id, priority: "MEDIUM", status: "DONE" } });
    asSession(user.id);
    const res = await GET(
      makeRequest(`http://localhost/api/projects/${project.id}/tasks?status=TODO`),
      taskListParams(project.id)
    );
    const { tasks } = await res.json();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].status).toBe("TODO");
  });

  it("returns 400 for an invalid status filter", async () => {
    const user = await createUser();
    const project = await createProject(user.id);
    asSession(user.id);
    const res = await GET(
      makeRequest(`http://localhost/api/projects/${project.id}/tasks?status=INVALID`),
      taskListParams(project.id)
    );
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// POST /api/projects/[projectId]/tasks
// ---------------------------------------------------------------------------
describe("POST /api/projects/[projectId]/tasks", () => {
  it("creates a task with default status TODO", async () => {
    const user = await createUser();
    const project = await createProject(user.id);
    asSession(user.id);
    const res = await POST(
      makeRequest(`http://localhost/api/projects/${project.id}/tasks`, "POST", {
        title: "New Task",
        priority: "HIGH",
      }),
      taskListParams(project.id)
    );
    expect(res.status).toBe(201);
    const { task } = await res.json();
    expect(task.title).toBe("New Task");
    expect(task.status).toBe("TODO");
    expect(task.priority).toBe("HIGH");
  });

  it("creates a task with an assignee who is a project member", async () => {
    const owner = await createUser("owner@example.com");
    const member = await createUser("member@example.com");
    const project = await createProject(owner.id);
    await addMember(project.id, member.id);
    asSession(owner.id);
    const res = await POST(
      makeRequest(`http://localhost/api/projects/${project.id}/tasks`, "POST", {
        title: "Assigned Task",
        priority: "MEDIUM",
        assigneeId: member.id,
      }),
      taskListParams(project.id)
    );
    expect(res.status).toBe(201);
    const { task } = await res.json();
    expect(task.assignee?.id).toBe(member.id);
  });

  it("returns 400 when the assignee is not a project member", async () => {
    const owner = await createUser("owner@example.com");
    const outsider = await createUser("outsider@example.com");
    const project = await createProject(owner.id);
    asSession(owner.id);
    const res = await POST(
      makeRequest(`http://localhost/api/projects/${project.id}/tasks`, "POST", {
        title: "Bad Assignee Task",
        priority: "LOW",
        assigneeId: outsider.id,
      }),
      taskListParams(project.id)
    );
    expect(res.status).toBe(400);
    const { error } = await res.json();
    expect(error).toMatch(/not a member/i);
  });

  it("returns 400 when title is missing", async () => {
    const user = await createUser();
    const project = await createProject(user.id);
    asSession(user.id);
    const res = await POST(
      makeRequest(`http://localhost/api/projects/${project.id}/tasks`, "POST", { priority: "LOW" }),
      taskListParams(project.id)
    );
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// GET /api/projects/[projectId]/tasks/[taskId]
// ---------------------------------------------------------------------------
describe("GET /api/projects/[projectId]/tasks/[taskId]", () => {
  it("returns task details with assignees and comments", async () => {
    const user = await createUser();
    const project = await createProject(user.id);
    const task = await createTask(project.id, "Detail Task");
    asSession(user.id);
    const res = await getTask(
      makeRequest(`http://localhost/api/projects/${project.id}/tasks/${task.id}`),
      taskParams(project.id, task.id)
    );
    expect(res.status).toBe(200);
    const { task: t } = await res.json();
    expect(t.id).toBe(task.id);
    // assignee is now a single nullable object, not an array
    expect("assignee" in t).toBe(true);
    expect(Array.isArray(t.comments)).toBe(true);
  });

  it("returns 404 for a non-existent task", async () => {
    const user = await createUser();
    const project = await createProject(user.id);
    asSession(user.id);
    const res = await getTask(
      makeRequest(`http://localhost/api/projects/${project.id}/tasks/does-not-exist`),
      taskParams(project.id, "does-not-exist")
    );
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/projects/[projectId]/tasks/[taskId]
// ---------------------------------------------------------------------------
describe("PATCH /api/projects/[projectId]/tasks/[taskId]", () => {
  it("updates task status", async () => {
    const user = await createUser();
    const project = await createProject(user.id);
    const task = await createTask(project.id);
    asSession(user.id);
    const res = await patchTask(
      makeRequest(
        `http://localhost/api/projects/${project.id}/tasks/${task.id}`,
        "PATCH",
        { status: "IN_PROGRESS" }
      ),
      taskParams(project.id, task.id)
    );
    expect(res.status).toBe(200);
    const { task: t } = await res.json();
    expect(t.status).toBe("IN_PROGRESS");
  });

  it("reassigns the task to a different member", async () => {
    const owner = await createUser("owner@example.com");
    const memberA = await createUser("a@example.com");
    const memberB = await createUser("b@example.com");
    const project = await createProject(owner.id);
    await addMember(project.id, memberA.id);
    await addMember(project.id, memberB.id);
    const task = await createTask(project.id);
    asSession(owner.id);

    // Assign memberA first
    await patchTask(
      makeRequest(`http://localhost/api/projects/${project.id}/tasks/${task.id}`, "PATCH", {
        assigneeId: memberA.id,
      }),
      taskParams(project.id, task.id)
    );

    // Reassign to memberB
    const res = await patchTask(
      makeRequest(`http://localhost/api/projects/${project.id}/tasks/${task.id}`, "PATCH", {
        assigneeId: memberB.id,
      }),
      taskParams(project.id, task.id)
    );
    const { task: t } = await res.json();
    expect(t.assignee?.id).toBe(memberB.id);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/projects/[projectId]/tasks/[taskId]
// ---------------------------------------------------------------------------
describe("DELETE /api/projects/[projectId]/tasks/[taskId]", () => {
  it("deletes the task and returns 204", async () => {
    const user = await createUser();
    const project = await createProject(user.id);
    const task = await createTask(project.id);
    asSession(user.id);
    const res = await deleteTask(
      makeRequest(`http://localhost/api/projects/${project.id}/tasks/${task.id}`, "DELETE"),
      taskParams(project.id, task.id)
    );
    expect(res.status).toBe(204);
    const deleted = await testDb.task.findUnique({ where: { id: task.id } });
    expect(deleted).toBeNull();
  });
});
