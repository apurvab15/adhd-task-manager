"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useGamification } from "@/hooks/useGamification";
import { getProgressPercentage, awardXPForTask, revokeXPForTaskCompletion, getLevelEmoji, awardXPForBreakingTask, awardXPForFocusMode } from "@/utils/gamification";
import RadialProgress from "@/components/RadialProgress";
import { useTaskBreaker } from "@/hooks/useTaseBreaking";
import FocusModeModal from "@/components/FocusModeModal";
import AddTasksModal from "@/components/AddTasksModal";
import BreakTasksModal from "@/components/BreakTasksModal";
import { hyperactivePalette, type ColorPalette } from "@/components/TaskListDrawer";
import JSConfetti from "js-confetti";

const STORAGE_KEY = "adhd-task-lists-hyperactive";
const TODAY_TASKS_KEY = "adhd-today-tasks-hyperactive";

const MOTIVATION_MESSAGES = [
  "You're doing great! Keep it up! 💪",
  "Every task completed is a step forward! 🚀",
  "Progress, not perfection! ✨",
  "You've got this! One task at a time! 🌟",
  "Small steps lead to big achievements! 🎯",
  "Your effort today matters! 💫",
  "Keep going, you're making progress! 🌈",
  "Every completed task is a win! 🏆",
  "You're building momentum! Keep pushing! ⚡",
  "Focus on progress, not perfection! 🌸",
  "You're stronger than you think! 💎",
  "One task down, you're on a roll! 🎉",
  "Your consistency is paying off! 🌟",
  "Every small step counts! 🦋",
  "You're creating positive change! ✨",
  "Keep moving forward! 🚶‍♂️",
  "You're doing better than you think! 💪",
  "Progress is progress, no matter how small! 🌱",
  "You're building great habits! 🌈",
  "Stay focused, you've got this! 🎯",
];

type Task = {
  id: number;
  text: string;
  done: boolean;
  sourceListId?: number;
  sourceListName?: string;
};

type TaskList = {
  id: number;
  name: string;
  tasks: { id: number; text: string; done: boolean }[];
};

