"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useGamification } from "@/hooks/useGamification";
import { getProgressPercentage, awardXPForTask } from "@/utils/gamification";
import FocusModeModal from "@/components/FocusModeModal";
import AddTasksModal from "@/components/AddTasksModal";
import { violetPalette, skyPalette, orangePalette, type ColorPalette } from "@/components/TaskListDrawer";

type Mode = "inattentive" | "hyperactive";

const STORAGE_KEY = "adhd-task-lists";
const TODAY_TASKS_KEY = "adhd-today-tasks";

const MOTIVATION_MESSAGES = [
  "You're doing great! Keep it up! 💪",
  "Every task completed is a step forward! 🚀",
  "Progress, not perfection! ✨",
  "You've got this! One task at a time! 🌟",
  "Small steps lead to big achievements! 🎯",
  "Your effort today matters! 💫",
  "Keep going, you're making progress! 🌈",
  "Every completed task is a win! 🏆",
  "You're building momentum! Keep pushing! ⚡",
  "Focus on progress, not perfection! 🌸",
  "You're stronger than you think! 💎",
  "One task down, you're on a roll! 🎉",
  "Your consistency is paying off! 🌟",
  "Every small step counts! 🦋",
  "You're creating positive change! ✨",
  "Keep moving forward! 🚶‍♂️",
  "You're doing better than you think! 💪",
  "Progress is progress, no matter how small! 🌱",
  "You're building great habits! 🌈",
  "Stay focused, you've got this! 🎯",
];

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

