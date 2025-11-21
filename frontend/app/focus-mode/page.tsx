"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import FocusTimer from "@/components/FocusTimer";
import SimpleTaskList from "@/components/SimpleTaskList";
import { orangePalette, skyPalette, type ColorPalette } from "@/components/TaskListDrawer";

type Mode = "inattentive" | "hyperactive";

const getCardBg = (mode: Mode) => {
  return mode === "inattentive" ? "from-sky-50 via-white to-sky-100" : "from-orange-50 via-white to-orange-100";
};
const FOCUS_MODE_STORAGE_KEY = "adhd-focus-mode-tasks";
const FOCUS_MODE_TIMER_KEY = "adhd-focus-mode-timer";

type Task = {
  id: number;
  text: string;
};

export default function FocusModePage() {
  const searchParams = useSearchParams();
  const modeParam = searchParams.get("mode");
  const mode: Mode = (modeParam === "inattentive" || modeParam === "hyperactive") ? modeParam : "hyperactive";
  const colorPalette: ColorPalette = mode === "inattentive" ? skyPalette : orangePalette;
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timerMinutes, setTimerMinutes] = useState(25);

  // Helper function to create links with mode parameter
  const createLink = (path: string) => {
    return `${path}?mode=${mode}`;
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      // Load selected tasks
      const savedTasks = window.localStorage.getItem(FOCUS_MODE_STORAGE_KEY);
      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks) as Task[];
        setTasks(parsedTasks);
      }

      // Load timer duration
      const savedTimer = window.localStorage.getItem(FOCUS_MODE_TIMER_KEY);
      if (savedTimer) {
        const parsedTimer = parseInt(savedTimer, 10);
        if (!isNaN(parsedTimer) && parsedTimer > 0) {
          setTimerMinutes(parsedTimer);
        }
      }
    } catch (error) {
      console.error("Error loading focus mode data:", error);
    }
  }, []);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-white ${mode === "inattentive" ? "to-sky-50" : "to-violet-50"}`}>
      {/* Navigation Bar */}
      <nav className="border-b border-black/5 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <Link
            href={createLink("/home")}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4"
            >
              <path
                fillRule="evenodd"
                d="M17 10a.75.75 0 0 1-.75.75H5.612l4.158 3.96a.75.75 0 1 1-1.04 1.08l-5.5-5.25a.75.75 0 0 1 0-1.08l5.5-5.25a.75.75 0 1 1 1.04 1.08l-4.158 3.96H16.25A.75.75 0 0 1 17 10Z"
                clipRule="evenodd"
              />
            </svg>
            Back to Home
          </Link>
          <Link
            href={createLink("/home")}
            className="text-xl font-semibold text-zinc-900"
          >
            Focus Mode
          </Link>
        </div>
      </nav>

      <div className="mx-auto flex w-full max-w-5xl flex-col items-center px-4 py-4">
        <div
          className={`w-full max-w-4xl rounded-[2.5rem] border border-black/5 bg-gradient-to-b ${getCardBg(mode)} p-4 shadow-2xl shadow-black/10`}
        >
          <div className="flex flex-col gap-8">
            <div className="flex min-h-[30vh] flex-col items-center justify-center text-center">
              <div className="mt-2 w-full max-w-md">
                <FocusTimer 
                  defaultMinutes={timerMinutes} 
                  colorPalette={colorPalette} 
                  showPause={true} 
                />
              </div>
            </div>

            <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-lg">
              {tasks.length > 0 ? (
                <SimpleTaskList tasks={tasks} showDelete={false} />
              ) : (
                <p className="text-center text-sm text-gray-500">
                  No tasks selected. Go to Task Manager to set up your focus session.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

