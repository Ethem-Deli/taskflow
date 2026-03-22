"use client";

import { useEffect, useState } from "react";

type Member = {
    userId: string;
    name: string | null;
    email: string;
    role: string;
    joinedAt: string;
};

type Props = {
    projectId: string;
    currentUserRole: string;
};

export default function MembersPanel({ projectId, currentUserRole }: Props) {
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState("");
    const [inviteError, setInviteError] = useState("");
    const [inviteSuccess, setInviteSuccess] = useState("");
    const [inviting, setInviting] = useState(false);
    const [removingId, setRemovingId] = useState<string | null>(null);

    const isOwner = currentUserRole === "OWNER";

    async function loadMembers() {
  try {
    const res = await fetch(`/api/projects/${projectId}/members`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to load members");
    }

    setMembers(data.members ?? []);
  } catch {
    setMembers([]);
  } finally {
    setLoading(false);
  }
}

    useEffect(() => {
        loadMembers();
    }, [projectId]);

    async function handleInvite(e: React.SyntheticEvent<HTMLFormElement>) {
        e.preventDefault();
        setInviteError("");
        setInviteSuccess("");
        setInviting(true);

        try {
            const res = await fetch(`/api/projects/${projectId}/members`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await res.json();

            if (!res.ok) {
                setInviteError(data.error || "Failed to invite member");
                return;
            }

            setEmail("");
            setInviteSuccess(`${data.member.email} was added to the project.`);
            loadMembers();
        } catch {
            setInviteError("Something went wrong");
        } finally {
            setInviting(false);
        }
    }

    async function handleRemove(userId: string) {
        setRemovingId(userId);

        try {
            const res = await fetch(
                `/api/projects/${projectId}/members/${userId}`,
                { method: "DELETE" }
            );

            if (!res.ok) {
                const data = await res.json();
                alert(data.error || "Failed to remove member");
                return;
            }

            loadMembers();
        } catch {
            alert("Something went wrong");
        } finally {
            setRemovingId(null);
        }
    }

    return (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold">Members</h2>

            {/* Invite form — only visible to OWNER */}
            {isOwner && (
                <form onSubmit={handleInvite} className="mt-4 flex gap-2">
                    <input
                        type="email"
                        placeholder="Invite by email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full rounded-lg border p-3 text-sm"
                        required
                    />
                    <button
                        type="submit"
                        disabled={inviting}
                        className="whitespace-nowrap rounded-lg bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
                    >
                        {inviting ? "Inviting..." : "Invite"}
                    </button>
                </form>
            )}

            {inviteError && (
                <p className="mt-2 text-sm text-red-600">{inviteError}</p>
            )}
            {inviteSuccess && (
                <p className="mt-2 text-sm text-green-600">{inviteSuccess}</p>
            )}

            {/* Members list */}
            <div className="mt-5 space-y-2">
                {loading ? (
                    <p className="text-sm text-slate-500">Loading members...</p>
                ) : members.length === 0 ? (
                    <p className="text-sm text-slate-500">No members yet.</p>
                ) : (
                    members.map((m) => (
                        <div
                            key={m.userId}
                            className="flex items-center justify-between rounded-xl border px-4 py-3"
                        >
                            <div>
                                <p className="text-sm font-medium">
                                    {m.name ?? m.email}
                                </p>
                                {m.name && (
                                    <p className="text-xs text-slate-500">{m.email}</p>
                                )}
                            </div>

                            <div className="flex items-center gap-3">
                                <span
                                    className={`rounded-full px-3 py-1 text-xs font-medium ${m.role === "OWNER"
                                            ? "bg-slate-900 text-white"
                                            : "bg-slate-100 text-slate-600"
                                        }`}
                                >
                                    {m.role}
                                </span>

                                {/* Remove button — only owner can remove, and only MEMBER roles */}
                                {isOwner && m.role !== "OWNER" && (
                                    <button
                                        onClick={() => handleRemove(m.userId)}
                                        disabled={removingId === m.userId}
                                        className="text-xs text-red-500 hover:underline disabled:opacity-50"
                                    >
                                        {removingId === m.userId ? "Removing..." : "Remove"}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}