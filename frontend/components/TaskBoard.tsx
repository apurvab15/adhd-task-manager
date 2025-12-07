"use client";

import { FormEvent, useEffect, useState } from "react";

type Task = {
  id: number;
  text: string;
};

type TaskBoardProps = {
  label: string;
  description: string;
  accentColor: string;
  storageKey: string;
};

export default function TaskBoard({
  label,
  description,
  accentColor,
  storageKey,
}: TaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    const savedTasks = window.localStorage.getItem(storageKey);

    if (!savedTasks) {
      return [];
    }

    try {
      return JSON.parse(savedTasks) as Task[];
    } catch {
      window.localStorage.removeItem(storageKey);
      return [];
    }
  });
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(tasks));
  }, [storageKey, tasks]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = draft.trim();

    if (!text) {
      return;
    }

    setTasks((previous) => [{ id: Date.now(), text }, ...previous]);
    setDraft("");
  };

  return (
    <section className="flex flex-col gap-6 rounded-3xl border border-black/5 bg-white/90 p-10 shadow-xl shadow-black/5 backdrop-blur">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-500">
          Focus Type
        </p>
        <h1 className="text-3xl font-semibold text-zinc-900">{label}</h1>
        <p className="text-base text-zinc-500">{description}</p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add a task you want to tackle..."
          className="flex-1 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-800 shadow focus:border-zinc-400 focus:outline-none"
        />
        <button
          type="submit"
          style={{ backgroundColor: accentColor }}
          className="rounded-2xl px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:brightness-110 flex items-center justify-center"
          title="Add Task"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
          </svg>
        </button>
      </form>

      <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">
          Task List
        </p>
        {tasks.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">
            Nothing here yet. Capture the first thing on your mind.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm"
              >
                {task.text}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

