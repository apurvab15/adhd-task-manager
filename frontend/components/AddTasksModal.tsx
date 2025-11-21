"use client";

import { useState, useEffect } from "react";
import { violetPalette, skyPalette, periwinklePalette, type ColorPalette } from "./TaskListDrawer";

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
  const colorPalette: ColorPalette = mode === "inattentive" ? periwinklePalette : violetPalette;
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
            // Show all incomplete tasks, even if they're already in today's list
            // This allows users to see all available tasks from all lists
            if (!task.done) {
              untickedTasks.push({ task, listName: list.name, listId: list.id });
            }
          });
        });

        setAllTasks(untickedTasks);
      } else {
        // If no task lists exist, set empty array
        setAllTasks([]);
      }
    } catch (error) {
      console.error("Error loading tasks:", error);
      setAllTasks([]);
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
      // Filter out tasks that are already in today's list to avoid duplicates
      .filter(({ task }) => !existingTaskIds.has(task.id))
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
      <div className={`w-full max-w-2xl max-h-[90vh] rounded-3xl border-2 ${colorPalette.border} bg-white shadow-2xl flex flex-col my-auto`}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0 border-b border-[#7085FF]/10">
          <h2 className="text-2xl font-semibold text-gray-900">Add Tasks from Task Lists</h2>
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
        <div className="px-6 pb-4 overflow-y-auto flex-1 min-h-0">
          <div className="mb-4 flex items-center justify-between pt-4">
            <label className="text-sm font-semibold text-gray-900">
              Select Tasks ({selectedTaskIds.size} selected)
            </label>
            {allTasks.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="text-xs font-medium text-gray-700 hover:text-gray-900"
              >
                {selectedTaskIds.size === allTasks.length ? "Deselect All" : "Select All"}
              </button>
            )}
          </div>

          <div className="max-h-64 space-y-2 overflow-y-auto">
            {allTasks.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-500">
                No unticked tasks available to add.
              </p>
            ) : (
              allTasks.map(({ task, listName, listId }) => (
                <label
                  key={`${listId}-${task.id}`}
                  className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#7085FF]/20 bg-white p-3 transition-colors hover:bg-[#7085FF]/5"
                >
                  <input
                    type="checkbox"
                    checked={selectedTaskIds.has(task.id)}
                    onChange={() => handleTaskToggle(task.id)}
                    className={`mt-1 h-4 w-4 cursor-pointer rounded border-2 border-[#7085FF]/60 bg-white text-[#7085FF] focus:ring-2 focus:ring-[#7085FF]/30 focus:border-[#7085FF] checked:bg-[#7085FF] checked:border-[#7085FF] transition-colors`}
                  />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{task.text}</p>
                    <p className="mt-1 text-xs text-gray-700">from {listName}</p>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-[#7085FF]/10 p-6 pt-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="rounded-xl border-2 border-[#7085FF]/20 bg-white px-4 py-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-[#7085FF]/10"
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

