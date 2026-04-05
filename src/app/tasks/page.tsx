"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import Pagination from "@/components/Pagination";

type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate?: string | null;
  project: { id: string; name: string };
};

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
};

type EditForm = {
  title: string;
  description: string;
  status: Task["status"];
  priority: Task["priority"];
  dueDate: string;
};

const statusLabel: Record<Task["status"], string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

const priorityColors: Record<Task["priority"], string> = {
  LOW: "bg-green-100 text-green-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH: "bg-red-100 text-red-700",
};

const PAGE_SIZE = 10;

export default function TasksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ title: "", description: "", status: "TODO", priority: "MEDIUM", dueDate: "" });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentContent, setEditingCommentContent] = useState("");
  const [commentEditSubmitting, setCommentEditSubmitting] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;

    setLoading(true);
    fetch(`/api/tasks?page=${page}&limit=${PAGE_SIZE}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setTasks(data.tasks ?? []);
        setTotal(data.total ?? 0);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [status, page]);

  function openView(task: Task) {
    setViewingTask(task);
    setComments([]);
    setNewComment("");
    setCommentError("");
    setCommentsLoading(true);
    fetch(`/api/projects/${task.project.id}/tasks/${task.id}/comments`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setComments(data.comments ?? []);
      })
      .catch((err) => setCommentError(err.message))
      .finally(() => setCommentsLoading(false));
  }

  function closeView() {
    setViewingTask(null);
    setComments([]);
    setCommentError("");
  }

  async function handleAddComment(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!viewingTask || !newComment.trim()) return;

    setCommentSubmitting(true);
    setCommentError("");
    try {
      const res = await fetch(`/api/projects/${viewingTask.project.id}/tasks/${viewingTask.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add comment");
      setComments((prev) => [...prev, data.comment]);
      setNewComment("");
    } catch (err: unknown) {
      setCommentError(err instanceof Error ? err.message : "Failed to add comment");
    } finally {
      setCommentSubmitting(false);
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!viewingTask) return;
    setDeletingCommentId(commentId);
    try {
      const res = await fetch(`/api/projects/${viewingTask.project.id}/tasks/${viewingTask.id}/comments/${commentId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to delete comment");
      }
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err: unknown) {
      setCommentError(err instanceof Error ? err.message : "Failed to delete comment");
    } finally {
      setDeletingCommentId(null);
    }
  }

  async function handleEditComment(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!viewingTask || !editingCommentId) return;
    setCommentEditSubmitting(true);
    try {
      const res = await fetch(`/api/projects/${viewingTask.project.id}/tasks/${viewingTask.id}/comments/${editingCommentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editingCommentContent.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to edit comment");
      setComments((prev) => prev.map((c) => c.id === editingCommentId ? data.comment : c));
      setEditingCommentId(null);
      setEditingCommentContent("");
    } catch (err: unknown) {
      setCommentError(err instanceof Error ? err.message : "Failed to edit comment");
    } finally {
      setCommentEditSubmitting(false);
    }
  }

  function openEdit(task: Task) {
    setEditingTask(task);
    setEditForm({
      title: task.title,
      description: task.description ?? "",
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
    });
    setEditError("");
  }

  function closeEdit() {
    setEditingTask(null);
    setEditError("");
  }

  async function handleEdit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingTask) return;

    setEditLoading(true);
    setEditError("");
    try {
      const res = await fetch(`/api/projects/${editingTask.project.id}/tasks/${editingTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description || undefined,
          status: editForm.status,
          priority: editForm.priority,
          dueDate: editForm.dueDate || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to update task");

      setTasks((prev) =>
        prev.map((t) =>
          t.id === editingTask.id
            ? { ...t, title: data.task.title, description: data.task.description, status: data.task.status, priority: data.task.priority, dueDate: data.task.dueDate }
            : t
        )
      );
      closeEdit();
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : "Failed to update task");
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDelete(task: Task) {
    if (!confirm(`Are you sure you want to delete "${task.title}"? This cannot be undone.`)) return;

    setDeletingId(task.id);
    try {
      const res = await fetch(`/api/projects/${task.project.id}/tasks/${task.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to delete task");
      }
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      setTotal((prev) => prev - 1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete task");
    } finally {
      setDeletingId(null);
    }
  }

  if (status === "loading" || (loading && tasks.length === 0)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading tasks...</p>
      </div>
    );
  }

  const inputClasses = "mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900";

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-base font-semibold text-gray-900">My Tasks</h1>
            <p className="mt-2 text-sm text-gray-700">
              A list of all tasks currently assigned to you across all projects.
            </p>
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              {!loading && tasks.length === 0 ? (
                <p className="text-sm text-gray-500">No tasks assigned to you.</p>
              ) : (
                <>
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead>
                      <tr>
                        <th scope="col" className="py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                          Title
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Project
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Status
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Priority
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Due
                        </th>
                        <th scope="col" className="py-3.5 pr-4 pl-3 sm:pr-0">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {tasks.map((task) => (
                        <tr key={task.id}>
                          <td className="py-4 pr-3 pl-4 text-sm font-medium whitespace-nowrap sm:pl-0">
                            <button onClick={() => openView(task)} className="text-blue-900 hover:text-blue-600 cursor-pointer text-left">
                              {task.title}
                            </button>
                          </td>
                          <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500">
                            {task.project.name}
                          </td>
                          <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500">
                            {statusLabel[task.status]}
                          </td>
                          <td className="px-3 py-4 text-sm whitespace-nowrap">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${priorityColors[task.priority]}`}>
                              {task.priority.toLowerCase()}
                            </span>
                          </td>
                          <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500">
                            {task.dueDate
                              ? new Date(task.dueDate).toLocaleDateString(undefined, {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })
                              : "—"}
                          </td>
                          <td className="py-4 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-0">
                            <div className="flex justify-end gap-4">
                              <button
                                onClick={() => openEdit(task)}
                                className="text-blue-900 hover:text-blue-600 cursor-pointer"
                              >
                                Edit<span className="sr-only">, {task.title}</span>
                              </button>
                              <button
                                onClick={() => handleDelete(task)}
                                disabled={deletingId === task.id}
                                className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                              >
                                {deletingId === task.id ? "Deleting…" : "Delete"}
                                <span className="sr-only">, {task.title}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <Pagination
                    page={page}
                    limit={PAGE_SIZE}
                    total={total}
                    onPageChange={setPage}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* View modal */}
      {viewingTask && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40" onClick={closeView}>
          <div
            className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">{viewingTask.title}</h2>
                <p className="mt-0.5 text-sm text-gray-500">{viewingTask.project.name}</p>
              </div>
              <button onClick={closeView} className="text-gray-400 hover:text-gray-600 cursor-pointer text-lg leading-none">&times;</button>
            </div>

            <div className="mt-4 flex gap-3">
              <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700">
                {statusLabel[viewingTask.status]}
              </span>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${priorityColors[viewingTask.priority]}`}>
                {viewingTask.priority.toLowerCase()}
              </span>
              {viewingTask.dueDate && (
                <span className="text-xs text-gray-500">
                  Due {new Date(viewingTask.dueDate).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                </span>
              )}
            </div>

            {viewingTask.description && (
              <p className="mt-4 text-sm text-gray-700 whitespace-pre-wrap">{viewingTask.description}</p>
            )}

            <hr className="my-4 border-gray-200" />

            <h3 className="text-sm font-medium text-gray-900">Comments</h3>

            <div className="mt-2 flex-1 overflow-y-auto space-y-3 min-h-0">
              {commentsLoading ? (
                <p className="text-sm text-gray-400">Loading comments…</p>
              ) : comments.length === 0 ? (
                <p className="text-sm text-gray-400">No comments yet.</p>
              ) : (
                comments.map((comment) => {
                  const isOwn = comment.user.id === session?.user?.id;
                  const isEditing = editingCommentId === comment.id;
                  return (
                    <div key={comment.id} className="rounded-md bg-gray-50 px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-gray-700">{comment.user.name ?? comment.user.email}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400">
                            {new Date(comment.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                          </span>
                          {isOwn && !isEditing && (
                            <>
                              <button
                                onClick={() => { setEditingCommentId(comment.id); setEditingCommentContent(comment.content); setCommentError(""); }}
                                className="text-xs text-blue-600 hover:text-blue-800 cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                disabled={deletingCommentId === comment.id}
                                className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 cursor-pointer"
                              >
                                {deletingCommentId === comment.id ? "Deleting…" : "Delete"}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      {isEditing ? (
                        <form onSubmit={handleEditComment} className="mt-2 flex gap-2">
                          <input
                            type="text"
                            value={editingCommentContent}
                            onChange={(e) => setEditingCommentContent(e.target.value)}
                            className="flex-1 rounded-md border border-gray-300 px-2 py-1 text-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                          />
                          <button
                            type="submit"
                            disabled={commentEditSubmitting || !editingCommentContent.trim()}
                            className="rounded-md bg-slate-900 px-2 py-1 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {commentEditSubmitting ? "…" : "Save"}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setEditingCommentId(null); setEditingCommentContent(""); }}
                            className="rounded-md px-2 py-1 text-xs text-gray-600 hover:bg-gray-100"
                          >
                            Cancel
                          </button>
                        </form>
                      ) : (
                        <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">{comment.content}</p>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={handleAddComment} className="mt-4 flex gap-2">
              <input
                type="text"
                placeholder="Add a comment…"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
              />
              <button
                type="submit"
                disabled={commentSubmitting || !newComment.trim()}
                className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {commentSubmitting ? "…" : "Post"}
              </button>
            </form>
            {commentError && (
              <p className="mt-2 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{commentError}</p>
            )}
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editingTask && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40" onClick={closeEdit}>
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold text-gray-900">Edit task</h2>
            <p className="mt-1 text-sm text-gray-500">Update the details of this task.</p>

            <form onSubmit={handleEdit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700">Title</label>
                <input
                  id="edit-title"
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                  className={inputClasses}
                />
              </div>
              <div>
                <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  id="edit-description"
                  rows={3}
                  value={editForm.description}
                  onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  className={inputClasses}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    id="edit-status"
                    value={editForm.status}
                    onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value as Task["status"] }))}
                    className={inputClasses}
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="edit-priority" className="block text-sm font-medium text-gray-700">Priority</label>
                  <select
                    id="edit-priority"
                    value={editForm.priority}
                    onChange={(e) => setEditForm((f) => ({ ...f, priority: e.target.value as Task["priority"] }))}
                    className={inputClasses}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="edit-due" className="block text-sm font-medium text-gray-700">Due date</label>
                <input
                  id="edit-due"
                  type="date"
                  value={editForm.dueDate}
                  onChange={(e) => setEditForm((f) => ({ ...f, dueDate: e.target.value }))}
                  className={inputClasses}
                />
              </div>

              {editError && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{editError}</p>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="rounded-md px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-slate-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {editLoading ? "Saving…" : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
