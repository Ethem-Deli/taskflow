import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Sidebar */}
      <div className="hidden w-64 bg-gray-900 p-5 text-white md:block">
        <h2 className="mb-6 text-xl font-bold">TaskFlow</h2>

        <nav>
          <ul className="space-y-2">
            <li>
              <Link
                href="/dashboard"
                className="block rounded px-2 py-2 transition hover:bg-gray-800 hover:text-gray-300"
              >
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                href="/projects"
                className="block rounded px-2 py-2 transition hover:bg-gray-800 hover:text-gray-300"
              >
                Projects
              </Link>
            </li>
            <li>
              <Link
                href="/tasks"
                className="block rounded px-2 py-2 transition hover:bg-gray-800 hover:text-gray-300"
              >
                Tasks
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 bg-gray-100 p-6">{children}</div>
    </div>
  );
}