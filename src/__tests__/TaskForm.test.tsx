import { render, screen } from "@testing-library/react";
import TaskForm from "@/components/TaskForm";

describe("TaskForm", () => {
  it("renders create task form", () => {
    render(<TaskForm projectId="1" />);

    expect(screen.getByText("Create task")).toBeInTheDocument();
  });
});