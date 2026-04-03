"use client";

import { useState, useEffect } from "react";

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

export default function TaskComments({
  taskId,
  projectId,
}: {
  taskId: string;
  projectId: string;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load comments on mount
  useEffect(() => {
    loadComments();
  }, [taskId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(
        `/api/projects/${projectId}/tasks/${taskId}/comments`
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load comments");
      }

      setComments(data.comments || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load comments");
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const addComment = async () => {
    if (!comment.trim()) return;

    try {
      setIsSubmitting(true);
      setError("");
      const res = await fetch(
        `/api/projects/${projectId}/tasks/${taskId}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: comment }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to add comment");
      }

      setComments([...comments, data.comment]);
      setComment("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add comment");
    } finally {
      setIsSubmitting(false);
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
            <p className="font-semibold text-slate-700">
              {c.user.name || c.user.email}
            </p>
            <p className="text-slate-600 mt-1">{c.content}</p>
            <p className="text-slate-400 text-xs mt-1">
              {new Date(c.createdAt).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-2 flex gap-2">
        <input
          className="border rounded text-xs p-1 flex-1"
          placeholder="Add comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={isSubmitting}
        />
        <button
          onClick={addComment}
          disabled={isSubmitting || !comment.trim()}
          className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isSubmitting ? "Adding..." : "Add"}
        </button>
      </div>
    </div>
  );
}