"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const navItems = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Projects", href: "/projects" },
  { label: "Tasks", href: "/tasks" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Sidebar */}
      <div className="hidden md:flex md:flex-col w-64 bg-gray-900 text-white p-5 sticky top-0 h-screen shrink-0">
        <h2 className="text-xl font-bold mb-6">TaskFlow</h2>
        <div className="flex flex-col justify-between flex-1 min-h-0">
          <ul className="space-y-2">
            {navItems.map(({ label, href }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                    pathname === href
                      ? "bg-gray-700 text-white font-medium"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="block w-full text-left px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-6 bg-gray-100">
        {children}
      </div>
    </div>
  );
}