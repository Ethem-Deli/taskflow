import { POST } from "@/app/api/register/route";
import { cleanDatabase, testDb } from "../helpers/db";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(async () => {
  await cleanDatabase();
});

afterAll(async () => {
  await testDb.$disconnect();
});

describe("POST /api/register", () => {
  it("creates a user and returns 201", async () => {
    const res = await POST(makeRequest({ name: "Alice", email: "alice@example.com", password: "secret123" }));
    expect(res.status).toBe(201);
    const { user } = await res.json();
    expect(user.email).toBe("alice@example.com");
    expect(user.name).toBe("Alice");
    expect(user.id).toBeDefined();
    // password hash must not be leaked
    expect(user.passwordHash).toBeUndefined();
  });

  it("works without an optional name", async () => {
    const res = await POST(makeRequest({ email: "bob@example.com", password: "secret123" }));
    expect(res.status).toBe(201);
  });

  it("returns 409 when email is already registered", async () => {
    await POST(makeRequest({ email: "alice@example.com", password: "secret123" }));
    const res = await POST(makeRequest({ email: "alice@example.com", password: "differentpass" }));
    expect(res.status).toBe(409);
    const { error } = await res.json();
    expect(error).toMatch(/already registered/i);
  });

  it("returns 400 for a missing email", async () => {
    const res = await POST(makeRequest({ password: "secret123" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for an invalid email", async () => {
    const res = await POST(makeRequest({ email: "not-an-email", password: "secret123" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when password is too short", async () => {
    const res = await POST(makeRequest({ email: "alice@example.com", password: "abc" }));
    expect(res.status).toBe(400);
  });
});
