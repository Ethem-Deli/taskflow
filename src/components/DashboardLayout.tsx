export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="hidden md:block w-64 bg-gray-900 text-white p-5"> {/* ED: Added padding to sidebar for better spacing */}
        <h2 className="text-xl font-bold mb-6">TaskFlow</h2>
        <ul className="space-y-2">
          <li className="hover:text-gray-300 cursor-pointer">Dashboard</li>
          <li className="hover:text-gray-300 cursor-pointer">Projects</li>
          <li className="hover:text-gray-300 cursor-pointer">Tasks</li>
        </ul>
      </div>

      {/* Main content */}
      <div className="flex-1 p-6 bg-gray-100">
        {children}
      </div>
    </div>
  );
}