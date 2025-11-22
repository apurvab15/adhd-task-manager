"use client";

import { useState } from "react";
import { type ColorPalette } from "./TaskListDrawer";

type Task = {
  id: string | number;
  text: string;
};

type SimpleTaskListProps = {
  tasks: Task[];
  onTasksChange?: (tasks: Task[]) => void;
  showDelete?: boolean;
  colorPalette?: ColorPalette;
  onTaskToggle?: (taskId: string | number, isChecked: boolean) => void;
};

export default function SimpleTaskList({
  tasks: initialTasks,
  onTasksChange,
  showDelete = false,
  colorPalette,
  onTaskToggle,
}: SimpleTaskListProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [checkedTasks, setCheckedTasks] = useState<Set<string | number>>(new Set());

  const handleTaskComplete = (taskId: string | number, isChecked: boolean) => {
    if (isChecked) {
      // Add to checked set
      setCheckedTasks((prev) => new Set(prev).add(taskId));
      
      // Move task to bottom
      const updatedTasks = [...tasks];
      const taskIndex = updatedTasks.findIndex((t) => t.id === taskId);
      
      if (taskIndex !== -1) {
        // Remove the task from its current position
        const [completedTask] = updatedTasks.splice(taskIndex, 1);
        // Add it to the bottom
        updatedTasks.push(completedTask);
        
        setTasks(updatedTasks);
        onTasksChange?.(updatedTasks);
      }
    } else {
      // Remove from checked set
      setCheckedTasks((prev) => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
    
    // Notify parent of task toggle
    onTaskToggle?.(taskId, isChecked);
  };

  const handleDelete = (taskId: string | number) => {
    const updatedTasks = tasks.filter((t) => t.id !== taskId);
    setTasks(updatedTasks);
    onTasksChange?.(updatedTasks);
  };

  return (
    <div className="w-full">
      <ul className="space-y-0">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="flex items-center gap-3 py-1"
          >
            <input
              type="checkbox"
              id={`task-${task.id}`}
              checked={checkedTasks.has(task.id)}
              onChange={(e) => handleTaskComplete(task.id, e.target.checked)}
              className={`h-4 w-4 cursor-pointer rounded border-2 transition-colors ${
                colorPalette
                  ? `border-[#7085FF]/60 bg-white text-[#7085FF] focus:ring-2 focus:ring-[#7085FF]/30 focus:border-[#7085FF] checked:bg-[#7085FF] checked:border-[#7085FF]`
                  : "border-gray-300"
              }`}
            />
            <label
              htmlFor={`task-${task.id}`}
              className={`flex-1 cursor-pointer text-gray-700 ${
                checkedTasks.has(task.id) ? "line-through" : ""
              }`}
            >
              {task.text}
            </label>
            {showDelete && (
              <button
                onClick={() => handleDelete(task.id)}
                className="rounded p-1 text-gray-400 transition-colors hover:text-red-500"
                aria-label="Delete task"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

