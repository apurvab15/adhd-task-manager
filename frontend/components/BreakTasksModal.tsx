"use client";

import { useState, useEffect } from "react";
import { periwinklePalette, hyperactivePalette, type ColorPalette } from "./TaskListDrawer";

type BrokenTask = {
  id: number;
  text: string;
};

type BreakTasksModalProps = {
  isOpen: boolean;
  isLoading: boolean;
  tasks: string[];
  originalTask?: string;
  onClose: () => void;
  onDiscard: () => void;
  onAdd: (tasks: BrokenTask[]) => void;
  colorPalette?: ColorPalette;
};

export default function BreakTasksModal({
  isOpen,
  isLoading,
  tasks: initialTasks,
  originalTask,
  onClose,
  onDiscard,
  onAdd,
  colorPalette = periwinklePalette,
}: BreakTasksModalProps) {
  const [editableTasks, setEditableTasks] = useState<BrokenTask[]>([]);

  // Initialize editable tasks when tasks change
  useEffect(() => {
    if (initialTasks && initialTasks.length > 0) {
      setEditableTasks(
        initialTasks.map((text, index) => ({
          id: index,
          text: text.trim(),
        }))
      );
    }
  }, [initialTasks]);

  // Show modal if either loading or open (or both)
  if (!isOpen && !isLoading) return null;

  const handleTaskEdit = (id: number, newText: string) => {
    setEditableTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, text: newText } : task))
    );
  };

  const handleTaskDelete = (id: number) => {
    setEditableTasks((prev) => prev.filter((task) => task.id !== id));
  };

  const handleAdd = () => {
    const validTasks = editableTasks.filter((task) => task.text.trim() !== "");
    if (validTasks.length > 0) {
      onAdd(validTasks);
      setEditableTasks([]);
    }
  };

  // Loading overlay
  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-white/20 border-t-white"></div>
          <p className="text-xl font-semibold text-white">Breaking down task...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className={`w-full max-w-3xl rounded-3xl border-2 ${colorPalette.border} bg-white shadow-2xl flex flex-col overflow-hidden`}
        style={{ height: "85vh" }}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-6 pb-4 flex-shrink-0 border-b ${colorPalette.borderLight} bg-white`}>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Review Broken Tasks</h2>
            {originalTask && (
              <p className="mt-1 text-sm text-gray-600">Original: {originalTask}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition-colors hover:text-gray-600"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </div>

        {/* Body - Scrollable */}
        <div className={`px-6 pb-4 overflow-y-auto flex-1 min-h-0 ${colorPalette.accent === hyperactivePalette.accent ? "bg-gradient-to-b from-[#FFD1BF]/40 via-[#FEF2EC]/60 to-[#FEF2EC]" : "bg-white"}`}>
          {editableTasks.length === 0 ? (
            <div className="flex h-full items-center justify-center">
              <p className="text-gray-500">No tasks to display</p>
            </div>
          ) : (
            <div className="space-y-3 py-4">
              {editableTasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-start gap-2 rounded-xl border ${colorPalette.border} bg-white p-2 transition-colors ${colorPalette.hoverBg}`}
                >
                  <input
                    type="text"
                    value={task.text}
                    onChange={(e) => handleTaskEdit(task.id, e.target.value)}
                    className={`flex-1 rounded-lg bg-white px-2 py-1 text-base text-gray-900 placeholder:text-gray-400 focus:${colorPalette.accent.replace('bg-', 'border-')} focus:outline-none resize-none min-h-[60px]`}
                    //rows={Math.max(1, task.text.split("\n").length)}
                  />
                  <button
                    onClick={() => handleTaskDelete(task.id)}
                    className="flex-shrink-0 rounded-lg p-1 text-gray-400 transition-colors hover:text-red-500"
                    aria-label="Delete task"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-5 w-5"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between border-t ${colorPalette.borderLight} p-6 pt-4 flex-shrink-0 bg-white`}>
          <button
            onClick={() => {
              onDiscard();
              setEditableTasks([]);
            }}
            className="rounded-xl border-2 border-red-300 bg-white px-6 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
          >
            Discard
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className={`rounded-xl border-2 ${colorPalette.border} bg-white px-4 py-2 text-sm font-semibold text-gray-900 transition-colors ${colorPalette.hoverBg}`}
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={editableTasks.filter((t) => t.text.trim() !== "").length === 0}
              className={`rounded-xl ${colorPalette.accent} px-6 py-2 text-sm font-semibold text-white transition-colors ${colorPalette.accentHover} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Add Tasks ({editableTasks.filter((t) => t.text.trim() !== "").length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