export default function HomePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const modeParam = searchParams.get("mode");
  const mode: Mode = (modeParam === "inattentive" || modeParam === "hyperactive") ? modeParam : "hyperactive";
  
  const { stats } = useGamification();
  const progressPercentage = getProgressPercentage(stats);
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
  const [isAddTasksModalOpen, setIsAddTasksModalOpen] = useState(false);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [motivationMessage, setMotivationMessage] = useState("");
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const nextTaskId = useRef(1);

  // Get color palette based on mode
  const colorPalette: ColorPalette = mode === "inattentive" ? skyPalette : violetPalette;
  
  // Helper function to create links with mode parameter
  const createLink = (path: string) => {
    return `${path}?mode=${mode}`;
  };

  const getRandomMessage = () => {
    const randomIndex = Math.floor(Math.random() * MOTIVATION_MESSAGES.length);
    return MOTIVATION_MESSAGES[randomIndex];
  };

  // Set random motivation message on mount and when tasks are completed
  useEffect(() => {
    setMotivationMessage(getRandomMessage());

    // Update message when tasks are completed
    const handleTaskCompleted = () => {
      setMotivationMessage(getRandomMessage());
    };

    window.addEventListener("taskCompleted", handleTaskCompleted);
    return () => {
      window.removeEventListener("taskCompleted", handleTaskCompleted);
    };
  }, []);

  const handleNewMessage = () => {
    setMotivationMessage(getRandomMessage());
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
    // Also listen for storage changes
    window.addEventListener("storage", handleTaskUpdate);

    return () => {
      window.removeEventListener("taskCompleted", handleTaskUpdate);
      window.removeEventListener("storage", handleTaskUpdate);
    };
  }, []);

  // Save today's tasks to localStorage
  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") return;

    const today = new Date().toDateString();
    window.localStorage.setItem(
      TODAY_TASKS_KEY,
      JSON.stringify({ date: today, tasks: todayTasks })
    );
  }, [todayTasks, isHydrated]);

  const handleTaskToggle = (taskId: number) => {
    setTodayTasks((tasks) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return tasks;
      
      const newDone = !task.done;
      // Award XP only when marking as done (not when unchecking) and only once
      if (newDone && !task.done && typeof window !== "undefined") {
        awardXPForTask();
        window.dispatchEvent(new CustomEvent("taskCompleted"));
      }
      
      return tasks.map((t) => (t.id === taskId ? { ...t, done: newDone } : t));
    });
  };

  const handleRemoveTask = (taskId: number) => {
    setTodayTasks((tasks) => tasks.filter((task) => task.id !== taskId));
  };

  const handleAddTasks = (tasks: Array<{ id: number; text: string; done: boolean; sourceListId?: number; sourceListName?: string }>) => {
    setTodayTasks((prev) => [...prev, ...tasks]);
  };

  const addTask = (text: string) => {
    const t = text.trim();
    if (!t) return;
    const newTask: Task = { id: nextTaskId.current++, text: t, done: false };
    setTodayTasks((prev) => [...prev, newTask]);
    setInput("");
    inputRef.current?.focus();
  };

  const breakTaskAtCaret = () => {
    const el = inputRef.current;
    if (!el) return;
    const value = el.value;
    const pos = el.selectionStart ?? value.length;
    if (!value.trim()) return;
    const left = value.slice(0, pos).trim();
    const right = value.slice(pos).trim();
    const newTasks: Task[] = [];
    if (left) newTasks.push({ id: nextTaskId.current++, text: left, done: false });
    if (right) newTasks.push({ id: nextTaskId.current++, text: right, done: false });
    if (newTasks.length > 0) {
      setTodayTasks((prev) => [...prev, ...newTasks]);
    }
    setInput("");
    el.focus();
  };

  const existingTaskIds = new Set(todayTasks.map((t) => t.id));

  const completedToday = todayTasks.filter((t) => t.done).length;
  const totalToday = todayTasks.length;

  // Calculate overall task statistics
  const allTasks = taskLists.flatMap((list) => list.tasks);
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t) => t.done).length;
  const overallCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Calculate completion rate per task list
  const listProgress = taskLists.map((list) => {
    const total = list.tasks.length;
    const completed = list.tasks.filter((t) => t.done).length;
    const rate = total > 0 ? (completed / total) * 100 : 0;
    return {
      name: list.name,
      completed,
      total,
      rate,
    };
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-slate-100">
      {/* Navigation Bar */}
      <nav className="border-b border-black/5 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href={createLink("/home")} className="text-xl font-semibold text-zinc-900">
            Home
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href={createLink("/tasks")}
              className="rounded-lg px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
            >
              Task Manager
            </Link>
            <button
              onClick={() => setIsFocusModalOpen(true)}
              className={`rounded-lg ${colorPalette.accent} px-4 py-2 text-sm font-medium text-white transition-colors ${colorPalette.accentHover}`}
            >
              Focus Mode
            </button>
          </div>
        </div>
      </nav>

      {/* 3 Column Layout */}
      <main className="flex h-[calc(100vh-73px)] gap-2 p-2">
        {/* Left Column - Overall Progress & Gamification */}
        <div className={`flex-1 rounded-2xl border ${colorPalette.border} bg-gradient-to-br ${colorPalette.bg} p-6 shadow-lg ${colorPalette.shadow} flex flex-col overflow-y-auto`}>
          <div className="space-y-6">
            {/* Level & XP */}
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-zinc-500">
                Your Progress
              </p>
              <div className="flex items-baseline gap-3">
                <h2 className="text-3xl font-bold text-zinc-900">Level {stats.level}</h2>
                <span className={`text-lg font-semibold ${colorPalette.text}`}>{stats.totalXP} XP</span>
              </div>
              <p className="text-sm text-zinc-600">
                {stats.tasksCompletedToday} task{stats.tasksCompletedToday !== 1 ? "s" : ""} completed today
              </p>
            </div>

            {/* Level Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-zinc-600">
                <span>Progress to Level {stats.level + 1}</span>
                <span>{stats.currentLevelXP}/100 XP</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-200">
                <div
                  className={`h-full rounded-full ${mode === "inattentive" ? "bg-gradient-to-r from-sky-500 to-blue-500" : "bg-gradient-to-r from-violet-500 to-rose-500"} transition-all duration-500`}
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            {/* Overall Task Completion */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-zinc-600">
                <span>Overall Completion</span>
                <span>{completedTasks}/{totalTasks} tasks</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-200">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 to-violet-500 transition-all duration-500"
                  style={{ width: `${overallCompletionRate}%` }}
                />
              </div>
              <p className="text-xs text-zinc-500">{Math.round(overallCompletionRate)}% complete</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className={`rounded-xl border ${colorPalette.borderLight} bg-white/80 p-3`}>
                <p className="text-xs text-zinc-500">Total Tasks</p>
                <p className={`text-2xl font-bold ${colorPalette.textDark}`}>{stats.tasksCompleted}</p>
              </div>
              <div className={`rounded-xl border ${mode === "inattentive" ? "border-blue-200" : "border-rose-200"} bg-white/80 p-3`}>
                <p className="text-xs text-zinc-500">Today</p>
                <p className={`text-2xl font-bold ${mode === "inattentive" ? "text-blue-900" : "text-rose-900"}`}>{stats.tasksCompletedToday}</p>
              </div>
            </div>

            {/* Motivation Message */}
            {motivationMessage && (
              <div className={`rounded-xl border ${colorPalette.borderLight} bg-gradient-to-br ${colorPalette.bg} p-4`}>
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm font-medium ${colorPalette.textDark} flex-1 text-center`}>
                    {motivationMessage}
                  </p>
                  <button
                    onClick={handleNewMessage}
                    className={`flex-shrink-0 rounded-lg p-1.5 ${colorPalette.text} transition-colors ${colorPalette.accentLight.replace('bg-', 'hover:bg-')}`}
                    aria-label="Get new message"
                    title="Get new message"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4"
                    >
                      <path
                        fillRule="evenodd"
                        d="M15.312 11.424a5.5 5.5 0 0 1-9.201 2.466l-.312-.311h2.433a.75.75 0 0 0 0-1.5H3.989a.75.75 0 0 0-.75.75v4.242a.75.75 0 0 0 1.5 0v-2.43l.31.31a7 7 0 0 0 11.712-3.138.75.75 0 0 0-1.449-.39Zm1.23-3.723a.75.75 0 0 0 .219-.53V2.929a.75.75 0 0 0-1.5 0V5.36l-.31-.31A7 7 0 0 0 3.239 8.188a.75.75 0 1 0 1.448.389A5.5 5.5 0 0 1 13.89 6.11l.311.31h-2.432a.75.75 0 0 0 0 1.5h4.243a.75.75 0 0 0 .53-.219Z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Middle Column - Task List Progress */}
        <div className="flex-1 rounded-2xl border border-black/5 bg-white/90 p-6 shadow-lg shadow-black/5 flex flex-col overflow-y-auto">
          <div className="mb-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-zinc-900">Task List Progress</h2>
              <Link
                href={createLink("/tasks")}
                className={`rounded-lg p-1.5 ${colorPalette.text} transition-colors ${colorPalette.accentLight.replace('bg-', 'hover:bg-')}`}
                title="Go to Task Manager"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z"
                    clipRule="evenodd"
                  />
                  <path
                    fillRule="evenodd"
                    d="M19 10a.75.75 0 0 0-.75-.75H8.704l1.048-.943a.75.75 0 1 0-1.004-1.114l-2.5 2.25a.75.75 0 0 0 0 1.114l2.5 2.25a.75.75 0 1 0 1.004-1.114l-1.048-.943h9.546A.75.75 0 0 0 19 10Z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
            </div>
            <p className="mt-1 text-xs text-zinc-600">
              Completion rate by list
            </p>
          </div>

          <div className="space-y-4 flex-1">
            {listProgress.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center">
                <p className="text-sm text-zinc-500">
                  No task lists yet. Create one in Task Manager!
                </p>
              </div>
            ) : (
              listProgress.map((list, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-zinc-900 truncate">{list.name}</p>
                    <span className="text-xs text-zinc-600 ml-2">
                      {list.completed}/{list.total}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange-400 to-rose-500 transition-all duration-500"
                      style={{ width: `${list.rate}%` }}
                    />
                  </div>
                  <p className="text-xs text-zinc-500">{Math.round(list.rate)}% complete</p>
                </div>
              ))
            )}
          </div>

          {/* Today's Progress Summary */}
          <div className={`mt-6 rounded-xl border ${colorPalette.borderLight} ${colorPalette.accentLight}/50 p-4`}>
            <p className={`text-xs font-semibold ${colorPalette.textDark} mb-2`}>Today&apos;s Progress</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-zinc-600">
                <span>Today&apos;s Tasks</span>
                <span>{completedToday}/{totalToday}</span>
              </div>
              <div className={`h-2 w-full overflow-hidden rounded-full ${colorPalette.borderLight.replace('border-', 'bg-')}`}>
                <div
                  className={`h-full rounded-full ${mode === "inattentive" ? "bg-gradient-to-r from-sky-500 to-blue-500" : "bg-gradient-to-r from-violet-500 to-rose-500"} transition-all duration-500`}
                  style={{ width: `${totalToday > 0 ? (completedToday / totalToday) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Today's Task List */}
        <div className="flex-1 rounded-2xl border border-black/5 bg-white/90 p-6 shadow-lg shadow-black/5 flex flex-col">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold text-zinc-900">Today&apos;s Tasks</h2>
              <button
                onClick={() => setIsAddTasksModalOpen(true)}
                className={`rounded-lg p-1.5 ${colorPalette.text} transition-colors ${colorPalette.accentLight.replace('bg-', 'hover:bg-')}`}
                title="Add tasks from task lists"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z" />
                  <path d="M19 10a.75.75 0 0 0-.75-.75H8.704l1.048-.943a.75.75 0 1 0-1.004-1.114l-2.5 2.25a.75.75 0 0 0 0 1.114l2.5 2.25a.75.75 0 1 0 1.004-1.114l-1.048-.943h9.546A.75.75 0 0 0 19 10Z" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-zinc-600">
              {completedToday} of {totalToday} completed
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {todayTasks.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-8 text-center">
                <p className="text-sm text-zinc-500">
                  No tasks for today. Add tasks from your task lists to get started!
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {todayTasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 transition-colors hover:bg-zinc-50"
                  >
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => handleTaskToggle(task.id)}
                      className={`h-4 w-4 cursor-pointer rounded border-zinc-300 ${colorPalette.text} focus:ring-${mode === "inattentive" ? "sky" : "violet"}-500`}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm truncate ${
                          task.done ? "line-through text-zinc-400" : "text-zinc-900"
                        }`}
                      >
                        {task.text}
                      </p>
                      {task.sourceListName && (
                        <p className="mt-1 text-xs text-zinc-500">from {task.sourceListName}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveTask(task.id)}
                      className="flex-shrink-0 rounded p-1 text-zinc-400 transition-colors hover:text-red-500"
                      aria-label="Remove task"
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
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Input area with Add and Break Task buttons */}
          <div className={`mt-4 border-t border-zinc-200 pt-4 flex items-start gap-3 rounded-2xl border ${colorPalette.border} bg-white/80 p-3`}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={2}
              placeholder="Type a task... (Enter = add, Shift+Enter = break)"
              className={`flex-1 resize-none rounded-2xl border ${colorPalette.border} bg-white/80 p-3 text-sm ${colorPalette.text} ${colorPalette.borderLight.replace('border-', 'focus:border-')} focus:outline-none`}
            />

            <div className="flex flex-col gap-3 px-1">
              <button
                onClick={() => addTask(input)}
                className={`rounded-2xl ${colorPalette.accent} px-4 py-2 text-sm font-semibold text-white shadow-sm transition ${colorPalette.accentHover} focus:outline-none`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                  <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                </svg>
              </button>

              <button
                onClick={breakTaskAtCaret}
                className={`rounded-2xl border ${colorPalette.borderLight} px-4 py-2 text-sm font-semibold ${colorPalette.text} transition ${colorPalette.accentLight.replace('bg-', 'hover:bg-')}`}
                title="Split the current input at the cursor into two tasks"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                  <path d="M15.98 1.804a1 1 0 0 0-1.96 0l-.24 1.192a1 1 0 0 1-.784.785l-1.192.238a1 1 0 0 0 0 1.962l1.192.238a1 1 0 0 1 .785.785l.238 1.192a1 1 0 0 0 1.962 0l.238-1.192a1 1 0 0 1 .785-.785l1.192-.238a1 1 0 0 0 0-1.962l-1.192-.238a1 1 0 0 1-.785-.785l-.238-1.192ZM6.949 5.684a1 1 0 0 0-1.898 0l-.683 2.051a1 1 0 0 1-.633.633l-2.051.683a1 1 0 0 0 0 1.898l2.051.684a1 1 0 0 1 .633.632l.683 2.051a1 1 0 0 0 1.898 0l.683-2.051a1 1 0 0 1 .633-.633l2.051-.683a1 1 0 0 0 0-1.898l-2.051-.683a1 1 0 0 1-.633-.633L6.95 5.684ZM13.949 13.684a1 1 0 0 0-1.898 0l-.184.551a1 1 0 0 1-.632.633l-.551.183a1 1 0 0 0 0 1.898l.551.183a1 1 0 0 1 .633.633l.183.551a1 1 0 0 0 1.898 0l.184-.551a1 1 0 0 1 .632-.633l.551-.183a1 1 0 0 0 0-1.898l-.551-.184a1 1 0 0 1-.633-.632l-.183-.551Z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </main>

      <FocusModeModal isOpen={isFocusModalOpen} onClose={() => setIsFocusModalOpen(false)} mode={mode} />
      <AddTasksModal
        isOpen={isAddTasksModalOpen}
        onClose={() => setIsAddTasksModalOpen(false)}
        onAddTasks={handleAddTasks}
        existingTaskIds={existingTaskIds}
        mode={mode}
      />
    </div>
  );
}

