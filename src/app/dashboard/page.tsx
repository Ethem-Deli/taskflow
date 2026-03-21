"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import TaskForm from "@/components/TaskForm";
import ProjectForm from "@/components/ProjectForm";

type Project = {
  id: string;
  name: string;
  role: string;
};

type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate?: string | null;
};

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  {/* Project form */ }
  const [showProjectForm, setShowProjectForm] = useState(false);

  {/* Refactored loadProjects function */ }
  async function loadProjects() {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      const list: Project[] = data.projects ?? [];
      setProjects(list);
      if (list.length > 0 && !activeProjectId) setActiveProjectId(list[0].id);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  async function loadTasks(projectId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/tasks`);
      const data = await res.json();
      setTasks(data.tasks ?? []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (activeProjectId) loadTasks(activeProjectId);
    else setTasks([]);
  }, [activeProjectId]);

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dashboard</h1>

          {/* Project form toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowProjectForm((prev) => !prev)}
              className="rounded-lg border px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              {showProjectForm ? "Cancel" : "+ New project"}
            </button>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="rounded-lg border px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        </div>

          {/* Project form — shown only when toggled */}
          {showProjectForm && (
            <ProjectForm
              onCreated={() => {
                setShowProjectForm(false);
                loadProjects();
              }}
            />
          )}

          {projects.length > 0 && (
            <div className="flex gap-2 overflow-x-auto">
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActiveProjectId(p.id)}
                  className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${activeProjectId === p.id
                    ? "bg-slate-900 text-white"
                    : "border text-slate-600 hover:bg-slate-50"
                    }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}

          {activeProjectId ? (
            <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
              <TaskForm
                projectId={activeProjectId}
                onCreated={() => loadTasks(activeProjectId)}
              />

              <section className="rounded-2xl bg-white p-6 shadow-sm">
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
          ) : (
            <p className="text-slate-500">
              {loading ? "Loading..." : "You are not a member of any projects yet."}
            </p>
          )}
        </div>
    </main>
  );
}
