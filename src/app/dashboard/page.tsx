"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
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
};

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Controls visibility of the ProjectForm card
  const [showProjectForm, setShowProjectForm] = useState(false);

  // Controls which tab is active: tasks or members
  const [activeTab, setActiveTab] = useState<"tasks" | "members">("tasks");

  // Resolves the full active project object from the projects list
  // needed to pass currentUserRole to MembersPanel
  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;

  // Extracted to a named function so it can be
  // called both on mount and after creating a new project
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

  // Resets activeTab to "tasks" when switching projects
  useEffect(() => {
    if (activeProjectId) {
      loadTasks(activeProjectId);
      setActiveTab("tasks");
    } else {
      setTasks([]);
    }
  }, [activeProjectId]);

  // ED : Loading state so the app wont render empty UI while fetching projects on initial load.
  if (loading && projects.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-500 text-lg">Loading dashboard...</p>
      </div>
    );
  }

  return (
    // ED: Wrap entire page with DashboardLayout
    // This ensures the sidebar and layout structure are applied correctly
    <DashboardLayout>
      <main className="min-h-screen px-6 py-10">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <div className="flex items-center gap-3">
              {/* Toggles the ProjectForm card below the header */}
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

          {/* ProjectForm is only rendered when showProjectForm is true.
              After creating a project, hides the form and refreshes the project list. */}
          {showProjectForm && (
            <ProjectForm
              onCreated={() => {
                setShowProjectForm(false);
                loadProjects();
              }}
            />
          )}

          {/* Project tabs */}
          {projects.length > 0 && (
            <ProjectList
              projects={projects}
              activeProjectId={activeProjectId}
              setActiveProjectId={setActiveProjectId}
            />
          )}

          {/* Main content - only rendered when a project is selected */}
          {activeProjectId && activeProject ? (
            <div className="space-y-4">
              {/* Tab switcher between Tasks and Members views */}
              <div className="flex gap-1 rounded-xl border bg-white p-1 w-fit">
                <button
                  onClick={() => setActiveTab("tasks")}
                  className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                    activeTab === "tasks"
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Tasks
                </button>
                <button
                  onClick={() => setActiveTab("members")}
                  className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                    activeTab === "members"
                      ? "bg-slate-900 text-white"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Members
                </button>
              </div>

              {/* Tasks tab */}
              {activeTab === "tasks" && (
                <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
                  <TaskForm
                    projectId={activeProjectId}
                    onCreated={() => loadTasks(activeProjectId)}
                  />

                  <section className="rounded-2xl bg-white p-6 shadow-sm">
                    <p className="mt-1 text-slate-600">All tasks in one place.</p>

                    {/* ED: Use TaskList component so task rendering logic stays reusable and cleaner */}
                    <TaskList tasks={tasks} loading={loading} />
                  </section>
                </div>
              )}

              {/* Members tab renders MembersPanel component.
                  Passes projectId and the current user's role so the panel
                  knows whether to show the invite and remove controls. */}
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
    </DashboardLayout> //ED:Closing layout wrapper
  );
}