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

/*
WEEK 5 UPDATE (Edeli)
Improvements added this week:
1. Improved error handling so validation errors from the API
   (like {formErrors, fieldErrors}) do not cause React runtime errors.

2. Extract readable error messages from API responses.

3. Ensures only string messages are rendered in the UI.

This prevents the Next.js runtime error:
"Objects are not valid as a React child".
*/

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

        /*
        WEEK 5 FIX(Edeli):
        Handle validation errors returned as objects
        Example:
        {
          error: {
            formErrors: [],
            fieldErrors: { title: ["Title is required"] }
          }
        }
        */

        if (typeof data.error === "string") {
          setError(data.error);
        } 
        else if (data.error?.fieldErrors) {

          const fieldErrors = Object.values(data.error.fieldErrors).flat();

          if (fieldErrors.length > 0) {
            setError(String(fieldErrors[0]));
          } else {
            setError("Failed to create task");
          }

        } 
        else {
          setError("Failed to create task");
        }

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
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-white p-6 shadow-sm"
    >
      <h2 className="text-xl font-semibold">Create task</h2>

      <div className="mt-4 space-y-4">

        {/* TITLE */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Task Title
          </label>
          <input
            type="text"
            placeholder="Task title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full rounded-lg border p-3"
            required
          />
        </div>

        {/* DESCRIPTION */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Description
          </label>
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="min-h-28 w-full rounded-lg border p-3"
          />
        </div>

        {/* PRIORITY */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Priority
          </label>
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
        </div>

        {/* DUE DATE */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Due Date
          </label>
          <input
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            className="w-full rounded-lg border p-3"
          />
        </div>

        {/* ASSIGNEE */}
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

      {/* ERROR */}
      {error ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {/* SUCCESS */}
      {success ? (
        <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          {success}
        </p>
      ) : null}

      {/* BUTTON */}
      <button
        type="submit"
        disabled={loading}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-white disabled:opacity-60"
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
            Saving...
          </>
        ) : (
          "Add task"
        )}
      </button>
    </form>
  );
}