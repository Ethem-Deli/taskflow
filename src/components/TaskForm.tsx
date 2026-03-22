"use client";

import { useEffect, useState } from "react";

type Props = {
  projectId: string;
  onCreated?: () => void;
};

type Member = {
  userId: string;
  name: string | null;
  email: string;
  role: string;
  joinedAt: string;
};

type TaskFormData = {
  title: string;
  description: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate: string;
  assigneeId: string;
};

export default function TaskForm({ projectId, onCreated }: Props) {
  const [form, setForm] = useState<TaskFormData>({
    title: "",
    description: "",
    priority: "MEDIUM",
    dueDate: "",
    assigneeId: "",
  });

  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Load project members so the user can assign a task to one member
  useEffect(() => {
    async function loadMembers() {
      setMembersLoading(true);
      setMembersError("");

      try {
        const response = await fetch(`/api/projects/${projectId}/members`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load members");
        }

        setMembers(data.members ?? []);
      } catch (err) {
        setMembersError(
          err instanceof Error ? err.message : "Failed to load members"
        );
      } finally {
        setMembersLoading(false);
      }
    }

    loadMembers();
  }, [projectId]);

  async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          // Send undefined instead of empty string when no assignee is selected
          assigneeId: form.assigneeId || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : "Failed to create task"
        );
        return;
      }

      // Reset the form after successful creation
      setForm({
        title: "",
        description: "",
        priority: "MEDIUM",
        dueDate: "",
        assigneeId: "",
      });

      setSuccess(data.message || "Task created successfully");
      onCreated?.();
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Create task</h2>

      <div className="mt-4 space-y-3">
        <input
          type="text"
          placeholder="Task title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full rounded-lg border p-3"
          required
        />

        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="min-h-28 w-full rounded-lg border p-3"
        />

        <select
          value={form.priority}
          onChange={(e) =>
            setForm({
              ...form,
              priority: e.target.value as "LOW" | "MEDIUM" | "HIGH",
            })
          }
          className="w-full rounded-lg border p-3"
        >
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>

        <input
          type="date"
          value={form.dueDate}
          onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
          className="w-full rounded-lg border p-3"
        />

        {/* Single-assignee dropdown aligned with Phase 1 backend */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Assignee
          </label>

          {membersLoading ? (
            <p className="text-sm text-slate-500">Loading members...</p>
          ) : membersError ? (
            <p className="text-sm text-red-600">{membersError}</p>
          ) : (
            <select
              value={form.assigneeId}
              onChange={(e) =>
                setForm({ ...form, assigneeId: e.target.value })
              }
              className="w-full rounded-lg border p-3"
            >
              <option value="">Unassigned</option>
              {members.map((member) => (
                <option key={member.userId} value={member.userId}>
                  {member.name ?? member.email}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {error ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          {success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="mt-4 rounded-lg bg-slate-900 px-4 py-3 text-white disabled:opacity-60"
      >
        {loading ? "Saving..." : "Add task"}
      </button>
    </form>
  );
}