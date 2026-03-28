type Task = {
  id: string;
  title: string;
  description?: string | null;
  status: "TODO" | "IN_PROGRESS" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH";
  dueDate?: string | null;
  assignee?: {
    id: string;
    name: string | null;
    email: string;
  } | null;
};

function getStatusColor(status: string) {
  switch (status) {
    case "TODO":
      return "bg-yellow-100 text-yellow-800";
    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-800";
    case "DONE":
      return "bg-green-100 text-green-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case "HIGH":
      return "bg-red-100 text-red-700";
    case "MEDIUM":
      return "bg-orange-100 text-orange-700";
    case "LOW":
      return "bg-green-100 text-green-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function TaskList({
  tasks,
  loading,
}: {
  tasks: Task[];
  loading: boolean;
}) {
  if (loading) {
    return <p className="mt-6 text-slate-500">Loading tasks...</p>;
  }

  if (tasks.length === 0) {
    return (
      <div className="mt-6 rounded-xl border border-dashed p-6 text-center text-slate-500">
        No tasks created yet. Start by adding a new task.
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {tasks.map((task) => (
        <article key={task.id} className="rounded-xl border p-4 bg-white shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold">{task.title}</h2>

              {task.description ? (
                <p className="mt-1 text-sm text-slate-600">
                  {task.description}
                </p>
              ) : null}
            </div>

            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${getPriorityColor(
                task.priority
              )}`}
            >
              {task.priority}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">

            <span
              className={`rounded-full px-2 py-1 font-medium ${getStatusColor(
                task.status
              )}`}
            >
              {task.status}
            </span>

            <span>•</span>

            <span>
              Due:{" "}
              {task.dueDate
                ? new Date(task.dueDate).toLocaleDateString()
                : "None"}
            </span>

            <span>•</span>

            <span>
              Assignee:{" "}
              {task.assignee
                ? task.assignee.name ?? task.assignee.email
                : "Unassigned"}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
}