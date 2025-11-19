"use client";

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
      <main className="mx-auto flex min-h-screen full-w flex-col gap-10 px-3 py-12">
        <section className="flex items-center justify-between gap-4">
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

        {/* Mode-specific content area */}
        {mode === "hyperactive" ? (
          // Hyperactive mode content
          <div>
            <TaskListWindow mode={mode} />
            {/* TODO: Add hyperactive-specific components or features here */}
          </div>
        ) : (
          // Inattentive mode content
          <div>
            <TaskListWindow mode={mode} />
            {/* TODO: Add inattentive-specific components or features here */}
          </div>
        )}

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

