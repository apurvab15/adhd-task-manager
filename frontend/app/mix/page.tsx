import TaskBoard from "@/components/TaskBoard";

export default function MixPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-fuchsia-100">
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-10 px-6 py-16">
        <section className="space-y-4 text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-violet-600">
            Mix Flow
          </p>
          <h1 className="text-4xl font-semibold text-zinc-900">
            Flexible scaffolding for every kind of day.
          </h1>
          <p className="text-base text-zinc-600">
            Combine impulsive lightning rounds with calm planning in one place.
          </p>
        </section>

        <TaskBoard
          label="Mix Task Board"
          description="Blend structure and spontaneity with a single adaptable list."
          accentColor="#7c3aed"
          storageKey="adhd-task-manager-mix"
        />
      </main>
    </div>
  );
}

