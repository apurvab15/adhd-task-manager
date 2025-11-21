"use client";

import { useState } from "react";
import TaskListWindow from "@/components/TaskList";
import FocusModeModal from "@/components/FocusModeModal";
import { violetPalette } from "@/components/TaskListDrawer";

export default function TasksPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="flex items-start justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-semibold text-zinc-900 sm:text-5xl">
              Task Manager
            </h1>
            <p className="text-lg text-zinc-600">
              Organize your tasks across multiple lists. Create, edit, and manage your to-dos with ease.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="rounded-xl bg-violet-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-colors hover:bg-violet-500"
          >
            Focus Mode
          </button>
        </section>

        <div className="flex-1">
          <TaskListWindow 
            mode="hyperactive" 
            colorPalette={violetPalette}
          />
        </div>

        <FocusModeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </main>
    </div>
  );
}

