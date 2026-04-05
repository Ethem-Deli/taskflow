"use client";

import { useState } from "react";

type Props = {
    onCreated?: () => void;
};

type ProjectFormData = {
    name: string;
    description: string;
};

export default function ProjectForm({ onCreated }: Props) {
    const [form, setForm] = useState<ProjectFormData>({
        name: "",
        description: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch("/api/projects", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || "Failed to create project");
                setLoading(false);
                return;
            }

            setForm({ name: "", description: "" });
            onCreated?.();
        } catch {
            setError("Something went wrong");
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Create project</h2>

            <div className="mt-4 space-y-3">
                <input
                    type="text"
                    placeholder="Project name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-lg border p-3"
                    required
                />

                <textarea
                    placeholder="Description (optional)"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="min-h-28 w-full rounded-lg border p-3"
                />
            </div>

            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

            <button
                type="submit"
                disabled={loading}
                className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-3 text-white disabled:opacity-60"
            >
                {loading ? "Saving..." : "Create project"}
            </button>
        </form>
    );
}