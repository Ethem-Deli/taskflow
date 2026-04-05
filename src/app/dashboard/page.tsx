"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import TaskForm from "@/components/TaskForm";
import MembersPanel from "@/components/MembersPanel";
import DashboardLayout from "@/components/DashboardLayout"; // ED: Import layout component
import TaskList from "@/components/TaskList";
import ProjectList from "@/components/ProjectList";
import TaskFilter from "@/components/TaskFilter";

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
  const [activeTab, setActiveTab] = useState<"tasks" | "members">("tasks");
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    status: "" as "TODO" | "IN_PROGRESS" | "DONE" | "",
    priority: "" as "LOW" | "MEDIUM" | "HIGH" | "",
  });

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

  async function loadTasks(projectId: string, appliedFilters?: typeof filters) {
    setError("");
    setLoading(true);

    try {
      const f = appliedFilters ?? filters;
      const hasFilters = f.search.trim() || f.status || f.priority;
      const params = new URLSearchParams();
      if (f.search.trim()) params.append("q", f.search);
      if (f.status) params.append("status", f.status);
      if (f.priority) params.append("priority", f.priority);

      const endpoint = hasFilters
        ? `/api/projects/${projectId}/tasks/search`
        : `/api/projects/${projectId}/tasks`;
      const url = params.size > 0 ? `${endpoint}?${params}` : endpoint;

      const res = await fetch(url);
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

  const handleFilter = (newFilters: typeof filters) => {
    setFilters(newFilters);
    if (activeProjectId) loadTasks(activeProjectId, newFilters);
  };

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
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <h1 className="text-base font-semibold text-gray-900">Dashboard</h1>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
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
              <div className="flex items-center gap-3">
                <div className="flex w-fit gap-1 rounded-xl border bg-white p-1 mr-auto">
                  <button
                    onClick={() => setActiveTab("tasks")}
                    className={`cursor-pointer rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${activeTab === "tasks"
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-50"
                      }`}
                  >
                    Tasks
                  </button>
                  <button
                    onClick={() => setActiveTab("members")}
                    className={`cursor-pointer rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${activeTab === "members"
                        ? "bg-slate-900 text-white"
                        : "text-slate-600 hover:bg-slate-50"
                      }`}
                  >
                    Members
                  </button>
                </div>

                {activeTab === "tasks" && (
                  <button
                    onClick={() => setShowTaskForm(true)}
                    className="rounded-lg border px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    + New task
                  </button>
                )}
              </div>

              {activeTab === "tasks" && (
                <>
                  <TaskFilter horizontal onFilter={handleFilter} />
                  <section className="rounded-2xl bg-white p-6 shadow-sm">
                    <p className="mt-1 text-slate-600">All tasks in one place.</p>
                    <TaskList tasks={tasks} loading={loading} projectId={activeProjectId} />
                  </section>
                </>
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
      </div>

      {showTaskForm && activeProjectId && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40" onClick={() => setShowTaskForm(false)}>
          <div className="relative w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowTaskForm(false)}
              className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600 cursor-pointer text-lg leading-none"
            >
              &times;
            </button>
            <TaskForm
              projectId={activeProjectId}
              onCreated={() => {
                setShowTaskForm(false);
                loadTasks(activeProjectId);
              }}
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}