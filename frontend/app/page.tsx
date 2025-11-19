import Link from "next/link";

const focusModes = [
  {
    label: "Hyperactive",
    summary: "Channel bursts of energy into quick capture sprints.",
    href: "/hyperactive",
    accent: "from-orange-500/20 via-orange-400/10 to-orange-300/10",
    button: "text-orange-700 border-orange-200 hover:border-orange-400",
  },
  {
    label: "Inattentive",
    summary: "Keep gentle structure when attention drifts away.",
    href: "/inattentive",
    accent: "from-sky-500/20 via-sky-400/10 to-sky-300/10",
    button: "text-sky-700 border-sky-200 hover:border-sky-400",
  },
  {
    label: "Mix",
    summary: "Blend both rhythms with flexible guardrails.",
    href: "/mix",
    accent: "from-violet-500/20 via-violet-400/10 to-violet-300/10",
    button: "text-violet-700 border-violet-200 hover:border-violet-400",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-slate-100">
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-16 px-6 py-20 sm:px-10">
        <section className="space-y-6 text-center sm:text-left">
          <p className="text-sm font-semibold uppercase tracking-[0.4em] text-zinc-500">
            ADHD Task Manager
          </p>
          <h1 className="text-4xl font-semibold leading-snug text-zinc-900 sm:text-5xl">
            Pick the mode that matches how your brain feels today.
          </h1>
          <p className="max-w-3xl text-lg text-zinc-600">
            Each flow offers a lightweight task board so you can capture what
            matters right now. No accounts, no friction—just a place to land and
            calm the mental tabs.
          </p>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {focusModes.map((mode) => (
            <Link
              key={mode.label}
              href={mode.href}
              className={`group flex flex-col justify-between rounded-3xl border border-black/5 bg-white/90 p-8 shadow-lg shadow-black/5 transition hover:-translate-y-1 hover:shadow-2xl ${mode.accent}`}
            >
              <div className="space-y-4">
                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-zinc-500">
                  Mode
                </p>
                <h2 className="text-2xl font-semibold text-zinc-900">
                  {mode.label}
                </h2>
                <p className="text-sm text-zinc-600">{mode.summary}</p>
              </div>
              <span
                className={`mt-10 inline-flex items-center justify-center rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition group-hover:bg-white ${mode.button}`}
              >
                Enter Flow →
              </span>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}
