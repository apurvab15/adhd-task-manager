"use client";

import { useState, useEffect } from "react";
import { violetPalette, skyPalette, type ColorPalette } from "./TaskListDrawer";

const STORAGE_KEY = "adhd-task-lists";

type Task = {
  id: number;
  text: string;
  done: boolean;
};

type TaskList = {
  id: number;
  name: string;
  tasks: Task[];
};

type AddTasksModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddTasks: (tasks: Array<{ id: number; text: string; done: boolean; sourceListId?: number; sourceListName?: string }>) => void;
  existingTaskIds: Set<number>;
  mode?: "inattentive" | "hyperactive";
};

export default function AddTasksModal({ isOpen, onClose, onAddTasks, existingTaskIds, mode = "hyperactive" }: AddTasksModalProps) {
  const colorPalette: ColorPalette = mode === "inattentive" ? skyPalette : violetPalette;
  const [allTasks, setAllTasks] = useState<Array<{ task: Task; listName: string; listId: number }>>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<number>>(new Set());

  // Load all unticked tasks from all lists
  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return;

    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const taskLists: TaskList[] = JSON.parse(saved);
        const untickedTasks: Array<{ task: Task; listName: string; listId: number }> = [];

        taskLists.forEach((list) => {
          list.tasks.forEach((task) => {
            if (!task.done && !existingTaskIds.has(task.id)) {
              untickedTasks.push({ task, listName: list.name, listId: list.id });
            }
          });
        });

        setAllTasks(untickedTasks);
      }
    } catch (error) {
      console.error("Error loading tasks:", error);
    }
  }, [isOpen, existingTaskIds]);

  const handleTaskToggle = (taskId: number) => {
    setSelectedTaskIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedTaskIds.size === allTasks.length) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(allTasks.map(({ task }) => task.id)));
    }
  };

  const handleAdd = () => {
    if (selectedTaskIds.size === 0) return;

    const selectedTasks = allTasks
      .filter(({ task }) => selectedTaskIds.has(task.id))
      .map(({ task, listName, listId }) => ({
        id: task.id,
        text: task.text,
        done: false,
        sourceListId: listId,
        sourceListName: listName,
      }));

    onAddTasks(selectedTasks);
    setSelectedTaskIds(new Set());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className={`w-full max-w-2xl max-h-[90vh] rounded-3xl border ${colorPalette.border} bg-gradient-to-b ${colorPalette.bg} shadow-2xl ${colorPalette.shadow} flex flex-col my-auto`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0">
          <h2 className={`text-2xl font-semibold ${colorPalette.textDark}`}>Add Tasks from Task Lists</h2>
          <button
            onClick={onClose}
            className={`rounded-lg p-1 ${colorPalette.textMuted} transition-colors ${colorPalette.hoverBg}`}
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
        <div className="px-6 pb-4 space-y-4 overflow-y-auto flex-1 min-h-0">
          <div className={`rounded-2xl border ${colorPalette.borderLight} bg-white/80 p-4`}>
            <div className="mb-3 flex items-center justify-between">
              <label className={`text-sm font-semibold ${colorPalette.textDark}`}>
                Select Tasks ({selectedTaskIds.size} selected)
              </label>
              {allTasks.length > 0 && (
                <button
                  onClick={handleSelectAll}
                  className={`text-xs font-medium ${colorPalette.text} ${colorPalette.textDark.replace('text-', 'hover:text-')}`}
                >
                  {selectedTaskIds.size === allTasks.length ? "Deselect All" : "Select All"}
                </button>
              )}
            </div>

            <div className="max-h-64 space-y-2 overflow-y-auto">
              {allTasks.length === 0 ? (
                <p className={`py-8 text-center text-sm ${colorPalette.textMuted}`}>
                  No unticked tasks available to add.
                </p>
              ) : (
                allTasks.map(({ task, listName }) => (
                  <label
                    key={task.id}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border ${colorPalette.borderLight} bg-white p-3 transition-colors ${colorPalette.hoverBg}`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTaskIds.has(task.id)}
                      onChange={() => handleTaskToggle(task.id)}
                      className={`mt-1 h-4 w-4 cursor-pointer rounded ${colorPalette.border} ${colorPalette.text} ${mode === "inattentive" ? "focus:ring-sky-500" : "focus:ring-violet-500"}`}
                    />
                    <div className="flex-1">
                      <p className={`text-sm ${colorPalette.textDark}`}>{task.text}</p>
                      <p className={`mt-1 text-xs ${colorPalette.textMuted}`}>from {listName}</p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-end border-t ${colorPalette.borderLight} p-6 pt-4 flex-shrink-0`}>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className={`rounded-xl border ${colorPalette.borderLight} bg-white px-4 py-2 text-sm font-semibold ${colorPalette.text} transition-colors ${colorPalette.hoverBg}`}
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={selectedTaskIds.size === 0}
              className={`rounded-xl ${colorPalette.accent} px-4 py-2 text-sm font-semibold text-white transition-colors ${colorPalette.accentHover} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Add Tasks
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