export default function HyperactivePage() {
  const { stats } = useGamification();
  const progressPercentage = getProgressPercentage(stats);
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
  const [isAddTasksModalOpen, setIsAddTasksModalOpen] = useState(false);
  const [isBreakTasksModalOpen, setIsBreakTasksModalOpen] = useState(false);
  const [brokenTasks, setBrokenTasks] = useState<string[]>([]);
  const [originalTaskText, setOriginalTaskText] = useState<string>("");
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [motivationMessage, setMotivationMessage] = useState("");
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const nextTaskId = useRef(1);
  const nextListId = useRef(1);
  const confettiRef = useRef<JSConfetti | null>(null);
  const hasTriggeredConfettiRef = useRef(false);
  const previousLevelRef = useRef(stats.level);
  const isInitialMountRef = useRef(true);
  const { breakTask, isBreaking, error } = useTaskBreaker("hyperactive");

  // Use hyperactive palette for hyperactive type
  const colorPalette: ColorPalette = hyperactivePalette;

  // Initialize confetti
  useEffect(() => {
    if (typeof window !== "undefined") {
      confettiRef.current = new JSConfetti();
    }
  }, []);

  // Sync previousLevelRef after stats are loaded and mark initial mount as complete
  useEffect(() => {
    previousLevelRef.current = stats.level;
    // Mark initial mount as complete after a brief delay to ensure stats are loaded
    const timer = setTimeout(() => {
      isInitialMountRef.current = false;
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const getRandomMessage = () => {
    const randomIndex = Math.floor(Math.random() * MOTIVATION_MESSAGES.length);
    return MOTIVATION_MESSAGES[randomIndex];
  };

  // Set random motivation message on mount and when tasks are completed
  useEffect(() => {
    setMotivationMessage(getRandomMessage());

    // Update message when tasks are completed
    const handleTaskCompleted = () => {
      setMotivationMessage(getRandomMessage());
    };

    window.addEventListener("taskCompleted", handleTaskCompleted);
    return () => {
      window.removeEventListener("taskCompleted", handleTaskCompleted);
    };
  }, []);

  const handleNewMessage = () => {
    setMotivationMessage(getRandomMessage());
  };

  // Load today's tasks and task lists from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      // Load today's tasks
      const saved = window.localStorage.getItem(TODAY_TASKS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Check if it's from today
        const today = new Date().toDateString();
        if (parsed.date === today) {
          const tasks = parsed.tasks || [];
          setTodayTasks(tasks);
          // Initialize nextTaskId from existing tasks
          if (tasks.length > 0) {
            const maxId = Math.max(...tasks.map((t: Task) => t.id));
            nextTaskId.current = maxId + 1;
          }
        } else {
          // Reset for new day
          setTodayTasks([]);
          window.localStorage.setItem(
            TODAY_TASKS_KEY,
            JSON.stringify({ date: today, tasks: [] })
          );
        }
      }

      // Load task lists
      const savedLists = window.localStorage.getItem(STORAGE_KEY);
      if (savedLists) {
        const parsed = JSON.parse(savedLists);
        setTaskLists(parsed || []);

        // Initialize nextListId from existing lists to avoid ID conflicts
        if (parsed && parsed.length > 0) {
          const maxListId = Math.max(...parsed.map((list: TaskList) => list.id));
          nextListId.current = maxListId + 1;
          const allTasks = parsed.flatMap((list: TaskList) => list.tasks);
          if (allTasks.length > 0) {
            const maxTaskId = Math.max(...allTasks.map((t: { id: number }) => t.id));
            nextTaskId.current = Math.max(nextTaskId.current, maxTaskId + 1);
          }
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }

    setIsHydrated(true);
  }, []);

  // Listen for task completion events to refresh task lists
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleTaskUpdate = () => {
      try {
        const savedLists = window.localStorage.getItem(STORAGE_KEY);
        if (savedLists) {
          const parsed = JSON.parse(savedLists);
          setTaskLists(parsed || []);
        }
      } catch (error) {
        console.error("Error refreshing task lists:", error);
      }
    };

    const handleTaskListUpdate = () => {
      // When task manager updates, sync today's tasks if they have sourceListId
      try {
        const savedLists = window.localStorage.getItem(STORAGE_KEY);
        if (savedLists) {
          const parsed: TaskList[] = JSON.parse(savedLists);
          setTaskLists(parsed);
          
          // Update today's tasks to match task manager state
          setTodayTasks((todayTasks) => {
            return todayTasks.map((todayTask) => {
              if (todayTask.sourceListId) {
                const sourceList = parsed.find((list) => list.id === todayTask.sourceListId);
                if (sourceList) {
                  const sourceTask = sourceList.tasks.find((t) => t.id === todayTask.id);
                  if (sourceTask && sourceTask.done !== todayTask.done) {
                    // State changed - sync it (gamification already handled in TaskList)
                    return { ...todayTask, done: sourceTask.done };
                  }
                }
              }
              return todayTask;
            });
          });
        }
      } catch (error) {
        console.error("Error syncing with task manager:", error);
      }
    };

    const handleTodayTasksUpdate = () => {
      // When today's tasks are updated from task manager, refresh from localStorage
      try {
        const saved = window.localStorage.getItem(TODAY_TASKS_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          const today = new Date().toDateString();
          if (parsed.date === today) {
            const tasks = parsed.tasks || [];
            setTodayTasks(tasks);
          }
        }
      } catch (error) {
        console.error("Error refreshing today's tasks:", error);
      }
    };

    window.addEventListener("taskCompleted", handleTaskUpdate);
    window.addEventListener("taskListUpdated", handleTaskListUpdate);
    window.addEventListener("todayTasksUpdated", handleTodayTasksUpdate);
    // Also listen for storage changes
    window.addEventListener("storage", handleTaskUpdate);

    return () => {
      window.removeEventListener("taskCompleted", handleTaskUpdate);
      window.removeEventListener("taskListUpdated", handleTaskListUpdate);
      window.removeEventListener("todayTasksUpdated", handleTodayTasksUpdate);
      window.removeEventListener("storage", handleTaskUpdate);
    };
  }, []);

  // Save today's tasks to localStorage
  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") return;

    const today = new Date().toDateString();
    window.localStorage.setItem(
      TODAY_TASKS_KEY,
      JSON.stringify({ date: today, tasks: todayTasks })
    );
  }, [todayTasks, isHydrated]);

  // Save task lists to localStorage
  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(taskLists));
  }, [taskLists, isHydrated]);

  const handleTaskToggle = (taskId: number) => {
    setTodayTasks((tasks) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return tasks;
      
      const newDone = !task.done;
      
      // Sync with task manager if this task is linked to a task list
      if (task.sourceListId && typeof window !== "undefined") {
        try {
          const savedLists = window.localStorage.getItem(STORAGE_KEY);
          if (savedLists) {
            const parsed: TaskList[] = JSON.parse(savedLists);
            const updatedLists = parsed.map((list) => {
              if (list.id === task.sourceListId) {
                return {
                  ...list,
                  tasks: list.tasks.map((t) =>
                    t.id === taskId ? { ...t, done: newDone } : t
                  ),
                };
              }
              return list;
            });
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLists));
            setTaskLists(updatedLists);
            // Dispatch event to notify task manager of the change
            window.dispatchEvent(new CustomEvent("taskListUpdated"));
          }
        } catch (error) {
          console.error("Error syncing task with task manager:", error);
        }
      }
      
      // Handle gamification: award XP when checking, revoke when unchecking
      if (typeof window !== "undefined") {
        if (newDone && !task.done) {
          // Marking as done – award XP
          awardXPForTask();
        } else if (!newDone && task.done) {
          // Unchecking a completed task – revoke XP
          revokeXPForTaskCompletion();
        }
        // Notify listeners that gamification stats changed
        window.dispatchEvent(new CustomEvent("taskCompleted"));
      }
      
      return tasks.map((t) => (t.id === taskId ? { ...t, done: newDone } : t));
    });
  };

  const handleRemoveTask = (taskId: number) => {
    setTodayTasks((tasks) => tasks.filter((task) => task.id !== taskId));
  };

  const handleAddTasks = (tasks: Array<{ id: number; text: string; done: boolean; sourceListId?: number; sourceListName?: string }>) => {
    setTodayTasks((prev) => [...prev, ...tasks]);
  };

  const addTask = (text: string) => {
    const t = text.trim();
    if (!t) return;
    const newTask: Task = { id: nextTaskId.current++, text: t, done: false };
    setTodayTasks((prev) => [...prev, newTask]);
    setInput("");
    inputRef.current?.focus();
  };

  const breakTaskAtCaret = () => {
    const el = inputRef.current;
    if (!el) return;
    const value = el.value;
    const pos = el.selectionStart ?? value.length;
    if (!value.trim()) return;
    const left = value.slice(0, pos).trim();
    const right = value.slice(pos).trim();
    const newTasks: Task[] = [];
    if (left) newTasks.push({ id: nextTaskId.current++, text: left, done: false });
    if (right) newTasks.push({ id: nextTaskId.current++, text: right, done: false });
    if (newTasks.length > 0) {
      setTodayTasks((prev) => [...prev, ...newTasks]);
    }
    setInput("");
    el.focus();
  };

  const handleBreakTasks = async (text: string) => {
    const taskText = text.trim();
    if (!taskText) return;
    
    setOriginalTaskText(taskText);
    setIsBreakTasksModalOpen(true);
    
    try {
      const subTasks = await breakTask(taskText, "hyperactive");
      console.log("hyperactive page: subTasks", subTasks);
      if (subTasks && subTasks.length === 0) {
        setIsBreakTasksModalOpen(false);
        alert("No sub-tasks were generated. Please try again.");
        return;
      }
      setBrokenTasks(subTasks || []);
    } catch (error) {
      console.error("Error breaking down task:", error);
      setIsBreakTasksModalOpen(false);
      alert(error instanceof Error ? error.message : "Failed to break down task. Please try again.");
    }
  };

  const handleDiscardBrokenTasks = () => {
    setBrokenTasks([]);
    setOriginalTaskText("");
    setIsBreakTasksModalOpen(false);
    setInput("");
    inputRef.current?.focus();
  };

  const handleAddBrokenTasks = (brokenTasksList: Array<{ id: number; text: string }>) => {
    if (brokenTasksList.length === 0) return;

    const validTasks = brokenTasksList.filter((t) => t.text.trim() !== "");
    if (validTasks.length === 0) return;

    // Award XP for breaking a task (10 points)
    awardXPForBreakingTask();
    window.dispatchEvent(new CustomEvent("taskCompleted"));

    // Generate unique IDs for tasks
    const tasksWithIds = validTasks.map((task) => ({
      id: nextTaskId.current++,
      text: task.text.trim(),
      done: false,
    }));

    // Create a new task list with the broken tasks
    const newListName = originalTaskText.slice(0, 30) + (originalTaskText.length > 30 ? "..." : "");
    const newList: TaskList = {
      id: nextListId.current++,
      name: newListName,
      tasks: tasksWithIds.map((task) => ({
        id: task.id,
        text: task.text,
        done: false,
      })),
    };

    // Add the new list to task lists
    setTaskLists((prev) => [...prev, newList]);

    // Add tasks to today's tasks
    const todayTasksWithIds: Task[] = tasksWithIds.map((task) => ({
      ...task,
      sourceListId: newList.id,
      sourceListName: newList.name,
    }));

    setTodayTasks((prev) => {
      // Filter out duplicates based on text content
      const existingTexts = new Set(prev.map((t) => t.text.toLowerCase().trim()));
      const newTasks = todayTasksWithIds.filter(
        (t) => !existingTexts.has(t.text.toLowerCase().trim())
      );
      return [...newTasks, ...prev];
    });

    // Clean up
    setBrokenTasks([]);
    setOriginalTaskText("");
    setIsBreakTasksModalOpen(false);
    setInput("");
    inputRef.current?.focus();
  };

  const existingTaskIds = new Set(todayTasks.map((t) => t.id));

  const completedToday = todayTasks.filter((t) => t.done).length;
  const totalToday = todayTasks.length;
  const allTasksCompleted = totalToday > 0 && completedToday === totalToday;

  // Calculate overall task statistics
  const allTasks = taskLists.flatMap((list) => list.tasks);
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t) => t.done).length;
  const overallCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  // Calculate completion rate per task list
  const listProgress = taskLists.map((list) => {
    const total = list.tasks.length;
    const completed = list.tasks.filter((t) => t.done).length;
    const rate = total > 0 ? (completed / total) * 100 : 0;
    return {
      name: list.name,
      completed,
      total,
      rate,
    };
  });

  // Trigger confetti when all tasks are completed
  useEffect(() => {
    if (allTasksCompleted && confettiRef.current && !hasTriggeredConfettiRef.current) {
      hasTriggeredConfettiRef.current = true;
      confettiRef.current.addConfetti({
        emojis: ["🎉", "✨", "🌟", "💫", "🎊"],
        emojiSize: 100,
        confettiNumber: 50,
      });
    } else if (!allTasksCompleted) {
      // Reset the flag when tasks become incomplete again
      hasTriggeredConfettiRef.current = false;
    }
  }, [allTasksCompleted]);

  // Trigger confetti when leveling up (skip on initial mount)
  useEffect(() => {
    if (isInitialMountRef.current) return;
    
    if (stats.level > previousLevelRef.current && confettiRef.current) {
      previousLevelRef.current = stats.level;
      confettiRef.current.addConfetti({
        emojis: ["🏆", "⭐", "🎉", "🌟", "✨", "💎"],
        emojiSize: 100,
        confettiNumber: 60,
      });
    }
  }, [stats.level]);

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-b from-[#FFAF91] via-[#FFD1BF] to-[#FEF2EC] flex flex-col">
      {/* Navigation Bar */}
      <nav className="flex-shrink-0 border-b border-[#1A659E]/20 bg-white/95 backdrop-blur-sm shadow-sm">
        <div className="flex items-center gap-4 px-4 py-3">
          <Link href="/hyperactive" className="flex items-center gap-2 text-[#004E89] transition-colors hover:text-[#1A659E]">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-6 w-6"
            >
              <path
                fillRule="evenodd"
                d="M9.293 2.293a1 1 0 0 1 1.414 0l7 7A1 1 0 0 1 17 11h-1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6H3a1 1 0 0 1-.707-1.707l7-7Z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-lg font-semibold text-[#004E89]">Energetic Hustler</span>
          </Link>
          {/* Progress Bar */}
          <div className="flex-1 flex items-center gap-3">
            {totalToday > 0 ? (
              <>
                <div className="flex-1 h-2 overflow-hidden rounded-full bg-[#7FA0BB]/40">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#FF6B35] to-[#E03C00] transition-all duration-500"
                    style={{ width: `${(completedToday / totalToday) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-[#004E89] whitespace-nowrap">{completedToday}/{totalToday}</span>
              </>
            ) : (
              <p className="text-sm font-medium text-[#004E89]">Let&apos;s get started for today, set our goals!</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/tasks?mode=hyperactive"
              className="flex items-center justify-center rounded-lg p-2 bg-white border-2 border-[#004E89] text-[#004E89] transition-colors hover:bg-[#FFD1BF]/50"
              title="Task Manager"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" className="h-4 w-4">
                <path d="M152.1 38.2c9.9 8.9 10.7 24 1.8 33.9l-72 80c-4.4 4.9-10.6 7.8-17.2 7.9s-12.9-2.4-17.6-7L7 113C-2.3 103.6-2.3 88.4 7 79s24.6-9.4 33.9 0l22.1 22.1 55.1-61.2c8.9-9.9 24-10.7 33.9-1.8zm0 160c9.9 8.9 10.7 24 1.8 33.9l-72 80c-4.4 4.9-10.6 7.8-17.2 7.9s-12.9-2.4-17.6-7L7 273c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l22.1 22.1 55.1-61.2c8.9-9.9 24-10.7 33.9-1.8zM224 96c0-17.7 14.3-32 32-32H480c17.7 0 32 14.3 32 32s-14.3 32-32 32H256c-17.7 0-32-14.3-32-32zm0 160c0-17.7 14.3-32 32-32H480c17.7 0 32 14.3 32 32s-14.3 32-32 32H256c-17.7 0-32-14.3-32-32zM160 416c0-17.7 14.3-32 32-32H480c17.7 0 32 14.3 32 32s-14.3 32-32 32H192c-17.7 0-32-14.3-32-32zM48 368a48 48 0 1 1 0 96 48 48 0 1 1 0-96z"/>
              </svg>
            </Link>
            <button
              onClick={() => setIsFocusModalOpen(true)}
              className={`flex items-center justify-center rounded-lg p-2 ${colorPalette.accent} text-white transition-colors ${colorPalette.accentHover}`}
              title="Focus Mode"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" className="h-4 w-4">
                <path d="M448 256A192 192 0 1 0 64 256a192 192 0 1 0 384 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zm256 80a80 80 0 1 0 0-160 80 80 0 1 0 0 160zm0-224a144 144 0 1 1 0 288 144 144 0 1 1 0-288zM224 256a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z"/>
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* 3 Column Layout */}
      <main className="flex-1 flex gap-2 p-2 overflow-hidden min-h-0">
        {/* Left Column - Gamification */}
        <div className="flex-1 rounded-2xl border border-[#1A659E]/20 bg-white p-6 shadow-lg shadow-[#004E89]/10 flex flex-col overflow-y-auto backdrop-blur-sm">
          {/* Title */}
          <div className="mb-6 flex-shrink-0">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-[#004E89]">
              Your Progress
            </p>
          </div>

          <div className="space-y-6 flex-1 flex flex-col">
            {/* Radial Progress Bar with Emoji */}
            <div className="flex justify-center">
              <RadialProgress 
                percentage={progressPercentage} 
                emoji={getLevelEmoji(stats.level)}
                size={180}
                progressColor="text-[#004E89]"
                bgColor="text-[#BFC9D4]"
              />
            </div>

            {/* Level Number with XP */}
            <div className="text-center space-y-1">
              <p className="text-lg font-bold text-[#004E89]">
                LEVEL {stats.level}
              </p>
              <p className="text-sm text-[#1A659E]">
                {stats.currentLevelXP} / 100 XP
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => setIsFocusModalOpen(true)}
                className={`w-full rounded-xl ${colorPalette.accent} px-4 py-3 text-sm font-semibold text-white transition ${colorPalette.accentHover} flex items-center justify-center gap-2`}
                title="Go to Focus Mode (+10 XP)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" className="h-4 w-4">
                  <path d="M448 256A192 192 0 1 0 64 256a192 192 0 1 0 384 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zm256 80a80 80 0 1 0 0-160 80 80 0 1 0 0 160zm0-224a144 144 0 1 1 0 288 144 144 0 1 1 0-288zM224 256a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z"/>
                </svg>
                Go to Focus Mode
              </button>
              <button
                onClick={() => {
                  if (input.trim()) {
                    handleBreakTasks(input);
                  } else {
                    // If no input, just open the break modal with empty input
                    setIsBreakTasksModalOpen(true);
                  }
                }}
                className={`w-full rounded-xl border ${colorPalette.borderLight} bg-white px-4 py-3 text-sm font-semibold ${colorPalette.text} transition ${colorPalette.accentLight.replace('bg-', 'hover:bg-')} flex items-center justify-center gap-2`}
                title="Break a Task (+10 XP)"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path d="M15.98 1.804a1 1 0 0 0-1.96 0l-.24 1.192a1 1 0 0 1-.784.785l-1.192.238a1 1 0 0 0 0 1.962l1.192.238a1 1 0 0 1 .785.785l.238 1.192a1 1 0 0 0 1.962 0l.238-1.192a1 1 0 0 1 .785-.785l1.192-.238a1 1 0 0 0 0-1.962l-1.192-.238a1 1 0 0 1-.785-.785l-.238-1.192ZM6.949 5.684a1 1 0 0 0-1.898 0l-.683 2.051a1 1 0 0 1-.633.633l-2.051.683a1 1 0 0 0 0 1.898l2.051.684a1 1 0 0 1 .633.632l.683 2.051a1 1 0 0 0 1.898 0l.683-2.051a1 1 0 0 1 .633-.633l2.051-.683a1 1 0 0 0 0-1.898l-2.051-.683a1 1 0 0 1-.633-.633L6.95 5.684ZM13.949 13.684a1 1 0 0 0-1.898 0l-.184.551a1 1 0 0 1-.632.633l-.551.183a1 1 0 0 0 0 1.898l.551.183a1 1 0 0 1 .633.633l.183.551a1 1 0 0 0 1.898 0l.184-.551a1 1 0 0 1 .632-.633l.551-.183a1 1 0 0 0 0-1.898l-.551-.184a1 1 0 0 1-.633-.632l-.183-.551Z" />
                </svg>
                Break a Task
              </button>
            </div>
          </div>
        </div>

        {/* Middle Column - Today's Task List */}
        <div className="flex-[2] rounded-2xl border border-[#1A659E]/20 bg-white p-6 shadow-lg shadow-[#004E89]/10 flex flex-col min-h-0 backdrop-blur-sm">
          <div className="mb-4 flex-shrink-0">
            <h2 className="text-2xl font-semibold text-[#004E89]">Today&apos;s List</h2>
          </div>

          <div className="flex-1 overflow-y-auto mb-4 min-h-0">
            {todayTasks.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-[#7FA0BB]/50 bg-[#FFD1BF]/40 p-8 text-center">
                <p className="text-sm text-[#1A659E]/70">
                  No tasks for today. Add some tasks to get started!
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {todayTasks.map((task) => (
                  <li
                    key={task.id}
                    className="flex items-center gap-3 rounded-xl border border-[#7FA0BB]/40 bg-white p-3 transition-colors hover:bg-[#FFAF91]/30"
                  >
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => handleTaskToggle(task.id)}
                      className="h-4 w-4 cursor-pointer rounded border-[#7FA0BB] text-[#FF6B35] focus:ring-[#004E89]"
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-base break-words ${
                          task.done ? "line-through text-[#7FA0BB]" : "text-[#004E89]"
                        }`}
                      >
                        {task.text}
                      </p>
                      {task.sourceListName && (
                        <p className="mt-1 text-xs text-[#1A659E]">from {task.sourceListName}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemoveTask(task.id)}
                      className="flex-shrink-0 rounded p-1 text-[#7FA0BB] transition-colors hover:text-[#E03C00]"
                      aria-label="Remove task"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-4 w-4"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Input area */}
          <div className="flex-shrink-0 border-t border-[#7FA0BB]/40 pt-4 flex items-start gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  addTask(input);
                }
              }}
              rows={2}
              placeholder="Add task..."
              className="flex-1 rounded-lg border border-[#7FA0BB]/40 bg-white px-3 py-2 text-base text-[#004E89] placeholder:text-[#7FA0BB] focus:border-[#004E89] focus:outline-none resize-none"
            />
            <div className="flex flex-col gap-2">
              <button
                onClick={() => addTask(input)}
                className={`rounded-lg ${colorPalette.accent} px-4 py-2 text-base font-medium text-white transition ${colorPalette.accentHover}`}
              >
                Add
              </button>
              <button
                onClick={() => handleBreakTasks(input)}
                disabled={isBreaking}
                className="rounded-lg border border-[#7FA0BB]/40 bg-white px-4 py-2 text-base font-medium text-[#004E89] transition-colors hover:bg-[#FFAF91]/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                title="Break down task using AI"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
                  <path d="M15.98 1.804a1 1 0 0 0-1.96 0l-.24 1.192a1 1 0 0 1-.784.785l-1.192.238a1 1 0 0 0 0 1.962l1.192.238a1 1 0 0 1 .785.785l.238 1.192a1 1 0 0 0 1.962 0l.238-1.192a1 1 0 0 1 .785-.785l1.192-.238a1 1 0 0 0 0-1.962l-1.192-.238a1 1 0 0 1-.785-.785l-.238-1.192ZM6.949 5.684a1 1 0 0 0-1.898 0l-.683 2.051a1 1 0 0 1-.633.633l-2.051.683a1 1 0 0 0 0 1.898l2.051.684a1 1 0 0 1 .633.632l.683 2.051a1 1 0 0 0 1.898 0l.683-2.051a1 1 0 0 1 .633-.633l2.051-.683a1 1 0 0 0 0-1.898l-2.051-.683a1 1 0 0 1-.633-.633L6.95 5.684ZM13.949 13.684a1 1 0 0 0-1.898 0l-.184.551a1 1 0 0 1-.632.633l-.551.183a1 1 0 0 0 0 1.898l.551.183a1 1 0 0 1 .633.633l.183.551a1 1 0 0 0 1.898 0l.184-.551a1 1 0 0 1 .632-.633l.551-.183a1 1 0 0 0 0-1.898l-.551-.184a1 1 0 0 1-.633-.632l-.183-.551Z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - Progress */}
        <div className="flex-1 rounded-2xl border border-[#1A659E]/20 bg-white p-6 shadow-lg shadow-[#004E89]/10 flex flex-col overflow-y-auto backdrop-blur-sm">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-[#004E89]">Progress</h2>
          </div>

          <div className="space-y-3 flex-1">
            {listProgress.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-[#7FA0BB]/50 bg-[#FFD1BF]/40 p-8 text-center">
                <p className="text-sm text-[#1A659E]/70">
                  No task lists yet. Create one in Task Manager!
                </p>
              </div>
            ) : (
              listProgress.map((list, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-[#7FA0BB]/40 bg-white p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <h4 className="text-base font-semibold text-[#004E89] mb-3 truncate">{list.name}</h4>
                  <div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#7FA0BB]/40">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#FF6B35] to-[#E03C00] transition-all duration-500"
                        style={{ width: `${list.rate}%` }}
                      />
                    </div>
                    <p className="text-sm text-[#1A659E]/70 mt-1">{list.completed}/{list.total} tasks</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      <FocusModeModal isOpen={isFocusModalOpen} onClose={() => setIsFocusModalOpen(false)} mode="hyperactive" />
      <AddTasksModal
        isOpen={isAddTasksModalOpen}
        onClose={() => setIsAddTasksModalOpen(false)}
        onAddTasks={handleAddTasks}
        existingTaskIds={existingTaskIds}
        mode="hyperactive"
      />
      <BreakTasksModal
        isOpen={isBreakTasksModalOpen}
        isLoading={isBreaking}
        tasks={brokenTasks}
        originalTask={originalTaskText}
        onClose={() => {
          if (!isBreaking) {
            handleDiscardBrokenTasks();
          }
        }}
        onDiscard={handleDiscardBrokenTasks}
        onAdd={handleAddBrokenTasks}
        colorPalette={colorPalette}
      />
    </div>
  );
}
