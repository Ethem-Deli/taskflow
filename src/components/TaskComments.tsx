"use client";

import { useState } from "react";

export default function TaskComments({ taskId }: { taskId: string }) {
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<string[]>([]);

  const addComment = () => {
    setComments([...comments, comment]);
    setComment("");
  };

  return (
    <div className="mt-2">
      <h4 className="text-sm font-bold">Comments</h4>

      {comments.map((c, i) => (
        <div key={i} className="text-xs bg-gray-200 p-1 mt-1 rounded">
          {c}
        </div>
      ))}

      <input
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="border text-xs mt-2 p-1 w-full"
        placeholder="Add comment..."
      />

      <button
        onClick={addComment}
        className="text-xs bg-blue-500 text-white px-2 py-1 mt-1 rounded"
      >
        Add
      </button>
    </div>
  );
}