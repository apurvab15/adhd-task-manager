import TaskBoard from "@/components/TaskBoard";

export default function HyperactivePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-100">
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-10 px-6 py-16">
        <section className="space-y-4 text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-orange-500">
            Hyperactive Flow
          </p>
          <h1 className="text-4xl font-semibold text-zinc-900">
            Capture the sparks before they fade.
          </h1>
          <p className="text-base text-zinc-600">
            Use quick sprints to unload ideas, prioritize, and stay curious
            without losing direction.
          </p>
        </section>

        <TaskBoard
          label="Hyperactive Task Board"
          description="Rapid entry with immediate feedback to harness bursts of energy."
          accentColor="#ea580c"
          storageKey="adhd-task-manager-hyperactive"
        />
      </main>
    </div>
  );
}

