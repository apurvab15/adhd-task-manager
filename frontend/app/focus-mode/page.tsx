"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import FocusTimer from "@/components/FocusTimer";
import SimpleTaskList from "@/components/SimpleTaskList";
import { orangePalette, skyPalette, periwinklePalette, type ColorPalette } from "@/components/TaskListDrawer";

type Mode = "inattentive" | "hyperactive";

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
  const colorPalette: ColorPalette = mode === "inattentive" ? periwinklePalette : orangePalette;
  
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
    <div className="min-h-screen bg-white">
      {/* Navigation Bar */}
      <nav className="border-b border-[#7085FF]/10 bg-white/90 backdrop-blur-sm">
        <div className="flex items-center justify-between px-8 py-4">
          <Link
            href={mode === "inattentive" ? "/inattentive" : createLink("/home")}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-lg font-medium text-gray-900 transition-colors hover:text-gray-700"
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
            href={mode === "inattentive" ? "/inattentive" : createLink("/home")}
            className="text-2xl font-semibold text-gray-900"
          >
            Focus Mode
          </Link>
        </div>
      </nav>

      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-8 p-8">
        <div className="w-full max-w-4xl">
          <div className="flex flex-col gap-8">
            <div className="flex min-h-[30vh] flex-col items-center justify-center text-center">
              <div className="w-full max-w-md">
                <FocusTimer 
                  defaultMinutes={timerMinutes} 
                  colorPalette={colorPalette} 
                  showPause={true} 
                />
              </div>
            </div>

            <div className="rounded-3xl border-2 border-[#7085FF]/20 bg-white p-12">
              {tasks.length > 0 ? (
                <SimpleTaskList tasks={tasks} showDelete={false} colorPalette={colorPalette} />
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

