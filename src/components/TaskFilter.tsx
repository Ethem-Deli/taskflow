"use client";

import { useState } from "react";

export default function TaskFilter({
  onFilter,
  horizontal = false,
}: {
  onFilter: (filters: {
    search: string;
    status: "TODO" | "IN_PROGRESS" | "DONE" | "";
    priority: "LOW" | "MEDIUM" | "HIGH" | "";
  }) => void;
  horizontal?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"TODO" | "IN_PROGRESS" | "DONE" | "">("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "">("");

  const handleFilter = () => {
    onFilter({ search, status, priority });
  };

  const handleReset = () => {
    setSearch("");
    setStatus("");
    setPriority("");
    onFilter({ search: "", status: "", priority: "" });
  };

  if (horizontal) {
    return (
      <div className="flex items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-slate-700 mb-1">Search</label>
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleFilter()}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="w-40">
          <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "TODO" | "IN_PROGRESS" | "DONE" | "")}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
          </select>
        </div>
        <div className="w-40">
          <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH" | "")}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Priorities</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
        <button
          onClick={handleFilter}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-md font-medium transition-colors cursor-pointer"
        >
          Apply
        </button>
        <button
          onClick={handleReset}
          className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm rounded-md font-medium transition-colors cursor-pointer"
        >
          Reset
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Search
        </label>
        <input
          type="text"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleFilter()}
          className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Status
          </label>
          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as "TODO" | "IN_PROGRESS" | "DONE" | "")
            }
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Priority
          </label>
          <select
            value={priority}
            onChange={(e) =>
              setPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH" | "")
            }
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Priorities</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleFilter}
          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white text-sm px-4 py-2 rounded-md font-medium transition-colors"
        >
          Apply Filters
        </button>
        <button
          onClick={handleReset}
          className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm px-4 py-2 rounded-md font-medium transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
