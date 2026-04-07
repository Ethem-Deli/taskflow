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
import TaskComments from "@/components/TaskComments";

function formatStatus(status: string): string {
  return status.replace(/_/g, " ");
}

function formatPriority(priority: string): string {
  return priority.charAt(0) + priority.slice(1).toLowerCase();
}

/*
WEEK 6 FINAL UI POLISH
----------------------
Further polished the Kanban task board:
1. Upgraded columns into styled containers with stronger separation
2. Improved task cards with better spacing and hierarchy
3. Reworked priority styling into softer badge system
4. Added better empty/loading states
5. Wrapped comments area in a cleaner secondary surface
*/

function getPriorityStyles(priority: string) {
  switch (priority) {
    case "HIGH":
      return "bg-red-50 text-red-700 ring-1 ring-red-100";
    case "MEDIUM":
      return "bg-amber-50 text-amber-700 ring-1 ring-amber-100";
    case "LOW":
      return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getColumnStyles(status: "TODO" | "IN_PROGRESS" | "DONE") {
  switch (status) {
    case "TODO":
      return {
        wrapper: "border-slate-200 bg-white/70",
        badge: "bg-slate-100 text-slate-700",
        dot: "bg-slate-500",
        title: "To Do",
      };
    case "IN_PROGRESS":
      return {
        wrapper: "border-blue-200/60 bg-blue-50/60",
        badge: "bg-blue-100 text-blue-700",
        dot: "bg-blue-500",
        title: "In Progress",
      };
    case "DONE":
      return {
        wrapper: "border-emerald-200/70 bg-emerald-50/60",
        badge: "bg-emerald-100 text-emerald-700",
        dot: "bg-emerald-500",
        title: "Done",
      };
  }
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
      const response = await fetch(`/api/projects/${projectId}/tasks/${taskId}`, {
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
      setLocalTasks((prevTasks) =>
        prevTasks.map((t) =>
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
    return (
      /* FINAL UI POLISH: Better loading container */
      <div className="mt-6 rounded-3xl border border-slate-200 bg-white/80 p-8 text-center text-sm text-slate-500 shadow-sm">
        Loading tasks...
      </div>
    );
  }

  if (localTasks.length === 0) {
    return (
      <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-white/70 p-10 text-center">
        <h3 className="text-lg font-semibold text-slate-900">No tasks yet</h3>
        <p className="mt-2 text-sm text-slate-500">
          Create your first task to start organizing work.
        </p>
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
      <article
        key={task.id}
        className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900">{task.title}</h2>

            {task.description ? (
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {task.description}
              </p>
            ) : (
              /* FINAL UI POLISH: Better fallback when description is empty */
              <p className="mt-2 text-sm italic text-slate-400">
                No description provided
              </p>
            )}
          </div>

          <span
            className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${getPriorityStyles(
              task.priority
            )}`}
          >
            {formatPriority(task.priority)}
          </span>
        </div>

        {/* FINAL UI POLISH: Moved task metadata into a cleaner sub-surface */}
        <div className="mt-4 grid gap-2 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 sm:grid-cols-2">
          <div>
            <span className="font-semibold text-slate-800">Status:</span>{" "}
            {formatStatus(task.status)}
          </div>

          <div>
            <span className="font-semibold text-slate-800">Due:</span>{" "}
            {task.dueDate
              ? new Date(task.dueDate).toLocaleDateString()
              : "None"}
          </div>

          <div className="sm:col-span-2">
            <span className="font-semibold text-slate-800">Assignee:</span>{" "}
            {task.assignee
              ? task.assignee.name ?? task.assignee.email
              : "Unassigned"}
          </div>
        </div>

        {/* WEEK 5: Task status change buttons */}
        {/* FINAL UI POLISH: Unified button style for status actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => updateStatus(task.id, "TODO")}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 cursor-pointer"
          >
            Todo
          </button>

          <button
            onClick={() => updateStatus(task.id, "IN_PROGRESS")}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 cursor-pointer"
          >
            Start
          </button>

          <button
            onClick={() => updateStatus(task.id, "DONE")}
            className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-slate-300 hover:bg-slate-50 cursor-pointer"
          >
            Done
          </button>
        </div>

        {/* WEEK 5: Task comments */}
        {/* FINAL UI POLISH: Wrapped comments in a softer panel to separate it from task metadata */}
        <div className="mt-4 rounded-2xl bg-slate-50/80 p-3">
          <TaskComments taskId={task.id} projectId={projectId} />
        </div>
      </article>
    );
  }

  return (
    /*
    WEEK 5: Converted task list into Kanban layout
    */
    <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-3">
      {[
        { key: "TODO" as const, items: todo },
        { key: "IN_PROGRESS" as const, items: inProgress },
        { key: "DONE" as const, items: done },
      ].map((column) => {
        const styles = getColumnStyles(column.key);

        return (
          <div
            key={column.key}
            className={`rounded-[28px] border p-4 shadow-sm ${styles.wrapper}`}
          >
            {/* FINAL UI POLISH: Styled column header with dot + count badge */}
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className={`h-3 w-3 rounded-full ${styles.dot}`} />
                <h2 className="text-base font-semibold text-slate-900">
                  {styles.title}
                </h2>
              </div>

              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${styles.badge}`}>
                {column.items.length}
              </span>
            </div>

            <div className="space-y-4">
              {column.items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white/60 px-4 py-6 text-center text-sm text-slate-400">
                  No tasks here
                </div>
              ) : (
                column.items.map(renderTask)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}