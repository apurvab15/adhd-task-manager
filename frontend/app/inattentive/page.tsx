"use client";

import FocusTimer from "@/components/FocusTimer";
import TaskListWindow from "@/components/TaskList";
import { skyPalette } from "@/components/TaskListDrawer";

export default function InattentivePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-cyan-100">
      <main className="mx-auto flex min-h-screen w-full flex-col gap-10 px-3 py-12">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-4xl font-semibold text-zinc-900">
            Slow down, anchor gently, keep moving.
          </h1>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <TaskListWindow mode="inattentive" colorPalette={skyPalette} />
          </div>
          <aside className="flex flex-col gap-6 rounded-3xl border border-dashed border-sky-200 bg-white/80 p-6 shadow-lg shadow-sky-100">
            <FocusTimer label="Inattentive Flow Timer" colorPalette={skyPalette} />
            <div className="rounded-2xl border border-sky-100 bg-white/90 p-4 text-sm text-sky-700">
              <p className="font-semibold text-sky-900">Brain Mode Notes</p>
              <p className="mt-2">
                Build a calm queue so wandering focus always knows the next soft
                step to take.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

