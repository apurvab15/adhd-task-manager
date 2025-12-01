"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import TaskListWindow from "@/components/TaskList";
import FocusModeModal from "@/components/FocusModeModal";
import { violetPalette, periwinklePalette, type ColorPalette } from "@/components/TaskListDrawer";

type Mode = "inattentive" | "hyperactive";

export default function TasksPage() {
  const searchParams = useSearchParams();
  const modeParam = searchParams.get("mode");
  const mode: Mode = (modeParam === "inattentive" || modeParam === "hyperactive") ? modeParam : "hyperactive";
  const colorPalette: ColorPalette = mode === "inattentive" ? periwinklePalette : violetPalette;
  
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Helper function to create links with mode parameter
  const createLink = (path: string) => {
    return `${path}?mode=${mode}`;
  };

  // Get home URL based on mode
  const getHomeUrl = () => {
    if (mode === "inattentive") return "/inattentive";
    if (mode === "hyperactive") return "/hyperactive";
    return createLink("/home");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Navigation Bar */}
      <nav className="border-b border-black/5 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <Link
            href={getHomeUrl()}
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
          <div className="flex items-center gap-4">
            <Link
              href={getHomeUrl()}
              className="text-xl font-semibold text-zinc-900"
            >
              Task Manager
            </Link>
            <button
              onClick={() => setIsModalOpen(true)}
              className={`rounded-lg ${colorPalette.accent} px-4 py-2 text-sm font-medium text-white transition-colors ${colorPalette.accentHover}`}
            >
              Focus Mode
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto flex min-h-[calc(100vh-73px)] w-full max-w-7xl flex-col gap-8 px-4 py-2 sm:px-6 lg:px-8">
        <section className="flex items-start justify-between">
          <div className="space-y-2">
            <h3 className="text-2xl font-semibold text-zinc-900 sm:text-3xl">
              Task Manager
            </h3>
            <p className="text-lg text-zinc-600">
              Organize your tasks across multiple lists. Create, edit, and manage your to-dos with ease.
            </p>
          </div>
        </section>

        <div className="flex-1">
          <TaskListWindow 
            mode={mode} 
            colorPalette={colorPalette}
          />
        </div>

        <FocusModeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} mode={mode} />
      </main>
    </div>
  );
}

