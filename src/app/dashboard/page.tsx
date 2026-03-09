"use client";

import { useEffect, useState } from "react";
import TaskForm from "@/components/TaskForm";

type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate?: string | null;
};

export default function DashboardPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadTasks() {
    try {
      setLoading(true);
      const response = await fetch("/api/tasks");
      const data = await response.json();
      setTasks(data.tasks ?? []);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[380px_1fr]">
        <TaskForm onCreated={loadTasks} />

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="mt-1 text-slate-600">All tasks in one place.</p>

          {loading ? (
            <p className="mt-6 text-slate-500">Loading tasks...</p>
          ) : tasks.length === 0 ? (
            <p className="mt-6 text-slate-500">No tasks yet.</p>
          ) : (
            <div className="mt-6 space-y-4">
              {tasks.map((task) => (
                <article key={task.id} className="rounded-xl border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-semibold">{task.title}</h2>
                      {task.description ? (
                        <p className="mt-1 text-sm text-slate-600">
                          {task.description}
                        </p>
                      ) : null}
                    </div>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">
                      {task.priority}
                    </span>
                  </div>

                  <div className="mt-3 flex gap-2 text-xs text-slate-500">
                    <span>Status: {task.status}</span>
                    <span>•</span>
                    <span>
                      Due:{" "}
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString()
                        : "None"}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}