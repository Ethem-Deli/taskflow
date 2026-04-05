"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import TaskList from "@/components/TaskList";
import TaskForm from "@/components/TaskForm";
import TaskFilter from "@/components/TaskFilter";
import MembersPanel from "@/components/MembersPanel";

type Project = {
  id: string;
  name: string;
  description?: string | null;
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

type Filters = {
  search: string;
  status: "TODO" | "IN_PROGRESS" | "DONE" | "";
  priority: "LOW" | "MEDIUM" | "HIGH" | "";
};

export default function ProjectDetailPage() {
  const { status: authStatus } = useSession();
  const router = useRouter();
  const { projectId } = useParams<{ projectId: string }>();

  const [project, setProject] = useState<Project | null>(null);
  const [role, setRole] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"tasks" | "members">("tasks");
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [filters, setFilters] = useState<Filters>({ search: "", status: "", priority: "" });

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
  }, [authStatus, router]);

  useEffect(() => {
    if (authStatus !== "authenticated") return;

    fetch(`/api/projects/${projectId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setProject(data.project);
        setRole(data.role);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [authStatus, projectId]);

  async function loadTasks(appliedFilters: Filters = filters) {
    setLoading(true);
    const params = new URLSearchParams();
    if (appliedFilters.search.trim()) params.set("q", appliedFilters.search.trim());
    if (appliedFilters.status) params.set("status", appliedFilters.status);
    if (appliedFilters.priority) params.set("priority", appliedFilters.priority);

    const hasFilters = appliedFilters.search.trim() || appliedFilters.status || appliedFilters.priority;
    const base = hasFilters
      ? `/api/projects/${projectId}/tasks/search`
      : `/api/projects/${projectId}/tasks`;
    const url = params.size > 0 ? `${base}?${params}` : base;

    try {
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load tasks");
      setTasks(data.tasks ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (authStatus !== "authenticated" || !project) return;
    loadTasks();
  }, [authStatus, project]);

  function handleFilter(newFilters: Filters) {
    setFilters(newFilters);
    loadTasks(newFilters);
  }

  if (authStatus === "loading" || (loading && !project)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading project...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!project) return null;

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">

          {/* Header */}
          <div>
            <button
              onClick={() => router.push("/projects")}
              className="mb-1 text-sm text-blue-900 hover:text-blue-600 cursor-pointer"
            >
              ← Projects
            </button>
            <h1 className="text-base font-semibold text-gray-900">{project.name}</h1>
            {project.description && (
              <p className="mt-1 text-sm text-slate-500">{project.description}</p>
            )}
          </div>

          {/* Tabs + New task button */}
          <div className="flex items-center gap-3">
            <div className="flex w-fit gap-1 rounded-xl border bg-white p-1 mr-auto">
              <button
                onClick={() => setActiveTab("tasks")}
                className={`cursor-pointer rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === "tasks" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                Tasks
              </button>
              <button
                onClick={() => setActiveTab("members")}
                className={`cursor-pointer rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === "members" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50"
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

          {/* Tasks tab */}
          {activeTab === "tasks" && (
            <>
              <TaskFilter horizontal onFilter={handleFilter} />
              <section className="rounded-2xl bg-white p-6 shadow-sm">
                <p className="mt-1 text-slate-600">All tasks in one place.</p>
                <TaskList tasks={tasks} loading={loading} projectId={projectId} />
              </section>
            </>
          )}

          {/* Members tab */}
          {activeTab === "members" && (
            <MembersPanel projectId={projectId} currentUserRole={role} />
          )}

        </div>
      </div>

      {/* New task modal */}
      {showTaskForm && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40" onClick={() => setShowTaskForm(false)}>
          <div className="relative w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowTaskForm(false)}
              className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600 cursor-pointer text-lg leading-none"
            >
              &times;
            </button>
            <TaskForm
              projectId={projectId}
              onCreated={() => {
                setShowTaskForm(false);
                loadTasks();
              }}
            />
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}