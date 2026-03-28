import { GET, POST } from "@/app/api/projects/[projectId]/members/route";
import { DELETE } from "@/app/api/projects/[projectId]/members/[userId]/route";
import { cleanDatabase, testDb } from "../helpers/db";
import { createUser, createProject, addMember } from "../helpers/fixtures";

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

function memberListParams(projectId: string) {
  return { params: Promise.resolve({ projectId }) };
}

function memberParams(projectId: string, userId: string) {
  return { params: Promise.resolve({ projectId, userId }) };
}

beforeEach(async () => {
  await cleanDatabase();
  mockSession.mockReset();
});

afterAll(async () => {
  await testDb.$disconnect();
});

// ---------------------------------------------------------------------------
// GET /api/projects/[projectId]/members
// ---------------------------------------------------------------------------
describe("GET /api/projects/[projectId]/members", () => {
  it("returns 401 when not authenticated", async () => {
    asNoSession();
    const res = await GET(makeRequest("http://localhost/api/projects/x/members"), memberListParams("x"));
    expect(res.status).toBe(401);
  });

  it("returns 403 for non-members", async () => {
    const owner = await createUser("owner@example.com");
    const stranger = await createUser("stranger@example.com");
    const project = await createProject(owner.id);
    asSession(stranger.id);
    const res = await GET(
      makeRequest(`http://localhost/api/projects/${project.id}/members`),
      memberListParams(project.id)
    );
    expect(res.status).toBe(403);
  });

  it("returns all members with their roles", async () => {
    const owner = await createUser("owner@example.com");
    const member = await createUser("member@example.com");
    const project = await createProject(owner.id);
    await addMember(project.id, member.id);
    asSession(owner.id);
    const res = await GET(
      makeRequest(`http://localhost/api/projects/${project.id}/members`),
      memberListParams(project.id)
    );
    expect(res.status).toBe(200);
    const { members } = await res.json();
    expect(members).toHaveLength(2);
    const roles = members.map((m: { role: string }) => m.role);
    expect(roles).toContain("OWNER");
    expect(roles).toContain("MEMBER");
  });
});

// ---------------------------------------------------------------------------
// POST /api/projects/[projectId]/members  (invite by email)
// ---------------------------------------------------------------------------
describe("POST /api/projects/[projectId]/members", () => {
  it("returns 401 when not authenticated", async () => {
    asNoSession();
    const res = await POST(
      makeRequest("http://localhost/api/projects/x/members", "POST", { email: "x@x.com" }),
      memberListParams("x")
    );
    expect(res.status).toBe(401);
  });

  it("returns 403 when caller is not the project owner", async () => {
    const owner = await createUser("owner@example.com");
    const member = await createUser("member@example.com");
    const invitee = await createUser("invitee@example.com");
    const project = await createProject(owner.id);
    await addMember(project.id, member.id);
    asSession(member.id);
    const res = await POST(
      makeRequest(`http://localhost/api/projects/${project.id}/members`, "POST", {
        email: invitee.email,
      }),
      memberListParams(project.id)
    );
    expect(res.status).toBe(403);
  });

  it("invites an existing user and returns 201", async () => {
    const owner = await createUser("owner@example.com");
    const invitee = await createUser("invitee@example.com", "Invitee");
    const project = await createProject(owner.id);
    asSession(owner.id);
    const res = await POST(
      makeRequest(`http://localhost/api/projects/${project.id}/members`, "POST", {
        email: invitee.email,
      }),
      memberListParams(project.id)
    );
    expect(res.status).toBe(201);
    const { member } = await res.json();
    expect(member.email).toBe(invitee.email);
    expect(member.role).toBe("MEMBER");
  });

  it("returns 404 when the invited email does not exist", async () => {
    const owner = await createUser("owner@example.com");
    const project = await createProject(owner.id);
    asSession(owner.id);
    const res = await POST(
      makeRequest(`http://localhost/api/projects/${project.id}/members`, "POST", {
        email: "ghost@nowhere.com",
      }),
      memberListParams(project.id)
    );
    expect(res.status).toBe(404);
  });

  it("returns 409 when the user is already a member", async () => {
    const owner = await createUser("owner@example.com");
    const member = await createUser("member@example.com");
    const project = await createProject(owner.id);
    await addMember(project.id, member.id);
    asSession(owner.id);
    const res = await POST(
      makeRequest(`http://localhost/api/projects/${project.id}/members`, "POST", {
        email: member.email,
      }),
      memberListParams(project.id)
    );
    expect(res.status).toBe(409);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/projects/[projectId]/members/[userId]
// ---------------------------------------------------------------------------
describe("DELETE /api/projects/[projectId]/members/[userId]", () => {
  it("removes a member and returns 204", async () => {
    const owner = await createUser("owner@example.com");
    const member = await createUser("member@example.com");
    const project = await createProject(owner.id);
    await addMember(project.id, member.id);
    asSession(owner.id);
    const res = await DELETE(
      makeRequest(`http://localhost/api/projects/${project.id}/members/${member.id}`, "DELETE"),
      memberParams(project.id, member.id)
    );
    expect(res.status).toBe(204);
    const membership = await testDb.projectMember.findFirst({
      where: { projectId: project.id, userId: member.id },
    });
    expect(membership).toBeNull();
  });

  it("returns 403 when caller is not the owner", async () => {
    const owner = await createUser("owner@example.com");
    const memberA = await createUser("a@example.com");
    const memberB = await createUser("b@example.com");
    const project = await createProject(owner.id);
    await addMember(project.id, memberA.id);
    await addMember(project.id, memberB.id);
    asSession(memberA.id);
    const res = await DELETE(
      makeRequest(`http://localhost/api/projects/${project.id}/members/${memberB.id}`, "DELETE"),
      memberParams(project.id, memberB.id)
    );
    expect(res.status).toBe(403);
  });
});
