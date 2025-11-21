"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const mode = searchParams.get("mode");
    const modeParam = mode ? `?mode=${mode}` : "";
    router.replace(`/home${modeParam}`);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-slate-100 flex items-center justify-center">
      <p className="text-zinc-600">Redirecting to home...</p>
    </div>
  );
}
