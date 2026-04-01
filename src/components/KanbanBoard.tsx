"use client";

import { useState } from "react";

type Task = {
  id: string;
  title: string;
  status: "todo" | "inprogress" | "done";
};

const statuses = ["todo", "inprogress", "done"];

export default function KanbanBoard({ tasks }: { tasks: Task[] }) {
  const grouped = {
    todo: tasks.filter((t) => t.status === "todo"),
    inprogress: tasks.filter((t) => t.status === "inprogress"),
    done: tasks.filter((t) => t.status === "done"),
  };

  return (
    <div className="grid grid-cols-3 gap-4">
      {statuses.map((status) => (
        <div key={status} className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-3 capitalize">{status}</h2>

          {grouped[status as keyof typeof grouped].map((task) => (
            <div
              key={task.id}
              className="bg-white p-2 mb-2 shadow rounded"
            >
              {task.title}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}