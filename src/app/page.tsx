import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-16">
      <div className="mx-auto max-w-4xl rounded-2xl bg-white p-10 shadow-sm">
        <h1 className="text-4xl font-bold tracking-tight">TaskFlow</h1>
        <p className="mt-4 text-lg text-slate-600">
          A lightweight team task management system for creating, assigning,
          and tracking project work.
        </p>

        <div className="mt-8 flex gap-4">
          <Link
            href="/register"
            className="rounded-lg bg-slate-900 px-5 py-3 text-white"
          >
            Create account
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-slate-300 px-5 py-3"
          >
            Login
          </Link>
        </div>
      </div>
    </main>
  );
}