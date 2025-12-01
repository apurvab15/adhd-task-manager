const XP_STORAGE_KEY = "adhd-task-manager-xp";
const XP_PER_TASK = 10;
const XP_PER_LEVEL = 100; // XP needed per level

export type UserStats = {
  totalXP: number;
  level: number;
  currentLevelXP: number;
  xpToNextLevel: number;
  tasksCompleted: number;        // total number of tasks ever completed
  tasksCompletedToday: number;   // number of tasks completed today
};

export function calculateLevel(xp: number): { level: number; currentLevelXP: number; xpToNextLevel: number } {
  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const currentLevelXP = xp % XP_PER_LEVEL;
  const xpToNextLevel = XP_PER_LEVEL - currentLevelXP;
  
  return { level, currentLevelXP, xpToNextLevel };
}

export function getStats(): UserStats {
  if (typeof window === "undefined") {
    return {
      totalXP: 0,
      level: 1,
      currentLevelXP: 0,
      xpToNextLevel: XP_PER_LEVEL,
      tasksCompleted: 0,
      tasksCompletedToday: 0,
    };
  }

  try {
    const saved = window.localStorage.getItem(XP_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const { level, currentLevelXP, xpToNextLevel } = calculateLevel(parsed.totalXP || 0);
      
      // Check if we need to reset daily count
      const today = new Date().toDateString();
      const lastDate = parsed.lastDate || "";
      const tasksCompletedToday = lastDate === today ? (parsed.tasksCompletedToday || 0) : 0;
      
      return {
        totalXP: parsed.totalXP || 0,
        level,
        currentLevelXP,
        xpToNextLevel,
        tasksCompleted: parsed.tasksCompleted || 0,
        tasksCompletedToday,
      };
    }
  } catch (error) {
    console.error("Error loading stats:", error);
  }

  return {
    totalXP: 0,
    level: 1,
    currentLevelXP: 0,
    xpToNextLevel: XP_PER_LEVEL,
    tasksCompleted: 0,
    tasksCompletedToday: 0,
  };
}

export function saveStats(stats: UserStats): void {
  if (typeof window === "undefined") return;

  try {
    const today = new Date().toDateString();
    window.localStorage.setItem(
      XP_STORAGE_KEY,
      JSON.stringify({
        totalXP: stats.totalXP,
        tasksCompleted: stats.tasksCompleted,
        tasksCompletedToday: stats.tasksCompletedToday,
        lastDate: today,
      })
    );
  } catch (error) {
    console.error("Error saving stats:", error);
  }
}

export function awardXPForTask(): UserStats {
  const stats = getStats();
  const today = new Date().toDateString();
  const lastDate = window.localStorage.getItem(XP_STORAGE_KEY)
    ? JSON.parse(window.localStorage.getItem(XP_STORAGE_KEY) || "{}").lastDate || ""
    : "";

  stats.totalXP += XP_PER_TASK;
  stats.tasksCompleted += 1;
  stats.tasksCompletedToday = lastDate === today ? stats.tasksCompletedToday + 1 : 1;

  const { level, currentLevelXP, xpToNextLevel } = calculateLevel(stats.totalXP);
  stats.level = level;
  stats.currentLevelXP = currentLevelXP;
  stats.xpToNextLevel = xpToNextLevel;

  saveStats(stats);
  return stats;
}

/**
 * Revoke XP and task counts when a previously completed task is marked as incomplete again.
 * This mirrors {@link awardXPForTask} but in reverse, and keeps values from going below zero.
 */
export function revokeXPForTaskCompletion(): UserStats {
  const stats = getStats();

  // Remove XP for this task, but never go below 0
  stats.totalXP = Math.max(0, stats.totalXP - XP_PER_TASK);

  // Decrement completed counters, clamped at 0
  stats.tasksCompleted = Math.max(0, stats.tasksCompleted - 1);
  stats.tasksCompletedToday = Math.max(0, stats.tasksCompletedToday - 1);

  const { level, currentLevelXP, xpToNextLevel } = calculateLevel(stats.totalXP);
  stats.level = level;
  stats.currentLevelXP = currentLevelXP;
  stats.xpToNextLevel = xpToNextLevel;

  saveStats(stats);
  return stats;
}

/**
 * Apply a small penalty when a task is removed without ever being completed.
 * This does not change task counters, only total XP / level.
 */
export function penalizeXPForUncompletedTask(): UserStats {
  const stats = getStats();

  // Small penalty – use the same unit as a completion, but clamp at 0
  stats.totalXP = Math.max(0, stats.totalXP - XP_PER_TASK);

  const { level, currentLevelXP, xpToNextLevel } = calculateLevel(stats.totalXP);
  stats.level = level;
  stats.currentLevelXP = currentLevelXP;
  stats.xpToNextLevel = xpToNextLevel;

  saveStats(stats);
  return stats;
}

export function getProgressPercentage(stats: UserStats): number {
  if (stats.xpToNextLevel === XP_PER_LEVEL) return 0;
  return ((XP_PER_LEVEL - stats.xpToNextLevel) / XP_PER_LEVEL) * 100;
}

