"use client";

import FocusTimer from "@/components/FocusTimer";
import TaskListWindow from "@/components/TaskList";
import { useState } from "react";

type Mode = "inattentive" | "hyperactive";

export default function MixPage() {
  const [mode, setMode] = useState<Mode>("hyperactive");

  const handleModeChange = (newMode: Mode) => {
    setMode(newMode);
    // TODO: Add mode-specific logic here
    // Example:
    // if (newMode === "hyperactive") {
    //   // Add hyperactive mode behavior
    // } else {
    //   // Add inattentive mode behavior
    // }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-100 via-white to-fuchsia-100">
      <main className="mx-auto flex min-h-screen w-full flex-col gap-10 px-3 py-12">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-4xl font-semibold text-zinc-900">
            Plan your day your way!
          </h1>
          {/* Mode Toggle */}
          <div className="flex items-center rounded-full border-2 border-violet-200 bg-white p-1 shadow-sm">
            <button
              type="button"
              onClick={() => handleModeChange("hyperactive")}
              className={`px-6 py-2 rounded-full text-sm font-semibold uppercase tracking-wide transition-all ${
                mode === "hyperactive"
                  ? "bg-violet-600 text-white shadow-md"
                  : "text-violet-600 hover:bg-violet-50"
              }`}
            >
              Hyperactive
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("inattentive")}
              className={`px-6 py-2 rounded-full text-sm font-semibold uppercase tracking-wide transition-all ${
                mode === "inattentive"
                  ? "bg-violet-600 text-white shadow-md"
                  : "text-violet-600 hover:bg-violet-50"
              }`}
            >
              Inattentive
            </button>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <TaskListWindow mode={mode} />
          </div>
          <aside className="flex flex-col gap-6 rounded-3xl border border-dashed border-violet-200 bg-white/80 p-6 shadow-lg shadow-violet-100">
            <FocusTimer label="Mix Flow Timer" />
            <div className="rounded-2xl border border-violet-100 bg-white/90 p-4 text-sm text-violet-700">
              <p className="font-semibold text-violet-900">Brain Mode Notes</p>
              <p className="mt-2">
                Use this column for rituals, reflections, or quick grounding prompts while the timer runs.
              </p>
            </div>
          </aside>
        </div>

        {/* <TaskBoard
          label="Mix Task Board"
          description="Blend structure and spontaneity with a single adaptable list."
          accentColor="#7c3aed"
          storageKey="adhd-task-manager-mix"
        /> */}
      </main>
    </div>
  );
}

