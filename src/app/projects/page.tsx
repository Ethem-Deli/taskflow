"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DashboardLayout from "@/components/DashboardLayout";
import Pagination from "@/components/Pagination";
import { useAlert } from "@/context/AlertContext";

type Project = {
  id: string;
  name: string;
  description?: string | null;
  role: string;
  createdAt: string;
};

const PAGE_SIZE = 10;

export default function ProjectsPage() {
  const { status } = useSession();
  const router = useRouter();
  const { showAlert } = useAlert();

  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Edit modal
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "" });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // Create modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", description: "" });
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  async function loadProjects() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/projects?page=${page}&limit=${PAGE_SIZE}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Failed to load projects");

      setProjects(data.projects ?? []);
      setTotal(data.total ?? 0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load projects";
      setError(msg);
      showAlert("error", msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (status === "authenticated") {
      loadProjects();
    }
  }, [status, page]);

  function openCreate() {
    setCreateForm({ name: "", description: "" });
    setCreateError("");
    setShowCreateModal(true);
  }

  function closeCreate() {
    setShowCreateModal(false);
    setCreateError("");
  }

  async function handleCreate(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError("");

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name,
          description: createForm.description || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Failed to create project");

      closeCreate();
      loadProjects();
      showAlert("success", "Project created successfully");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create project";
      setCreateError(msg);
      showAlert("error", msg);
    } finally {
      setCreateLoading(false);
    }
  }

  function openEdit(project: Project) {
    setEditingProject(project);
    setEditForm({ name: project.name, description: project.description ?? "" });
    setEditError("");
  }

  function closeEdit() {
    setEditingProject(null);
    setEditError("");
  }

  async function handleCreateTask() {
    try {
      // kept as requested (not removed)
      showAlert("success", "Task created successfully");
    } catch (error) {
      showAlert("error", "Failed to create task");
    }
  }

  async function handleEdit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingProject) return;

    setEditLoading(true);
    setEditError("");

    try {
      const res = await fetch(`/api/projects/${editingProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Failed to update project");

      setProjects((prev) =>
        prev.map((p) =>
          p.id === editingProject.id
            ? {
                ...p,
                name: data.project.name,
                description: data.project.description,
              }
            : p
        )
      );

      closeEdit();
      showAlert("success", "Project updated successfully");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to update project";
      setEditError(msg);
      showAlert("error", msg);
    } finally {
      setEditLoading(false);
    }
  }

  async function handleDelete(project: Project) {
    if (!confirm(`Are you sure you want to delete "${project.name}"? This cannot be undone.`))
      return;

    setDeletingId(project.id);

    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) throw new Error(data.error ?? "Failed to delete project");

      setProjects((prev) => prev.filter((p) => p.id !== project.id));
      setTotal((prev) => prev - 1);

      showAlert("success", "Project deleted successfully");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete project";
      setError(msg);
      showAlert("error", msg);
    } finally {
      setDeletingId(null);
    }
  }

  if (status === "loading" || (loading && projects.length === 0)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading projects...</p>
      </div>
    );
  }

  const modalFormClasses =
    "mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900";

  return (
    <DashboardLayout>
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-base font-semibold text-gray-900">Projects</h1>
            <p className="mt-2 text-sm text-gray-700">
              A list of all the projects you are a member of, including your role and when they were created.
            </p>
          </div>

          <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
            <button
              type="button"
              onClick={openCreate}
              className="rounded-lg border px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              + New project
            </button>
          </div>
        </div>

        {error && (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              {!loading && projects.length === 0 ? (
                <p className="text-sm text-gray-500">
                  You are not a member of any projects yet.
                </p>
              ) : (
                <>
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead>
                      <tr>
                        <th className="py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                          Name
                        </th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Description
                        </th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Role
                        </th>
                        <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Created
                        </th>
                        <th className="py-3.5 pr-4 pl-3 sm:pr-0" />
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200">
                      {projects.map((project) => (
                        <tr key={project.id}>
                          <td className="py-4 pr-3 pl-4 text-sm font-medium whitespace-nowrap text-gray-900 sm:pl-0">
                            <Link
                              href={`/projects/${project.id}`}
                              className="text-blue-900 hover:text-blue-600"
                            >
                              {project.name}
                            </Link>
                          </td>

                          <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500">
                            {project.description ?? "—"}
                          </td>

                          <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500 capitalize">
                            {project.role.toLowerCase()}
                          </td>

                          <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500">
                            {new Date(project.createdAt).toLocaleDateString()}
                          </td>

                          <td className="py-4 pr-4 pl-3 text-right text-sm whitespace-nowrap">
                            {project.role === "OWNER" && (
                              <div className="flex justify-end gap-4">
                                <button
                                  onClick={() => openEdit(project)}
                                  className="text-blue-900 hover:text-blue-600"
                                >
                                  Edit
                                </button>

                                <button
                                  onClick={() => handleDelete(project)}
                                  disabled={deletingId === project.id}
                                  className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                >
                                  {deletingId === project.id ? "Deleting…" : "Delete"}
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <Pagination
                    page={page}
                    limit={PAGE_SIZE}
                    total={total}
                    onPageChange={setPage}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-10 flex items-center justify-center bg-black/40"
          onClick={closeCreate}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold text-gray-900">New project</h2>

            <form onSubmit={handleCreate} className="mt-4 space-y-4">
              <input
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, name: e.target.value }))
                }
                className={modalFormClasses}
                placeholder="Project name"
                required
              />

              <textarea
                value={createForm.description}
                onChange={(e) =>
                  setCreateForm((f) => ({ ...f, description: e.target.value }))
                }
                className={modalFormClasses}
                placeholder="Description"
              />

              {createError && (
                <p className="text-sm text-red-600">{createError}</p>
              )}

              <button
                disabled={createLoading}
                className="w-full rounded bg-slate-900 py-2 text-white"
              >
                {createLoading ? "Creating..." : "Create"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingProject && (
        <div
          className="fixed inset-0 z-10 flex items-center justify-center bg-black/40"
          onClick={closeEdit}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold text-gray-900">Edit project</h2>

            <form onSubmit={handleEdit} className="mt-4 space-y-4">
              <input
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, name: e.target.value }))
                }
                className={modalFormClasses}
              />

              <textarea
                value={editForm.description}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, description: e.target.value }))
                }
                className={modalFormClasses}
              />

              {editError && (
                <p className="text-sm text-red-600">{editError}</p>
              )}

              <button
                disabled={editLoading}
                className="w-full rounded bg-slate-900 py-2 text-white"
              >
                {editLoading ? "Saving..." : "Save changes"}
              </button>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
