"use client";

import { useState, useEffect } from "react";
import { getStats, type UserStats } from "@/utils/gamification";

const defaultStats: UserStats = {
  totalXP: 0,
  level: 1,
  currentLevelXP: 0,
  xpToNextLevel: 100,
  tasksCompleted: 0,
  tasksCompletedToday: 0,
};

export function useGamification() {
  // Always start with default stats to avoid hydration mismatch
  const [stats, setStats] = useState<UserStats>(defaultStats);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // Load stats after mount (client-side only)
    setStats(getStats());
    setIsHydrated(true);

    // Listen for task completion events to refresh stats
    const handleTaskCompleted = () => {
      setStats(getStats());
    };

    window.addEventListener("taskCompleted", handleTaskCompleted);
    return () => {
      window.removeEventListener("taskCompleted", handleTaskCompleted);
    };
  }, []);

  const refreshStats = () => {
    setStats(getStats());
  };

  return { stats, refreshStats };
}

