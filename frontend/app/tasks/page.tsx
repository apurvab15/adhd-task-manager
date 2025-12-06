"use client";

import { Suspense } from "react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import TaskListWindow from "@/components/TaskList";
import FocusModeModal from "@/components/FocusModeModal";
import { violetPalette, periwinklePalette, type ColorPalette } from "@/components/TaskListDrawer";

type Mode = "inattentive" | "hyperactive" | "combined";

export default function TasksPage() {
  return (
    <Suspense fallback={null}>
      <TasksPageData />
    </Suspense>
  );
}

export function TasksPageData() {
  const searchParams = useSearchParams();
  const modeParam = searchParams.get("mode");
  const mode: Mode = (modeParam === "inattentive" || modeParam === "hyperactive" || modeParam === "combined") 
    ? modeParam 
    : "hyperactive";
  // For combined mode, default to hyperactive palette (or you could use a different one)
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
    if (mode === "combined") return "/combined";
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
              className="flex items-center justify-center rounded-lg p-2 bg-white border-2 border-zinc-900 text-zinc-900 transition-colors hover:bg-zinc-50"
              title="Task Manager"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" className="h-5 w-5">
                <path d="M152.1 38.2c9.9 8.9 10.7 24 1.8 33.9l-72 80c-4.4 4.9-10.6 7.8-17.2 7.9s-12.9-2.4-17.6-7L7 113C-2.3 103.6-2.3 88.4 7 79s24.6-9.4 33.9 0l22.1 22.1 55.1-61.2c8.9-9.9 24-10.7 33.9-1.8zm0 160c9.9 8.9 10.7 24 1.8 33.9l-72 80c-4.4 4.9-10.6 7.8-17.2 7.9s-12.9-2.4-17.6-7L7 273c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l22.1 22.1 55.1-61.2c8.9-9.9 24-10.7 33.9-1.8zM224 96c0-17.7 14.3-32 32-32H480c17.7 0 32 14.3 32 32s-14.3 32-32 32H256c-17.7 0-32-14.3-32-32zm0 160c0-17.7 14.3-32 32-32H480c17.7 0 32 14.3 32 32s-14.3 32-32 32H256c-17.7 0-32-14.3-32-32zM160 416c0-17.7 14.3-32 32-32H480c17.7 0 32 14.3 32 32s-14.3 32-32 32H192c-17.7 0-32-14.3-32-32zM48 368a48 48 0 1 1 0 96 48 48 0 1 1 0-96z"/>
              </svg>
            </Link>
            <button
              onClick={() => setIsModalOpen(true)}
              className={`flex items-center justify-center rounded-lg p-2 ${colorPalette.accent} text-white transition-colors ${colorPalette.accentHover}`}
              title="Focus Mode"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" className="h-4 w-4">
                <path d="M448 256A192 192 0 1 0 64 256a192 192 0 1 0 384 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zm256 80a80 80 0 1 0 0-160 80 80 0 1 0 0 160zm0-224a144 144 0 1 1 0 288 144 144 0 1 1 0-288zM224 256a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z"/>
              </svg>
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

