type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate?: string | null;
  assignee?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
};

/*
WEEK 5 UPDATE (Sprint Tasks - Ethem Deli)
-----------------------------------------
Added the following features:

1. Kanban style task grouping (TODO / IN_PROGRESS / DONE)
2. Status change buttons for tasks
3. Task comments UI
4. Minor UI improvements for task interaction

These updates help improve task tracking and user interaction
in the dashboard.
*/

import { useState, useEffect } from "react";

function getStatusColor(status: string) {
  switch (status) {
    case "TODO":
      return "bg-yellow-100 text-yellow-800";
    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-800";
    case "DONE":
      return "bg-green-100 text-green-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function formatStatus(status: string): string {
  return status.replace(/_/g, " ");
}

function formatPriority(priority: string): string {
  return priority.charAt(0) + priority.slice(1).toLowerCase();
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case "HIGH":
      return "bg-red-100 text-red-700";
    case "MEDIUM":
      return "bg-orange-100 text-orange-700";
    case "LOW":
      return "bg-green-100 text-green-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

/*
WEEK 5: Simple comment component for tasks
Allows users to add quick comments to tasks.
*/
function TaskComments() {
  const [comments, setComments] = useState<string[]>([]);
  const [text, setText] = useState("");

  function addComment() {
    if (!text) return;
    setComments([...comments, text]);
    setText("");
  }

  return (
    <div className="mt-3">
      <p className="text-xs font-semibold text-slate-600">Comments</p>

      {comments.map((c, i) => (
        <div key={i} className="text-xs bg-slate-100 rounded p-1 mt-1">
          {c}
        </div>
      ))}

      <input
        className="border rounded text-xs p-1 w-full mt-1"
        placeholder="Add comment..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <button
        onClick={addComment}
        className="text-xs bg-blue-500 text-white px-2 py-1 rounded mt-1"
      >
        Add Comment
      </button>
    </div>
  );
}

export default function TaskList({
  tasks,
  loading,
  projectId,
}: {
  tasks: Task[];
  loading: boolean;
  projectId: string;
}) {
  const [localTasks, setLocalTasks] = useState(tasks);

  /*
  WEEK 5: Function to update task status.
  Allows users to move tasks between Kanban columns.
  */
  async function updateStatus(taskId: string, status: Task["status"]) {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Error updating task:", data);
        alert(`Failed to update task: ${data.error || "Unknown error"}`);
        return;
      }

      // Update local state instead of reloading
      setLocalTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === taskId ? { ...t, status } : t
        )
      );
    } catch (error) {
      console.error("Error updating task status:", error);
      alert("Failed to update task status");
    }
  }

  // Sync local tasks with props when tasks change
  useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  if (loading) {
    return <p className="mt-6 text-slate-500">Loading tasks...</p>;
  }

  if (localTasks.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-dashed p-6 text-center text-slate-500">
        No tasks created yet. Start by adding a new task.
      </div>
    );
  }

  /*
  WEEK 5: Group tasks into Kanban columns
  */
  const todo = localTasks.filter((t) => t.status === "TODO");
  const inProgress = localTasks.filter((t) => t.status === "IN_PROGRESS");
  const done = localTasks.filter((t) => t.status === "DONE");

  function renderTask(task: Task) {
    return (
      <article key={task.id} className="rounded-xl border p-4 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold">{task.title}</h2>

            {task.description ? (
              <p className="mt-1 text-sm text-slate-600">
                {task.description}
              </p>
            ) : null}
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${getPriorityColor(
              task.priority
            )}`}
          >
            {formatPriority(task.priority)}
          </span>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">

          <span
            className={`rounded-full px-2 py-1 font-medium ${getStatusColor(
              task.status
            )}`}
          >
            {formatStatus(task.status)}
          </span>

          <span>•</span>

          <span>
            Due:{" "}
            {task.dueDate
              ? new Date(task.dueDate).toLocaleDateString()
              : "None"}
          </span>

          <span>•</span>

          <span>
            Assignee:{" "}
            {task.assignee
              ? task.assignee.name ?? task.assignee.email
              : "Unassigned"}
          </span>
        </div>

        {/* WEEK 5: Task status change buttons */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => updateStatus(task.id, "TODO")}
            className="text-xs bg-yellow-200 px-2 py-1 rounded"
          >
            Todo
          </button>

          <button
            onClick={() => updateStatus(task.id, "IN_PROGRESS")}
            className="text-xs bg-blue-200 px-2 py-1 rounded"
          >
            Start
          </button>

          <button
            onClick={() => updateStatus(task.id, "DONE")}
            className="text-xs bg-green-200 px-2 py-1 rounded"
          >
            Done
          </button>
        </div>

        {/* WEEK 5: Task comments */}
        <TaskComments taskId={task.id} projectId={projectId} />
      </article>
    );
  }

  return (
    /*
    WEEK 5: Converted task list into Kanban layout
    */
    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">

      <div>
        <h2 className="font-bold mb-3">To Do</h2>
        <div className="space-y-4">
          {todo.map(renderTask)}
        </div>
      </div>

      <div>
        <h2 className="font-bold mb-3">In Progress</h2>
        <div className="space-y-4">
          {inProgress.map(renderTask)}
        </div>
      </div>

      <div>
        <h2 className="font-bold mb-3">Done</h2>
        <div className="space-y-4">
          {done.map(renderTask)}
        </div>
      </div>

    </div>
  );
}