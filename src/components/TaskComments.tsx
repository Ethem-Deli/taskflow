"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

type Comment = {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
};

const PAGE_SIZE = 20;

export default function TaskComments({
  taskId,
  projectId,
}: {
  taskId: string;
  projectId: string;
}) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const baseUrl = `/api/projects/${projectId}/tasks/${taskId}/comments`;

  const loadComments = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${baseUrl}?page=1&limit=${PAGE_SIZE}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load comments");
      }

      setComments(data.comments ?? []);
      setHasMore(data.hasMore ?? false);
      setPage(1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load comments");
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const loadMore = async () => {
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const res = await fetch(`${baseUrl}?page=${nextPage}&limit=${PAGE_SIZE}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load more comments");
      }

      setComments((prev) => [...prev, ...(data.comments ?? [])]);
      setHasMore(data.hasMore ?? false);
      setPage(nextPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load more comments");
    } finally {
      setLoadingMore(false);
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;

    try {
      setIsSubmitting(true);
      setError("");
      const res = await fetch(baseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to add comment");
      }

      setComments((prev) => [...prev, data.comment]);
      setNewComment("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    try {
      setError("");
      const res = await fetch(`${baseUrl}/${commentId}`, { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete comment");
      }

      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete comment");
    }
  };

  const startEdit = (c: Comment) => {
    setEditingId(c.id);
    setEditContent(c.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  const saveEdit = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      setIsSavingEdit(true);
      setError("");
      const res = await fetch(`${baseUrl}/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update comment");
      }

      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? data.comment : c))
      );
      setEditingId(null);
      setEditContent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update comment");
    } finally {
      setIsSavingEdit(false);
    }
  };

  return (
    <div className="mt-3">
      <p className="text-xs font-semibold text-slate-600">Comments</p>

      {loading && <p className="text-xs text-slate-500 mt-2">Loading comments...</p>}
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

      <div className="space-y-2 mt-2">
        {comments.map((c) => (
          <div key={c.id} className="text-xs bg-slate-100 rounded p-2">
            <div className="flex justify-between items-start">
              <p className="font-semibold text-slate-700">
                {c.user.name || c.user.email}
              </p>
              {c.user.id === currentUserId && editingId !== c.id && (
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(c)}
                    className="text-slate-400 hover:text-blue-500 cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteComment(c.id)}
                    className="text-slate-400 hover:text-red-500 cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>

            {editingId === c.id ? (
              <div className="mt-1 flex gap-1">
                <input
                  className="border rounded text-xs p-1 flex-1 min-w-0"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  disabled={isSavingEdit}
                  autoFocus
                />
                <button
                  onClick={() => saveEdit(c.id)}
                  disabled={isSavingEdit || !editContent.trim()}
                  className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  {isSavingEdit ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={cancelEdit}
                  disabled={isSavingEdit}
                  className="text-xs bg-slate-300 text-slate-700 px-2 py-1 rounded hover:bg-slate-400 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <p className="text-slate-600 mt-1">{c.content}</p>
            )}

            <p className="text-slate-400 text-xs mt-1">
              {new Date(c.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={loadMore}
          disabled={loadingMore}
          className="text-xs text-blue-500 hover:underline mt-2 disabled:opacity-50"
        >
          {loadingMore ? "Loading..." : "Load more comments"}
        </button>
      )}

      <div className="mt-2 flex gap-2">
        <input
          className="border rounded text-xs p-1 flex-1 min-w-0"
          placeholder="Add comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={isSubmitting}
        />
        <button
          onClick={addComment}
          disabled={isSubmitting || !newComment.trim()}
          className="text-xs bg-slate-600 text-white px-2 py-1 rounded hover:bg-slate-700 disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? "Adding..." : "Add"}
        </button>
      </div>
    </div>
  );
}
