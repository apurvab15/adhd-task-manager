"use client";

import FocusTimer from "@/components/FocusTimer";
import TaskListWindow from "@/components/TaskList";
import { orangePalette } from "@/components/TaskListDrawer";

export default function HyperactivePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-100">
      <main className="mx-auto flex min-h-screen w-full flex-col gap-10 px-3 py-12">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-4xl font-semibold text-zinc-900">
            Capture the sparks before they fade.
          </h1>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <TaskListWindow mode="hyperactive" colorPalette={orangePalette} />
          </div>
          <aside className="flex flex-col gap-6 rounded-3xl border border-dashed border-orange-200 bg-white/80 p-6 shadow-lg shadow-orange-100">
            <FocusTimer label="Hyperactive Flow Timer" colorPalette={orangePalette} />
            <div className="rounded-2xl border border-orange-100 bg-white/90 p-4 text-sm text-orange-700">
              <p className="font-semibold text-orange-900">Brain Mode Notes</p>
              <p className="mt-2">
                Use quick sprints to unload ideas, prioritize, and stay curious
                without losing direction.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

