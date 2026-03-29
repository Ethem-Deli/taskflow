"use client";

import { useEffect, useState, useCallback } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import TaskForm from "@/components/TaskForm";
import ProjectForm from "@/components/ProjectForm";
import MembersPanel from "@/components/MembersPanel";
import DashboardLayout from "@/components/DashboardLayout"; // ED: Import layout component
import TaskList from "@/components/TaskList";
import ProjectList from "@/components/ProjectList";

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
  assignee?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
};

export default function DashboardPage() {
  const { status } = useSession();
  const router = useRouter();

  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"tasks" | "members">("tasks");

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;

  // Redirect unauthenticated users
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Load projects function wrapped in useCallback
  const loadProjects = useCallback(async () => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/projects");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load projects");
      }

      const list: Project[] = data.projects ?? [];
      setProjects(list);

      if (list.length > 0 && !activeProjectId) {
        setActiveProjectId(list[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load projects");
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [activeProjectId]);

  useEffect(() => {
    if (status === "authenticated") {
      loadProjects();
    }
  }, [status, loadProjects]);

  async function loadTasks(projectId: string) {
    setError("");
    setLoading(true);

    try {
      const res = await fetch(`/api/projects/${projectId}/tasks`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load tasks");
      }

      setTasks(data.tasks ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }

  // Reset tasks and tab when switching projects
  useEffect(() => {
    if (status !== "authenticated") return;

    if (activeProjectId) {
      loadTasks(activeProjectId);
      setActiveTab("tasks");
    } else {
      setTasks([]);
    }
  }, [activeProjectId, status]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-slate-500">Checking session...</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  if (loading && projects.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-slate-500">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <main className="min-h-screen px-6 py-10">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Dashboard</h1>
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

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          {showProjectForm && (
            <ProjectForm
              onCreated={() => {
                setShowProjectForm(false);
                loadProjects();
              }}
            />
          )}

          {projects.length > 0 && (
            <ProjectList
              projects={projects}
              activeProjectId={activeProjectId}
              setActiveProjectId={setActiveProjectId}
            />
          )}

          {activeProjectId && activeProject ? (
            <div className="space-y-4">
              <div className="flex w-fit gap-1 rounded-xl border bg-white p-1">
                <button
                  onClick={() => setActiveTab("tasks")}
                  className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${activeTab === "tasks"
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-50"
                    }`}
                >
                  Tasks
                </button>
                <button
                  onClick={() => setActiveTab("members")}
                  className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${activeTab === "members"
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-50"
                    }`}
                >
                  Members
                </button>
              </div>

              {activeTab === "tasks" && (
                <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
                  <TaskForm
                    projectId={activeProjectId}
                    onCreated={() => loadTasks(activeProjectId)}
                  />

                  <section className="rounded-2xl bg-white p-6 shadow-sm">
                    <p className="mt-1 text-slate-600">All tasks in one place.</p>
                    <TaskList tasks={tasks} loading={loading} />
                  </section>
                </div>
              )}

              {activeTab === "members" && (
                <MembersPanel
                  projectId={activeProjectId}
                  currentUserRole={activeProject.role}
                />
              )}
            </div>
          ) : (
            <p className="text-slate-500">
              {loading
                ? "Loading..."
                : "You are not a member of any projects yet. Create one to get started!"}
            </p>
          )}
        </div>
      </main>
    </DashboardLayout>
  );
}