import TaskBoard from "@/components/TaskBoard";

export default function InattentivePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-cyan-100">
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-10 px-6 py-16">
        <section className="space-y-4 text-center sm:text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-sky-600">
            Inattentive Flow
          </p>
          <h1 className="text-4xl font-semibold text-zinc-900">
            Slow down, anchor gently, keep moving.
          </h1>
          <p className="text-base text-zinc-600">
            Build a calm queue so wandering focus always knows the next soft
            step to take.
          </p>
        </section>

        <TaskBoard
          label="Inattentive Task Board"
          description="One gentle list to guide you back whenever your mind drifts away."
          accentColor="#0284c7"
          storageKey="adhd-task-manager-inattentive"
        />
      </main>
    </div>
  );
}

