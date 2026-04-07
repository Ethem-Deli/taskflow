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
  /*
  WEEK 6 FINAL UI POLISH
  ----------------------
  Updated the project switcher UI:
  1. Added a proper container instead of plain buttons
  2. Added section heading and project count badge
  3. Improved active project styling
  4. Improved button spacing, border, hover, and polish
  */

  if (projects.length === 0) {
    return (
      /* FINAL UI POLISH: Better empty state styling */
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 px-4 py-5 text-sm text-slate-500">
        No projects yet.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200/70 bg-white/75 p-3 shadow-sm">
      {/* FINAL UI POLISH: Added section intro for stronger layout hierarchy */}
      <div className="mb-3 flex items-center justify-between gap-3 px-1">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
            Projects
          </p>
          <h2 className="mt-1 text-base font-semibold text-slate-900">
            Select a workspace
          </h2>
        </div>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
          {projects.length} total
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {projects.map((project) => {
          const active = activeProjectId === project.id;

          return (
            <button
              key={project.id}
              onClick={() => setActiveProjectId(project.id)}
              className={`whitespace-nowrap rounded-2xl border px-4 py-2.5 text-sm font-medium transition-all cursor-pointer ${
                active
                  ? "border-blue-200 bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              {project.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}