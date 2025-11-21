"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { violetPalette } from "./TaskListDrawer";

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

type FocusModeModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

const STORAGE_KEY = "adhd-task-lists";
const FOCUS_MODE_STORAGE_KEY = "adhd-focus-mode-tasks";
const FOCUS_MODE_TIMER_KEY = "adhd-focus-mode-timer";

export default function FocusModeModal({ isOpen, onClose }: FocusModeModalProps) {
  const router = useRouter();
  const [allTasks, setAllTasks] = useState<Array<{ task: Task; listName: string }>>([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<number>>(new Set());
  const [timerMinutes, setTimerMinutes] = useState(25);

  // Load all unticked tasks from all lists
  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return;

    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const taskLists: TaskList[] = JSON.parse(saved);
        const untickedTasks: Array<{ task: Task; listName: string }> = [];

        taskLists.forEach((list) => {
          list.tasks.forEach((task) => {
            if (!task.done) {
              untickedTasks.push({ task, listName: list.name });
            }
          });
        });

        setAllTasks(untickedTasks);
      }
    } catch (error) {
      console.error("Error loading tasks:", error);
    }
  }, [isOpen]);

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

  const handleStartFocusMode = () => {
    if (selectedTaskIds.size === 0) return;

    // Get selected tasks
    const selectedTasks = allTasks
      .filter(({ task }) => selectedTaskIds.has(task.id))
      .map(({ task }) => ({ id: task.id, text: task.text }));

    // Save to localStorage
    if (typeof window !== "undefined") {
      window.localStorage.setItem(FOCUS_MODE_STORAGE_KEY, JSON.stringify(selectedTasks));
      window.localStorage.setItem(FOCUS_MODE_TIMER_KEY, timerMinutes.toString());
    }

    // Navigate to focus mode page
    router.push("/focus-mode");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl max-h-[90vh] rounded-3xl border border-violet-100 bg-gradient-to-b from-white via-violet-50 to-white shadow-2xl shadow-violet-100 flex flex-col my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4 flex-shrink-0">
          <h2 className="text-2xl font-semibold text-violet-900">Focus Mode Setup</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-violet-500 transition-colors hover:bg-violet-100"
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
          {/* Timer Setting */}
          <div className="rounded-2xl border border-violet-200 bg-white/80 p-4">
            <label className="mb-2 block text-sm font-semibold text-violet-900">
              Timer Duration (minutes)
            </label>
            <input
              type="number"
              min={1}
              max={120}
              value={timerMinutes}
              onChange={(e) => setTimerMinutes(Math.max(1, parseInt(e.target.value) || 25))}
              className="w-full rounded-xl border border-violet-200 bg-white px-4 py-2 text-violet-900 focus:border-violet-400 focus:outline-none"
            />
          </div>

          {/* Task Selection */}
          <div className="rounded-2xl border border-violet-200 bg-white/80 p-4">
            <div className="mb-3 flex items-center justify-between">
              <label className="text-sm font-semibold text-violet-900">
                Select Tasks ({selectedTaskIds.size} selected)
              </label>
              {allTasks.length > 0 && (
                <button
                  onClick={handleSelectAll}
                  className="text-xs font-medium text-violet-600 hover:text-violet-800"
                >
                  {selectedTaskIds.size === allTasks.length ? "Deselect All" : "Select All"}
                </button>
              )}
            </div>

            <div className="max-h-64 space-y-2 overflow-y-auto">
              {allTasks.length === 0 ? (
                <p className="py-8 text-center text-sm text-violet-500">
                  No unticked tasks available. Complete some tasks first!
                </p>
              ) : (
                allTasks.map(({ task, listName }) => (
                  <label
                    key={task.id}
                    className="flex cursor-pointer items-start gap-3 rounded-xl border border-violet-200 bg-white p-3 transition-colors hover:bg-violet-50"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTaskIds.has(task.id)}
                      onChange={() => handleTaskToggle(task.id)}
                      className="mt-1 h-4 w-4 cursor-pointer rounded border-violet-300 text-violet-600 focus:ring-violet-500"
                    />
                    <div className="flex-1">
                      <p className="text-sm text-violet-900">{task.text}</p>
                      <p className="mt-1 text-xs text-violet-500">from {listName}</p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-violet-200 p-6 pt-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="rounded-xl border border-violet-200 bg-white px-4 py-2 text-sm font-semibold text-violet-700 transition-colors hover:bg-violet-50"
            >
              Cancel
            </button>
            <button
              onClick={handleStartFocusMode}
              disabled={selectedTaskIds.size === 0}
              className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Focus Mode
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

