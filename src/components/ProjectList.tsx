type Project = {
  id: string;
  name: string;
};

export default function ProjectList({
  projects,
  activeProjectId,
  setActiveProjectId,
}: {
  projects: Project[];
  activeProjectId: string | null;
  setActiveProjectId: (id: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto">
      {projects.map((p) => (
        <button
          key={p.id}
          onClick={() => setActiveProjectId(p.id)}
          className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            activeProjectId === p.id
              ? "bg-slate-900 text-white"
              : "border text-slate-600 hover:bg-slate-50"
          }`}
        >
          {p.name}
        </button>
      ))}
    </div>
  );
}