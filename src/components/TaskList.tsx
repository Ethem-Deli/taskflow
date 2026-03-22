type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  dueDate?: string | null;
};

export default function TaskList({
  tasks,
  loading,
}: {
  tasks: Task[];
  loading: boolean;
}) {
  if (loading) return <p className="mt-6 text-slate-500">Loading tasks...</p>;
  if (tasks.length === 0) return <p className="mt-6 text-slate-500">No tasks yet.</p>;

  return (
    <div className="mt-6 space-y-4">
      {tasks.map((task) => (
        <article key={task.id} className="rounded-xl border p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold">{task.title}</h2>
              {task.description ? (
                <p className="mt-1 text-sm text-slate-600">{task.description}</p>
              ) : null}
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">
              {task.priority}
            </span>
          </div>

          <div className="mt-3 flex gap-2 text-xs text-slate-500">
            <span>Status: {task.status}</span>
            <span>•</span>
            <span>
              Due:{" "}
              {task.dueDate
                ? new Date(task.dueDate).toLocaleDateString()
                : "None"}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}