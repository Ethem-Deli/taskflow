import { render, screen } from "@testing-library/react";
import KanbanBoard from "../components/KanbanBoard";

test("renders tasks in columns", () => {
  const tasks: Array<{ id: string; title: string; status: "todo" | "inprogress" | "done" }> = [
    { id: "1", title: "Test Task", status: "todo" },
  ];

  render(<KanbanBoard tasks={tasks} />);

  expect(screen.getByText("Test Task")).toBeInTheDocument();
});