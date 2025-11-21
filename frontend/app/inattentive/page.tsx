"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { awardXPForTask } from "@/utils/gamification";
import FocusModeModal from "@/components/FocusModeModal";
import AddTasksModal from "@/components/AddTasksModal";
import { periwinklePalette, type ColorPalette } from "@/components/TaskListDrawer";
import JSConfetti from "js-confetti";

const STORAGE_KEY = "adhd-task-lists";
const TODAY_TASKS_KEY = "adhd-today-tasks";

type Task = {
  id: number;
  text: string;
  done: boolean;
  sourceListId?: number;
  sourceListName?: string;
};

type TaskList = {
  id: number;
  name: string;
  tasks: { id: number; text: string; done: boolean }[];
};

export default function InattentivePage() {
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
  const [isAddTasksModalOpen, setIsAddTasksModalOpen] = useState(false);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const nextTaskId = useRef(1);
  const nextListId = useRef(1);
  const confettiRef = useRef<JSConfetti | null>(null);
  const hasTriggeredConfettiRef = useRef(false);
  const TODAYS_LIST_NAME = "Today's Tasks";

  // Use periwinkle palette for inattentive type
  const colorPalette: ColorPalette = periwinklePalette;

  // Initialize confetti
  useEffect(() => {
    if (typeof window !== "undefined") {
      confettiRef.current = new JSConfetti();
    }
  }, []);

  // Helper function to get or create "Today's Tasks" list
  const getOrCreateTodaysList = (lists: TaskList[]): TaskList => {
    let todaysList = lists.find((list) => list.name === TODAYS_LIST_NAME);
    if (!todaysList) {
      todaysList = {
        id: nextListId.current++,
        name: TODAYS_LIST_NAME,
        tasks: [],
      };
      lists.push(todaysList);
    }
    return todaysList;
  };

  // Sync today's tasks to the task list
  const syncTasksToTaskList = (tasks: Task[]) => {
    if (typeof window === "undefined" || !isHydrated) return;

    try {
      const savedLists = window.localStorage.getItem(STORAGE_KEY);
      const taskLists: TaskList[] = savedLists ? JSON.parse(savedLists) : [];
      
      const todaysList = getOrCreateTodaysList(taskLists);
      
      // Convert today's tasks to task list format and sync
      todaysList.tasks = tasks.map((task) => ({
        id: task.id,
        text: task.text,
        done: task.done,
      }));

      // Update task lists in localStorage
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(taskLists));
      setTaskLists(taskLists);
    } catch (error) {
      console.error("Error syncing tasks to task list:", error);
    }
  };

  // Load today's tasks and task lists from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      // Load today's tasks
      const saved = window.localStorage.getItem(TODAY_TASKS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Check if it's from today
        const today = new Date().toDateString();
        if (parsed.date === today) {
          const tasks = parsed.tasks || [];
          setTodayTasks(tasks);
          // Initialize nextTaskId from existing tasks
          if (tasks.length > 0) {
            const maxId = Math.max(...tasks.map((t: Task) => t.id));
            nextTaskId.current = maxId + 1;
          }
        } else {
          // Reset for new day
          setTodayTasks([]);
          window.localStorage.setItem(
            TODAY_TASKS_KEY,
            JSON.stringify({ date: today, tasks: [] })
          );
        }
      }

      // Load task lists
      const savedLists = window.localStorage.getItem(STORAGE_KEY);
      if (savedLists) {
        const parsed = JSON.parse(savedLists);
        setTaskLists(parsed || []);
        
        // Initialize nextListId and nextTaskId from existing lists
        if (parsed && parsed.length > 0) {
          const maxListId = Math.max(...parsed.map((list: TaskList) => list.id));
          nextListId.current = maxListId + 1;
          const allTasks = parsed.flatMap((list: TaskList) => list.tasks);
          if (allTasks.length > 0) {
            const maxTaskId = Math.max(...allTasks.map((t: { id: number }) => t.id));
            nextTaskId.current = Math.max(nextTaskId.current, maxTaskId + 1);
          }
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }

    setIsHydrated(true);
  }, []);

  // Listen for task completion events to refresh task lists
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleTaskUpdate = () => {
      try {
        const savedLists = window.localStorage.getItem(STORAGE_KEY);
        if (savedLists) {
          const parsed = JSON.parse(savedLists);
          setTaskLists(parsed || []);
        }
      } catch (error) {
        console.error("Error refreshing task lists:", error);
      }
    };

    window.addEventListener("taskCompleted", handleTaskUpdate);
    window.addEventListener("storage", handleTaskUpdate);

    return () => {
      window.removeEventListener("taskCompleted", handleTaskUpdate);
      window.removeEventListener("storage", handleTaskUpdate);
    };
  }, []);

  // Save today's tasks to localStorage and sync to task list
  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") return;

    const today = new Date().toDateString();
    window.localStorage.setItem(
      TODAY_TASKS_KEY,
      JSON.stringify({ date: today, tasks: todayTasks })
    );
    
    // Sync tasks to task list
    try {
      const savedLists = window.localStorage.getItem(STORAGE_KEY);
      const taskLists: TaskList[] = savedLists ? JSON.parse(savedLists) : [];
      
      const todaysList = getOrCreateTodaysList(taskLists);
      
      // Convert today's tasks to task list format and sync
      todaysList.tasks = todayTasks.map((task) => ({
        id: task.id,
        text: task.text,
        done: task.done,
      }));

      // Update task lists in localStorage
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(taskLists));
      setTaskLists(taskLists);
    } catch (error) {
      console.error("Error syncing tasks to task list:", error);
    }
  }, [todayTasks, isHydrated]);

  const handleTaskToggle = (taskId: number) => {
    setTodayTasks((tasks) => {
      const updated = tasks.map((task) => {
        if (task.id === taskId) {
          const newDone = !task.done;
          // Award XP when marking as done (not when unchecking)
          if (newDone && !task.done && typeof window !== "undefined") {
            awardXPForTask();
            window.dispatchEvent(new CustomEvent("taskCompleted"));
          }
          return { ...task, done: newDone };
        }
        return task;
      });
      return updated;
    });
  };

  const handleRemoveTask = (taskId: number) => {
    setTodayTasks((tasks) => tasks.filter((task) => task.id !== taskId));
  };

  const handleAddTasks = (tasks: Array<{ id: number; text: string; done: boolean; sourceListId?: number; sourceListName?: string }>) => {
    // Add new tasks to the beginning so they appear in "Next Step" first
    setTodayTasks((prev) => [...tasks, ...prev]);
  };

  const addTask = (text: string) => {
    const t = text.trim();
    if (!t) return;
    const newTask: Task = { id: nextTaskId.current++, text: t, done: false };
    setTodayTasks((prev) => [...prev, newTask]);
    setInput("");
    inputRef.current?.focus();
  };


  const existingTaskIds = new Set(todayTasks.map((t) => t.id));

  const completedToday = todayTasks.filter((t) => t.done).length;
  const totalToday = todayTasks.length;
  const allTasksCompleted = totalToday > 0 && completedToday === totalToday;

  // Get the next incomplete task (first task that's not done)
  const nextTask = todayTasks.find((t) => !t.done);

  // Trigger confetti when all tasks are completed
  useEffect(() => {
    if (allTasksCompleted && confettiRef.current && !hasTriggeredConfettiRef.current) {
      hasTriggeredConfettiRef.current = true;
      confettiRef.current.addConfetti({
        emojis: ["🎉", "✨", "🌟", "💫", "🎊"],
        emojiSize: 100,
        confettiNumber: 50,
      });
    } else if (!allTasksCompleted) {
      // Reset the flag when tasks become incomplete again
      hasTriggeredConfettiRef.current = false;
    }
  }, [allTasksCompleted]);

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Navigation */}
      <nav className="border-b border-[#7085FF]/10 bg-white/90 backdrop-blur-sm">
        <div className="flex items-center justify-between px-8 py-4">
          <Link href="/inattentive" className="text-[#7085FF] transition-colors hover:text-[#5A75FF]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-6 w-6"
            >
              <path
                fillRule="evenodd"
                d="M9.293 2.293a1 1 0 0 1 1.414 0l7 7A1 1 0 0 1 17 11h-1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6H3a1 1 0 0 1-.707-1.707l7-7Z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/tasks"
              className="text-lg font-medium text-gray-900 transition-colors hover:text-gray-700"
            >
              Tasks
            </Link>
            <button
              onClick={() => setIsFocusModalOpen(true)}
              className={`rounded-lg ${colorPalette.accent} px-6 py-2 text-lg font-medium text-white transition-colors ${colorPalette.accentHover}`}
            >
              Focus
            </button>
          </div>
        </div>
      </nav>

      {/* 2 Column Layout - Simplified for Inattentive Type */}
      <main className="flex h-[calc(100vh-81px)] gap-8 p-8">
        {/* Left Column - Next Step */}
        <div className="flex-1 rounded-3xl border-2 border-[#7085FF]/20 bg-white p-12 flex flex-col justify-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-8">Next Step</h2>
          
          {nextTask ? (
            <div className="space-y-6">
              <div className="flex items-start gap-6">
                <input
                  type="checkbox"
                  checked={nextTask.done}
                  onChange={() => handleTaskToggle(nextTask.id)}
                  className="h-8 w-8 cursor-pointer rounded border-2 border-[#7085FF]/60 bg-white text-[#7085FF] focus:ring-2 focus:ring-[#7085FF]/30 focus:border-[#7085FF] checked:bg-[#7085FF] checked:border-[#7085FF] mt-1 transition-colors"
                />
                <p className="text-3xl font-medium text-gray-900 leading-relaxed flex-1">
                  {nextTask.text}
                </p>
              </div>
              {nextTask.sourceListName && (
                <p className="text-xl text-gray-700 ml-14">from {nextTask.sourceListName}</p>
              )}
              
              {/* Action buttons */}
              <div className="flex flex-col gap-4 mt-8">
                <button
                  onClick={() => setIsFocusModalOpen(true)}
                  className={`text-xl font-semibold ${colorPalette.accent} px-6 py-3 text-white rounded-xl transition-colors ${colorPalette.accentHover}`}
                >
                  Focus Mode
                </button>
                <button
                  onClick={() => setIsAddTasksModalOpen(true)}
                  className={`text-xl font-semibold border-2 border-[#7085FF] text-[#7085FF] px-6 py-3 rounded-xl transition-colors hover:bg-[#7085FF]/10`}
                >
                  Add More Tasks
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-3xl font-medium text-gray-400 leading-relaxed">
                {todayTasks.length === 0 
                  ? "Lets get started!" 
                  : "All tasks completed! 🎉"}
              </p>
              <div className="flex flex-col gap-4 mt-6">
                <button
                  onClick={() => setIsFocusModalOpen(true)}
                  className={`text-xl font-semibold ${colorPalette.accent} px-6 py-3 text-white rounded-xl transition-colors ${colorPalette.accentHover}`}
                >
                  Focus Mode
                </button>
                <button
                  onClick={() => setIsAddTasksModalOpen(true)}
                  className={`text-xl font-semibold border-2 border-[#7085FF] text-[#7085FF] px-6 py-3 rounded-xl transition-colors hover:bg-[#7085FF]/10`}
                >
                  Add Tasks
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Today's List */}
        <div className="flex-1 rounded-3xl border-2 border-[#7085FF]/20 bg-white p-12 flex flex-col">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-4xl font-bold text-gray-900">Today&apos;s List</h2>
            </div>
            <p className="text-2xl text-gray-700">
              {completedToday} of {totalToday} completed
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {todayTasks.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-xl border-2 border-dashed border-[#7085FF]/20 bg-[#7085FF]/5 p-12 text-center">
                <p className="text-2xl text-gray-700">
                 Let's add some tasks!
                </p>
              </div>
            ) : (
              <ul className="space-y-4">
                {todayTasks.map((task) => (
                  <li
                    key={task.id}
                    className={`flex items-start gap-6 rounded-2xl border-2 ${
                      task.done 
                        ? "border-[#7085FF]/10 bg-[#7085FF]/5" 
                        : "border-[#7085FF]/20 bg-white"
                    } p-6 transition-colors`}
                  >
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => handleTaskToggle(task.id)}
                      className="h-8 w-8 cursor-pointer rounded border-2 border-[#7085FF]/60 bg-white text-[#7085FF] focus:ring-2 focus:ring-[#7085FF]/30 focus:border-[#7085FF] checked:bg-[#7085FF] checked:border-[#7085FF] mt-1 transition-colors"
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-2xl leading-relaxed ${
                          task.done ? "line-through text-gray-400" : "text-gray-900"
                        }`}
                      >
                        {task.text}
                      </p>
                      {task.sourceListName && (
                        <p className="mt-2 text-xl text-gray-700">from {task.sourceListName}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveTask(task.id)}
                      className="flex-shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:text-red-500"
                      aria-label="Remove task"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-6 w-6"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Input area - Small and Simple */}
          <div className="mt-6 border-t border-[#7085FF]/10 pt-4 flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTask(input);
                }
              }}
              placeholder="Add task..."
              className="flex-1 rounded-lg border border-[#7085FF]/20 bg-white px-3 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:border-[#7085FF] focus:outline-none"
            />
            <button
              onClick={() => addTask(input)}
              className={`rounded-lg ${colorPalette.accent} px-4 py-2 text-base font-medium text-white transition ${colorPalette.accentHover}`}
            >
              Add
            </button>
          </div>
        </div>
      </main>

      <FocusModeModal isOpen={isFocusModalOpen} onClose={() => setIsFocusModalOpen(false)} mode="inattentive" />
      <AddTasksModal
        isOpen={isAddTasksModalOpen}
        onClose={() => setIsAddTasksModalOpen(false)}
        onAddTasks={handleAddTasks}
        existingTaskIds={existingTaskIds}
        mode="inattentive"
        key={isAddTasksModalOpen ? "open" : "closed"}
      />
    </div>
  );
}
