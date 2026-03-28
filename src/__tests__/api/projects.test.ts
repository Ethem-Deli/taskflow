import { GET, POST } from "@/app/api/projects/route";
import {
  GET as getProject,
  PATCH as patchProject,
  DELETE as deleteProject,
} from "@/app/api/projects/[projectId]/route";
import { cleanDatabase, testDb } from "../helpers/db";
import { createUser, createProject, addMember } from "../helpers/fixtures";

// Mock next-auth so we can control the session in tests.
// Also mock @/lib/auth so NextAuth() is never invoked during module init.
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

function projectParams(projectId: string) {
  return { params: Promise.resolve({ projectId }) };
}

beforeEach(async () => {
  await cleanDatabase();
  mockSession.mockReset();
});

afterAll(async () => {
  await testDb.$disconnect();
});

// ---------------------------------------------------------------------------
// GET /api/projects
// ---------------------------------------------------------------------------
describe("GET /api/projects", () => {
  it("returns 401 when not authenticated", async () => {
    asNoSession();
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns an empty list when user has no projects", async () => {
    const user = await createUser();
    asSession(user.id);
    const res = await GET();
    expect(res.status).toBe(200);
    const { projects } = await res.json();
    expect(projects).toEqual([]);
  });

  it("returns projects the user is a member of", async () => {
    const owner = await createUser("owner@example.com");
    const member = await createUser("member@example.com");
    const project = await createProject(owner.id, "Alpha");
    await addMember(project.id, member.id);

    asSession(member.id);
    const res = await GET();
    const { projects } = await res.json();
    expect(projects).toHaveLength(1);
    expect(projects[0].name).toBe("Alpha");
    expect(projects[0].role).toBe("MEMBER");
  });

  it("includes the role for each project", async () => {
    const user = await createUser();
    await createProject(user.id, "My Project");
    asSession(user.id);
    const res = await GET();
    const { projects } = await res.json();
    expect(projects[0].role).toBe("OWNER");
  });
});

// ---------------------------------------------------------------------------
// POST /api/projects
// ---------------------------------------------------------------------------
describe("POST /api/projects", () => {
  it("returns 401 when not authenticated", async () => {
    asNoSession();
    const res = await POST(makeRequest("http://localhost/api/projects", "POST", { name: "X" }));
    expect(res.status).toBe(401);
  });

  it("creates a project and makes the caller its OWNER", async () => {
    const user = await createUser();
    asSession(user.id);
    const res = await POST(
      makeRequest("http://localhost/api/projects", "POST", {
        name: "New Project",
        description: "A description",
      })
    );
    expect(res.status).toBe(201);
    const { project } = await res.json();
    expect(project.name).toBe("New Project");

    const membership = await testDb.projectMember.findFirst({
      where: { projectId: project.id, userId: user.id },
    });
    expect(membership?.role).toBe("OWNER");
  });

  it("returns 400 when name is missing", async () => {
    const user = await createUser();
    asSession(user.id);
    const res = await POST(makeRequest("http://localhost/api/projects", "POST", {}));
    expect(res.status).toBe(400);
  });

  it("returns 400 when name exceeds 100 characters", async () => {
    const user = await createUser();
    asSession(user.id);
    const res = await POST(
      makeRequest("http://localhost/api/projects", "POST", { name: "x".repeat(101) })
    );
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// GET /api/projects/[projectId]
// ---------------------------------------------------------------------------
describe("GET /api/projects/[projectId]", () => {
  it("returns 401 when not authenticated", async () => {
    asNoSession();
    const res = await getProject(makeRequest("http://localhost/api/projects/x"), projectParams("x"));
    expect(res.status).toBe(401);
  });

  it("returns 403 for a non-member", async () => {
    const owner = await createUser("owner@example.com");
    const stranger = await createUser("stranger@example.com");
    const project = await createProject(owner.id);
    asSession(stranger.id);
    const res = await getProject(
      makeRequest(`http://localhost/api/projects/${project.id}`),
      projectParams(project.id)
    );
    expect(res.status).toBe(403);
  });

  it("returns project details including member count", async () => {
    const user = await createUser();
    const project = await createProject(user.id);
    asSession(user.id);
    const res = await getProject(
      makeRequest(`http://localhost/api/projects/${project.id}`),
      projectParams(project.id)
    );
    expect(res.status).toBe(200);
    const { project: p } = await res.json();
    expect(p.id).toBe(project.id);
    expect(p._count.members).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/projects/[projectId]
// ---------------------------------------------------------------------------
describe("PATCH /api/projects/[projectId]", () => {
  it("updates the project when called by the owner", async () => {
    const user = await createUser();
    const project = await createProject(user.id, "Old Name");
    asSession(user.id);
    const res = await patchProject(
      makeRequest(`http://localhost/api/projects/${project.id}`, "PATCH", { name: "New Name" }),
      projectParams(project.id)
    );
    expect(res.status).toBe(200);
    const { project: p } = await res.json();
    expect(p.name).toBe("New Name");
  });

  it("returns 403 for a plain member", async () => {
    const owner = await createUser("owner@example.com");
    const member = await createUser("member@example.com");
    const project = await createProject(owner.id);
    await addMember(project.id, member.id);
    asSession(member.id);
    const res = await patchProject(
      makeRequest(`http://localhost/api/projects/${project.id}`, "PATCH", { name: "Hacked" }),
      projectParams(project.id)
    );
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/projects/[projectId]
// ---------------------------------------------------------------------------
describe("DELETE /api/projects/[projectId]", () => {
  it("deletes the project when called by the owner and returns 204", async () => {
    const user = await createUser();
    const project = await createProject(user.id);
    asSession(user.id);
    const res = await deleteProject(
      makeRequest(`http://localhost/api/projects/${project.id}`, "DELETE"),
      projectParams(project.id)
    );
    expect(res.status).toBe(204);
    const deleted = await testDb.project.findUnique({ where: { id: project.id } });
    expect(deleted).toBeNull();
  });

  it("returns 403 for a plain member", async () => {
    const owner = await createUser("owner@example.com");
    const member = await createUser("member@example.com");
    const project = await createProject(owner.id);
    await addMember(project.id, member.id);
    asSession(member.id);
    const res = await deleteProject(
      makeRequest(`http://localhost/api/projects/${project.id}`, "DELETE"),
      projectParams(project.id)
    );
    expect(res.status).toBe(403);
  });
});
