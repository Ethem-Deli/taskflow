"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Projects", href: "/projects" },
  { label: "Tasks", href: "/tasks" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // SPRINT 4 UI IMPROVEMENT: Global loading state placeholder
  // This can later be connected to API requests or route loading
  const isLoading = false;

  return (
    <div className="min-h-screen bg-transparent text-slate-900">
      {/* SPRINT 4 RESPONSIVENESS IMPROVEMENT: Added responsive container handling */}
      <div className="mx-auto flex min-h-screen max-w-400 flex-col md:flex-row">
        
        {/* Sidebar */}
        {/* week-6-sprint-4 : Improved sidebar spacing, shadow, and visual hierarchy */}
        {/* TAsk FINAL UI POLISH: Reworked sidebar into a cleaner card-style navigation panel */}
        <aside className="hidden md:flex md:w-72 md:flex-col md:justify-between md:px-6 md:py-8">
          <div className="rounded-[28px] border border-white/30 bg-slate-950/95 p-6 text-white shadow-2xl shadow-slate-900/20">
            <div className="mb-10">
              {/* TAsk FINAL UI POLISH: Added clearer product identity and supporting text */}
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-blue-200/80">
                Workspace
              </p>
              <h1 className="mt-3 text-3xl font-bold tracking-tight">TaskFlow</h1>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Manage projects, tasks, and team activity with a cleaner final UI.
              </p>
            </div>

            {/* SPRINT 4 ACCESSIBILITY IMPROVEMENT */}
            <nav className="space-y-2" aria-label="Sidebar navigation">
              {navItems.map(({ label, href }) => {
                const active = pathname === href;

                return (
                  <Link
                    key={href}
                    href={href}
                    className={`group flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
                      active
                        ? "bg-white text-slate-950 shadow-lg"
                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span>{label}</span>

                    {/* TAsk FINAL UI POLISH: Small status dot to make active state feel more deliberate */}
                    <span
                      className={`h-2.5 w-2.5 rounded-full transition-all ${
                        active ? "bg-blue-600" : "bg-slate-600 group-hover:bg-slate-300"
                      }`}
                    />
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* week-6-sprint-4 : Improved logout button styling */}
          {/* Task FINAL UI POLISH: Updated sign out into a secondary action style button */}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="mt-5 rounded-2xl border border-slate-300/70 bg-white/80 px-4 py-3 text-left text-sm font-medium text-slate-700 shadow-sm backdrop-blur hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            Sign out
          </button>
        </aside>

        {/* SPRINT 4 RESPONSIVE WRAPPER */}
        <div className="flex-1 flex flex-col">

          {/* week-6-sprint-4 : Mobile header navigation for responsiveness */}
          {/* Task FINAL UI POLISH: Improved mobile header with better structure and modern nav pills */}
          <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/75 px-4 py-3 backdrop-blur md:hidden">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-slate-500">
                  TaskFlow
                </p>
                <h2 className="text-lg font-bold text-slate-900">Workspace</h2>
              </div>

              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm"
              >
                Sign out
              </button>
            </div>

            {/* SPRINT 4 MOBILE NAV ACCESSIBILITY */}
            <nav
              className="mt-3 flex gap-2 overflow-x-auto pb-1"
              aria-label="Mobile navigation"
            >
              {navItems.map(({ label, href }) => {
                const active = pathname === href;

                return (
                  <Link
                    key={href}
                    href={href}
                    className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                      active
                        ? "bg-slate-900 text-white shadow-sm"
                        : "border border-slate-200 bg-white text-slate-600"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          </header>

          {/* Main content */}
          {/* week-6-sprint-4 : Added max-width container, improved spacing and smoother UI layout */}
          {/* Task FINAL UI POLISH: Added glass-card page shell to make all pages feel consistent */}

          {/* SPRINT 4 UI SMOOTHNESS: Added subtle page transition */}
          <main className="flex-1 px-4 py-4 md:px-7 md:py-7 transition-all duration-200">
            <div className="min-h-[calc(100vh-2rem)] rounded-[30px] border border-white/50 bg-white/72 p-5 shadow-[0_25px_60px_rgba(15,23,42,0.08)] backdrop-blur md:p-8">
              {children}
            </div>
          </main>

        </div>
        {/* END OF RESPONSIVE WRAPPER */}
      </div>

      {/* SPRINT 4 GLOBAL LOADING OVERLAY */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="rounded-xl bg-white px-6 py-4 shadow-lg">
            <p className="text-sm font-medium text-slate-700">Loading...</p>
          </div>
        </div>
      )}
    </div>
  );
}