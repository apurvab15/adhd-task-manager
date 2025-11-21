"use client";

import { useEffect, useState } from "react";
import FocusTimer from "@/components/FocusTimer";
import SimpleTaskList from "@/components/SimpleTaskList";
import { orangePalette } from "@/components/TaskListDrawer";

const CARD_BG = "from-orange-50 via-white to-orange-100";
const FOCUS_MODE_STORAGE_KEY = "adhd-focus-mode-tasks";
const FOCUS_MODE_TIMER_KEY = "adhd-focus-mode-timer";

type Task = {
  id: number;
  text: string;
};

export default function FocusModePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timerMinutes, setTimerMinutes] = useState(25);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50 px-4 py-4">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center">
        <div
          className={`w-full max-w-4xl rounded-[2.5rem] border border-black/5 bg-gradient-to-b ${CARD_BG} p-4 shadow-2xl shadow-black/10`}
        >
          <div className="flex flex-col gap-8">
            <div className="flex min-h-[30vh] flex-col items-center justify-center text-center">
              <div className="mt-2 w-full max-w-md">
                <FocusTimer 
                  defaultMinutes={timerMinutes} 
                  colorPalette={orangePalette} 
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

