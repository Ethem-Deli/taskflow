"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import TaskForm from "@/components/TaskForm";
import MembersPanel from "@/components/MembersPanel";
import DashboardLayout from "@/components/DashboardLayout";
import TaskList from "@/components/TaskList";
import ProjectList from "@/components/ProjectList";
import TaskFilter from "@/components/TaskFilter";
import { useAlert } from "@/context/AlertContext";

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

  const { showAlert } = useAlert();

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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

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
      const msg = err instanceof Error ? err.message : "Failed to load projects";
      setError(msg);

      // Week 6 : NEW
      showAlert("error", msg);

      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, [activeProjectId, showAlert]);

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
      const msg = err instanceof Error ? err.message : "Failed to load tasks";
      setError(msg);

      // Week : 6 :NEW
      showAlert("error", msg);

      setTasks([]);
    } finally {
      setLoading(false);
    }
  }

  const handleFilter = (newFilters: typeof filters) => {
    setFilters(newFilters);
    if (activeProjectId) loadTasks(activeProjectId, newFilters);
  };

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
    return <div className="flex min-h-screen items-center justify-center">Checking session...</div>;
  }

  if (status === "unauthenticated") return null;

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <h1 className="text-base font-semibold text-gray-900">Dashboard</h1>

          {error && <p className="text-red-500">{error}</p>}

          {projects.length > 0 && (
            <ProjectList
              projects={projects}
              activeProjectId={activeProjectId}
              setActiveProjectId={setActiveProjectId}
            />
          )}

          {activeProjectId && activeProject && (
            <>
              <TaskFilter horizontal onFilter={handleFilter} />

              <TaskList
                tasks={tasks}
                loading={loading}
                projectId={activeProjectId}
              />
            </>
          )}
        </div>
      </div>

      {showTaskForm && activeProjectId && (
        <TaskForm
          projectId={activeProjectId}
          onCreated={() => {
            setShowTaskForm(false);
            loadTasks(activeProjectId);

            // week 6 : NEW
            showAlert("success", "Task created successfully");
          }}
        />
      )}
    </DashboardLayout>
  );
}