"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";

type Project = {
    id: string;
    name: string;
    role: string;
};

export default function ProjectsPage() {
    const { status } = useSession();
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push("/login");
        }
    }, [status, router]);

    useEffect(() => {
        async function loadProjects() {
            try {
                setError("");
                setLoading(true);

                const res = await fetch("/api/projects");
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || "Failed to load projects");
                }

                setProjects(data.projects ?? []);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load projects");
            } finally {
                setLoading(false);
            }
        }

        if (status === "authenticated") {
            loadProjects();
        }
    }, [status]);

    if (status === "loading") {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <p className="text-slate-500">Loading...</p>
            </div>
        );
    }

    if (status === "unauthenticated") {
        return null;
    }

    return (
        <DashboardLayout>
            <main className="min-h-screen px-6 py-10">
                <div className="mx-auto max-w-6xl space-y-6">
                    <div>
                        <h1 className="text-2xl font-bold">Projects</h1>
                        <p className="mt-1 text-slate-600">View all your projects in one place.</p>
                    </div>

                    {error && (
                        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                            {error}
                        </p>
                    )}

                    {loading ? (
                        <p className="text-slate-500">Loading projects...</p>
                    ) : projects.length === 0 ? (
                        <div className="rounded-2xl bg-white p-6 shadow-sm">
                            <p className="text-slate-500">No projects found yet.</p>
                            <p className="mt-2 text-sm text-slate-400">
                                Create a project from the dashboard to get started.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {projects.map((project) => (
                                <div key={project.id} className="rounded-2xl bg-white p-5 shadow-sm">
                                    <h2 className="text-lg font-semibold">{project.name}</h2>
                                    <p className="mt-2 text-sm text-slate-500">Role: {project.role}</p>

                                    <div className="mt-4">
                                        <Link
                                            href="/dashboard"
                                            className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm text-white"
                                        >
                                            Open in Dashboard
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </DashboardLayout>
    );
}