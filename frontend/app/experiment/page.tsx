"use client";

import Link from "next/link";

const TYPES = [
  {
    href: "/inattentive",
    title: "Inattentive",
    persona: "Calm Organizer",
    description: "One next step at a time, with a quieter layout. Try it without taking the quiz.",
    className:
      "border-[#7C83BC]/40 bg-gradient-to-br from-white via-[#E6E6FF] to-[#CCCCFF] hover:border-[#665FD1] hover:shadow-[#6667AB]/30",
    accent: "text-[#3F49A4]",
  },
  {
    href: "/hyperactive",
    title: "Hyperactive-impulsive",
    persona: "Energetic Hustler",
    description: "XP, levels, and a higher-energy board. Jump in and see how it feels.",
    className:
      "border-[#FFD1BF] bg-gradient-to-br from-[#FFD1BF] via-[#FEF2EC] to-white hover:border-[#FFAF91] hover:shadow-[#FFD1BF]/50",
    accent: "text-[#004E89]",
  },
  {
    href: "/combined",
    title: "Combined",
    persona: "Dynamic Worker",
    description: "Chaos or Calm on demand. Switch layouts the same way you switch energy.",
    className:
      "border-orange-200 bg-gradient-to-br from-amber-50 to-orange-50 hover:border-orange-400 hover:shadow-orange-200/70",
    accent: "text-orange-900",
  },
] as const;

export default function ExperimentPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-indigo-100">
      <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-6 py-12">
        <div className="mb-10 space-y-4 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 transition-colors hover:text-indigo-800"
          >
            <span aria-hidden>←</span> Home
          </Link>
          <h1 className="text-4xl font-bold text-indigo-900 md:text-5xl">Experiment</h1>
          <p className="mx-auto max-w-xl text-lg text-indigo-700">
            Hop into any type and try the tools. You can switch from the nav at any time.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {TYPES.map((type) => (
            <Link
              key={type.href}
              href={type.href}
              className={`flex min-h-56 flex-col rounded-3xl border-2 p-6 shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl ${type.className}`}
            >
              <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${type.accent}`}>
                {type.persona}
              </p>
              <h2 className="mt-3 text-2xl font-bold text-zinc-900">{type.title}</h2>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-zinc-600">{type.description}</p>
              <span className={`mt-4 text-sm font-semibold ${type.accent}`}>Try this type →</span>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
