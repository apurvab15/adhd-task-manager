"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTaskBreaker } from "@/hooks/useTaseBreaking";
import FocusModeModal from "@/components/FocusModeModal";
import AddTasksModal from "@/components/AddTasksModal";
import BreakTasksModal from "@/components/BreakTasksModal";
import { combinedPalette, type ColorPalette } from "@/components/TaskListDrawer";
import JSConfetti from "js-confetti";

const STORAGE_KEY = "adhd-task-lists-combined";
const TODAY_TASKS_KEY = "adhd-today-tasks-combined";

type Task = {
  id: number;
  text: string;
  done: boolean;
};

type TaskList = {
  id: number;
  name: string;
  tasks: Task[];
  status?: "todo" | "doing" | "done";
};

// Helper to calculate status from tasks
const calculateStatus = (tasks: Task[]): "todo" | "doing" | "done" => {
  if (tasks.length === 0) return "todo";
  const completedCount = tasks.filter((t) => t.done).length;
  if (completedCount === tasks.length) return "done";
  if (completedCount > 0) return "doing";
  return "todo";
};

export default function CombinedPage() {
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [input, setInput] = useState("");
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
  const [isAddTasksModalOpen, setIsAddTasksModalOpen] = useState(false);
  const [isBreakTasksModalOpen, setIsBreakTasksModalOpen] = useState(false);
  const [brokenTasks, setBrokenTasks] = useState<string[]>([]);
  const [originalTaskText, setOriginalTaskText] = useState<string>("");
  const [mode, setMode] = useState<"calm" | "chaos">("chaos");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const nextTaskId = useRef(1);
  const nextListId = useRef(1);
  const confettiRef = useRef<JSConfetti | null>(null);
  const isUpdatingFromStorage = useRef(false);
  const taskListsRef = useRef<TaskList[]>([]);
  const { breakTask, isBreaking } = useTaskBreaker("combined");
  const colorPalette: ColorPalette = combinedPalette;

  // Initialize confetti
  useEffect(() => {
    if (typeof window !== "undefined") {
      confettiRef.current = new JSConfetti();
    }
  }, []);

  // Load data from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      // Load today's tasks
      const saved = window.localStorage.getItem(TODAY_TASKS_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const today = new Date().toDateString();
        if (parsed.date === today) {
          const tasks = parsed.tasks || [];
          setTodayTasks(tasks);
          if (tasks.length > 0) {
            const maxId = Math.max(...tasks.map((t: Task) => t.id));
            nextTaskId.current = maxId + 1;
          }
        } else {
          setTodayTasks([]);
          window.localStorage.setItem(
            TODAY_TASKS_KEY,
            JSON.stringify({ date: today, tasks: [] })
          );
        }
      }

      // Load task lists from task manager storage
      const savedLists = window.localStorage.getItem(STORAGE_KEY);
      if (savedLists) {
        const parsed = JSON.parse(savedLists) as TaskList[];
        // Add status to each list based on task completion
        const listsWithStatus = parsed.map((list) => ({
          ...list,
          status: calculateStatus(list.tasks),
        }));
        setTaskLists(listsWithStatus);
        if (parsed && parsed.length > 0) {
          const maxListId = Math.max(...parsed.map((list: TaskList) => list.id));
          nextListId.current = maxListId + 1;
          const allTasks = parsed.flatMap((list: TaskList) => list.tasks);
          if (allTasks.length > 0) {
            const maxTaskId = Math.max(...allTasks.map((t: Task) => t.id));
            nextTaskId.current = Math.max(nextTaskId.current, maxTaskId + 1);
          }
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }

    setIsHydrated(true);
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

  // Update ref whenever taskLists changes
  useEffect(() => {
    taskListsRef.current = taskLists;
  }, [taskLists]);

  // Save task lists to task manager storage (without status field)
  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") return;
    // Skip if we're updating from storage to prevent infinite loop
    if (isUpdatingFromStorage.current) {
      isUpdatingFromStorage.current = false;
      return;
    }
    // Remove status field before saving to match task manager format
    const listsToSave = taskLists.map(({ status, ...list }) => list);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(listsToSave));
    // Dispatch event to notify task manager of changes
    window.dispatchEvent(new CustomEvent("taskListUpdated"));
  }, [taskLists, isHydrated]);

  // Listen for changes from task manager and today's tasks
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleTaskListUpdate = () => {
        try {
        const savedLists = window.localStorage.getItem(STORAGE_KEY);
          if (savedLists) {
          const parsed = JSON.parse(savedLists) as TaskList[];
          // Add status to each list based on task completion
          const listsWithStatus = parsed.map((list) => ({
            ...list,
            status: calculateStatus(list.tasks),
          }));
          // Check if data actually changed to prevent unnecessary updates
          // Use ref to get current value without adding to dependencies
          const currentData = JSON.stringify(taskListsRef.current.map(({ status, ...list }) => list));
          const newData = JSON.stringify(parsed);
          if (currentData !== newData) {
            isUpdatingFromStorage.current = true;
            setTaskLists(listsWithStatus);
          }
          }
        } catch (error) {
          console.error("Error syncing with task manager:", error);
      }
    };

    const handleTodayTasksUpdate = () => {
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

      window.addEventListener("taskListUpdated", handleTaskListUpdate);
      window.addEventListener("todayTasksUpdated", handleTodayTasksUpdate);
    window.addEventListener("storage", handleTaskListUpdate);

    return () => {
        window.removeEventListener("taskListUpdated", handleTaskListUpdate);
        window.removeEventListener("todayTasksUpdated", handleTodayTasksUpdate);
      window.removeEventListener("storage", handleTaskListUpdate);
    };
  }, []);


  const addTask = (text: string) => {
    const t = text.trim();
    if (!t) return;

    // Add to Today's List
    const newTask: Task = { id: nextTaskId.current++, text: t, done: false };
    setTodayTasks((prev) => [...prev, newTask]);

    // Create a new task list in task manager with this single task
    const newList: TaskList = {
      id: nextListId.current++,
      name: t,
      tasks: [{ id: newTask.id, text: t, done: false }],
      status: "todo",
    };

    setTaskLists((prev) => [...prev, newList]);
    setInput("");
    inputRef.current?.focus();
  };

  const handleBreakTasks = async (text: string) => {
    const taskText = text.trim();
    if (!taskText) return;
    
    setOriginalTaskText(taskText);
    setIsBreakTasksModalOpen(true);
    
    try {
      const subTasks = await breakTask(taskText, "combined");
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

    // Generate unique IDs for tasks
    const tasksWithIds = validTasks.map((task) => ({
      id: nextTaskId.current++,
      text: task.text.trim(),
      done: false,
    }));

    // Add to Today's List
    const todayTasksToAdd: Task[] = tasksWithIds.map((task) => ({
      id: task.id,
      text: task.text,
      done: false,
    }));
    setTodayTasks((prev) => [...prev, ...todayTasksToAdd]);

    // Create a new task list in task manager with the broken tasks
    const newListName = originalTaskText.slice(0, 30) + (originalTaskText.length > 30 ? "..." : "");
    const newList: TaskList = {
      id: nextListId.current++,
      name: newListName,
      tasks: tasksWithIds,
      status: "todo",
    };

    setTaskLists((prev) => [...prev, newList]);

    // Clean up
    setBrokenTasks([]);
    setOriginalTaskText("");
    setIsBreakTasksModalOpen(false);
    setInput("");
    inputRef.current?.focus();
  };

  const handleTaskToggle = (listId: number, taskId: number) => {
    setTaskLists((lists) => {
      return lists.map((list) => {
        if (list.id === listId) {
          // Update task done status
          const updatedTasks = list.tasks.map((t) =>
            t.id === taskId ? { ...t, done: !t.done } : t
          );
          
          // Reorder: incomplete tasks first, then completed tasks
          const incomplete = updatedTasks.filter((t) => !t.done);
          const completed = updatedTasks.filter((t) => t.done);
          const reorderedTasks = [...incomplete, ...completed];
          
          const newStatus = calculateStatus(reorderedTasks);

          // Trigger confetti when moving to done
          if (newStatus === "done" && list.status !== "done" && confettiRef.current) {
      confettiRef.current.addConfetti({
        emojis: ["🎉", "✨", "🌟", "💫", "🎊"],
        emojiSize: 100,
        confettiNumber: 50,
      });
          }

          // Also update today's tasks if they share the same ID
          setTodayTasks((todayTasks) =>
            todayTasks.map((task) =>
              task.id === taskId ? { ...task, done: !task.done } : task
            )
          );

          return {
            ...list,
            tasks: reorderedTasks,
            status: newStatus,
          };
        }
        return list;
      });
    });
  };

  const handleRemoveTask = (listId: number, taskId: number) => {
    setTaskLists((lists) =>
      lists.map((list) => {
        if (list.id === listId) {
          const newTasks = list.tasks.filter((t) => t.id !== taskId);
          // If no tasks left, remove the list
          if (newTasks.length === 0) {
            return null;
          }
          return { ...list, tasks: newTasks };
        }
        return list;
      }).filter((list): list is TaskList => list !== null)
    );
  };

  const handleTodayTaskToggle = (taskId: number) => {
    setTodayTasks((tasks) => {
      const updatedTasks = tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t));
      const toggledTask = updatedTasks.find((t) => t.id === taskId);
      
      // Reorder: incomplete tasks first, then completed tasks
      const incomplete = updatedTasks.filter((t) => !t.done);
      const completed = updatedTasks.filter((t) => t.done);
      const reorderedTodayTasks = [...incomplete, ...completed];
      
      // Also update task manager if the task exists there
      if (toggledTask) {
        setTaskLists((lists) => {
          return lists.map((list) => {
            const taskInList = list.tasks.find((t) => t.id === taskId);
            if (taskInList) {
              const updatedTasks = list.tasks.map((t) =>
                t.id === taskId ? { ...t, done: toggledTask.done } : t
              );
              // Reorder: incomplete tasks first, then completed tasks
              const incomplete = updatedTasks.filter((t) => !t.done);
              const completed = updatedTasks.filter((t) => t.done);
              const reorderedTasks = [...incomplete, ...completed];
              const newStatus = calculateStatus(reorderedTasks);
              
              // Trigger confetti when moving to done
              if (newStatus === "done" && list.status !== "done" && confettiRef.current) {
                confettiRef.current.addConfetti({
                  emojis: ["🎉", "✨", "🌟", "💫", "🎊"],
                  emojiSize: 100,
                  confettiNumber: 50,
                });
              }
              
              return {
                ...list,
                tasks: reorderedTasks,
                status: newStatus,
              };
            }
            return list;
          });
        });
      }
      
      return reorderedTodayTasks;
    });
  };

  const handleRemoveTodayTask = (taskId: number) => {
    setTodayTasks((tasks) => tasks.filter((t) => t.id !== taskId));
    
    // Also remove from task manager if the task exists there
    setTaskLists((lists) =>
      lists.map((list) => {
        const taskInList = list.tasks.find((t) => t.id === taskId);
        if (taskInList) {
          const newTasks = list.tasks.filter((t) => t.id !== taskId);
          // If no tasks left, remove the list
          if (newTasks.length === 0) {
            return null;
          }
          return { ...list, tasks: newTasks, status: calculateStatus(newTasks) };
        }
        return list;
      }).filter((list): list is TaskList => list !== null)
    );
  };

  const handleAddTodayTask = (text: string) => {
    const t = text.trim();
    if (!t) return;
    const newTask: Task = { id: nextTaskId.current++, text: t, done: false };
    setTodayTasks((prev) => [...prev, newTask]);
  };

  const handleAddTasks = (tasks: Array<{ id: number; text: string; done: boolean; sourceListId?: number; sourceListName?: string }>) => {
    setTodayTasks((prev) => [...prev, ...tasks]);
  };

  const existingTaskIds = new Set(todayTasks.map((t) => t.id));
  const completedToday = todayTasks.filter((t) => t.done).length;
  const totalToday = todayTasks.length;

  // Update status for all lists based on current task completion
  const listsWithUpdatedStatus = taskLists.map((list) => ({
    ...list,
    status: calculateStatus(list.tasks),
  }));

  const todoLists = listsWithUpdatedStatus.filter((list) => list.status === "todo");
  const doingLists = listsWithUpdatedStatus.filter((list) => list.status === "doing");
  const doneLists = listsWithUpdatedStatus.filter((list) => list.status === "done");

  // Get the next incomplete task for calm mode
  const nextTask = todayTasks.find((t) => !t.done);

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-[#EFEFD0] via-[#F7C59F]/20 to-[#EFEFD0] flex flex-col">
      {/* Navigation Bar */}
      <nav className="flex-shrink-0 border-b border-[#004E89]/10 bg-white/90 backdrop-blur-sm">
        <div className="flex items-center gap-4 px-4 py-3">
          <Link href="/combined" className="flex items-center gap-2 text-[#004E89] transition-colors hover:text-[#1A659E]">
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
            <span className="text-lg font-semibold">Dynamic Worker</span>
          </Link>
          {/* Progress Bar */}
          <div className="flex-1 flex items-center gap-3">
            {totalToday > 0 ? (
              <>
                <div className="flex-1 h-2 overflow-hidden rounded-full bg-[#F7C59F]/30">
                  <div
                    className="h-full rounded-full bg-[#FF6B35] transition-all duration-500"
                    style={{ width: `${(completedToday / totalToday) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-[#1A659E] whitespace-nowrap">{completedToday}/{totalToday}</span>
              </>
            ) : (
              <p className="text-sm font-medium text-[#004E89]">Let&apos;s get started for today, set our goals!</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* Chaos/Calm Toggle */}
            <div className="flex items-center rounded-full border-2 border-[#004E89]/30 bg-white/80 p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setMode("chaos")}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide transition-all ${
                  mode === "chaos"
                    ? "bg-[#FF6B35] text-white shadow-md"
                    : "text-[#004E89] hover:bg-[#F7C59F]/20"
                }`}
              >
                Chaos
              </button>
              <button
                type="button"
                onClick={() => setMode("calm")}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide transition-all ${
                  mode === "calm"
                    ? "bg-[#004E89] text-white shadow-md"
                    : "text-[#004E89] hover:bg-[#F7C59F]/20"
                }`}
              >
                Calm
              </button>
            </div>
            <Link
              href="/tasks?mode=combined"
              className="flex items-center justify-center rounded-lg p-2 bg-white border-2 border-[#004E89] text-[#004E89] transition-colors hover:bg-[#F7C59F]/10"
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

      {/* Main Layout */}
      <main className="flex-1 flex gap-4 p-4 overflow-hidden min-h-0">
        {mode === "calm" ? (
          <>
            {/* Left Column - Today's List (50%) */}
            <div className="w-1/2 rounded-2xl border border-[#004E89]/20 bg-white/90 p-6 shadow-lg flex flex-col min-h-0">
          <div className="mb-4 flex-shrink-0">
            <h2 className="text-2xl font-semibold text-[#004E89]">Today&apos;s List</h2>
            </div>

          <div className="flex-1 overflow-y-auto mb-4 min-h-0">
              {todayTasks.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-[#004E89]/20 bg-[#F7C59F]/10 p-8 text-center">
                <p className="text-sm text-[#004E89]/60">
                  No tasks for today. Add some tasks to get started!
                  </p>
                </div>
              ) : (
              <ul className="space-y-2">
                  {todayTasks.map((task) => (
                    <li
                      key={task.id}
                    className="flex items-center gap-3 rounded-xl border border-[#004E89]/20 bg-white p-3 transition-colors hover:bg-[#F7C59F]/10"
                    >
                      <input
                        type="checkbox"
                        checked={task.done}
                      onChange={() => handleTodayTaskToggle(task.id)}
                      className="h-4 w-4 cursor-pointer rounded border-[#004E89]/40 text-[#FF6B35] focus:ring-[#FF6B35]"
                      />
                      <div className="flex-1 min-w-0">
                        <p
                        className={`text-sm break-words ${
                          task.done ? "line-through text-[#004E89]/40" : "text-[#004E89]"
                          }`}
                        >
                          {task.text}
                        </p>
                      </div>
                      <button
                      onClick={() => handleRemoveTodayTask(task.id)}
                      className="flex-shrink-0 rounded p-1 text-[#004E89]/40 transition-colors hover:text-red-500"
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
          <div className="flex-shrink-0 border-t border-[#004E89]/10 pt-4 flex items-start gap-2">
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
              className="flex-1 rounded-lg border border-[#004E89]/20 bg-white px-3 py-2 text-base text-[#004E89] placeholder:text-[#004E89]/40 focus:border-[#FF6B35] focus:outline-none resize-none"
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
                  className="rounded-lg border border-[#004E89]/20 bg-white px-4 py-2 text-base font-medium text-[#004E89] transition-colors hover:bg-[#F7C59F]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  title="Break down task using AI"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
                    <path d="M15.98 1.804a1 1 0 0 0-1.96 0l-.24 1.192a1 1 0 0 1-.784.785l-1.192.238a1 1 0 0 0 0 1.962l1.192.238a1 1 0 0 1 .785.785l.238 1.192a1 1 0 0 0 1.962 0l.238-1.192a1 1 0 0 1 .785-.785l1.192-.238a1 1 0 0 0 0-1.962l-1.192-.238a1 1 0 0 1-.785-.785l-.238-1.192ZM6.949 5.684a1 1 0 0 0-1.898 0l-.683 2.051a1 1 0 0 1-.633.633l-2.051.683a1 1 0 0 0 0 1.898l2.051.684a1 1 0 0 1 .633.632l.683 2.051a1 1 0 0 0 1.898 0l.683-2.051a1 1 0 0 1 .633-.633l2.051-.683a1 1 0 0 0 0-1.898l-2.051-.683a1 1 0 0 1-.633-.633L6.95 5.684ZM13.949 13.684a1 1 0 0 0-1.898 0l-.184.551a1 1 0 0 1-.632.633l-.551.183a1 1 0 0 0 0 1.898l.551.183a1 1 0 0 1 .633.633l.183.551a1 1 0 0 0 1.898 0l.184-.551a1 1 0 0 1 .632-.633l.551-.183a1 1 0 0 0 0-1.898l-.551-.184a1 1 0 0 1-.633-.632l-.183-.551Z" />
                  </svg>
                </button>
              </div>
            </div>
              </div>

            {/* Right Column - Next Step (50%) */}
            <div className="w-1/2 rounded-2xl border-2 border-[#004E89]/20 bg-white p-12 flex flex-col min-h-0">
              <h2 className="text-4xl font-bold text-[#004E89] mb-8">Next Step</h2>

              {nextTask ? (
                <div className="space-y-6">
                  <div className="flex items-start gap-6">
                    <input
                      type="checkbox"
                      checked={nextTask.done}
                      onChange={() => handleTodayTaskToggle(nextTask.id)}
                      className="h-8 w-8 cursor-pointer rounded border-2 border-[#004E89]/60 bg-white text-[#004E89] focus:ring-2 focus:ring-[#004E89]/30 focus:border-[#004E89] checked:bg-[#004E89] checked:border-[#004E89] mt-1 transition-colors"
                    />
                    <p className="text-4xl font-medium text-[#004E89] leading-relaxed flex-1">
                      {nextTask.text}
                    </p>
                </div>
              </div>
              ) : (
                <div className="space-y-6">
                  <p className="text-4xl font-medium text-[#004E89]/60 leading-relaxed">
                    {todayTasks.length === 0 
                      ? "Let's get started!" 
                      : "All tasks completed! 🎉"}
                  </p>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Left Column - Today's List (50%) */}
            <div className="w-1/2 rounded-2xl border border-[#004E89]/20 bg-white/90 p-6 shadow-lg flex flex-col min-h-0">
              <div className="mb-4 flex-shrink-0">
                <h2 className="text-2xl font-semibold text-[#004E89]">Today&apos;s List</h2>
          </div>

              <div className="flex-1 overflow-y-auto mb-4 min-h-0">
              {todayTasks.length === 0 ? (
                  <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-[#004E89]/20 bg-[#F7C59F]/10 p-8 text-center">
                    <p className="text-sm text-[#004E89]/60">
                      No tasks for today. Add some tasks to get started!
                  </p>
                </div>
              ) : (
                <ul className="space-y-2">
                  {todayTasks.map((task) => (
                    <li
                      key={task.id}
                        className="flex items-center gap-3 rounded-xl border border-[#004E89]/20 bg-white p-3 transition-colors hover:bg-[#F7C59F]/10"
                    >
                      <input
                        type="checkbox"
                        checked={task.done}
                          onChange={() => handleTodayTaskToggle(task.id)}
                          className="h-4 w-4 cursor-pointer rounded border-[#004E89]/40 text-[#FF6B35] focus:ring-[#FF6B35]"
                      />
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm break-words ${
                              task.done ? "line-through text-[#004E89]/40" : "text-[#004E89]"
                          }`}
                        >
                          {task.text}
                        </p>
                      </div>
                      <button
                          onClick={() => handleRemoveTodayTask(task.id)}
                          className="flex-shrink-0 rounded p-1 text-[#004E89]/40 transition-colors hover:text-red-500"
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
              <div className="flex-shrink-0 border-t border-[#004E89]/10 pt-4 flex items-start gap-2">
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
                  className="flex-1 rounded-lg border border-[#004E89]/20 bg-white px-3 py-2 text-base text-[#004E89] placeholder:text-[#004E89]/40 focus:border-[#FF6B35] focus:outline-none resize-none"
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
                    className="rounded-lg border border-[#004E89]/20 bg-white px-4 py-2 text-base font-medium text-[#004E89] transition-colors hover:bg-[#F7C59F]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    title="Break down task using AI"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
                      <path d="M15.98 1.804a1 1 0 0 0-1.96 0l-.24 1.192a1 1 0 0 1-.784.785l-1.192.238a1 1 0 0 0 0 1.962l1.192.238a1 1 0 0 1 .785.785l.238 1.192a1 1 0 0 0 1.962 0l.238-1.192a1 1 0 0 1 .785-.785l1.192-.238a1 1 0 0 0 0-1.962l-1.192-.238a1 1 0 0 1-.785-.785l-.238-1.192ZM6.949 5.684a1 1 0 0 0-1.898 0l-.683 2.051a1 1 0 0 1-.633.633l-2.051.683a1 1 0 0 0 0 1.898l2.051.684a1 1 0 0 1 .633.632l.683 2.051a1 1 0 0 0 1.898 0l.683-2.051a1 1 0 0 1 .633-.633l2.051-.683a1 1 0 0 0 0-1.898l-2.051-.683a1 1 0 0 1-.633-.633L6.95 5.684ZM13.949 13.684a1 1 0 0 0-1.898 0l-.184.551a1 1 0 0 1-.632.633l-.551.183a1 1 0 0 0 0 1.898l.551.183a1 1 0 0 1 .633.633l.183.551a1 1 0 0 0 1.898 0l.184-.551a1 1 0 0 1 .632-.633l.551-.183a1 1 0 0 0 0-1.898l-.551-.184a1 1 0 0 1-.633-.632l-.183-.551Z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - Kanban Board (50%) */}
            <div className="w-1/2 flex gap-4 min-h-0">
          {/* TO DO Column */}
          <div className="flex-1 rounded-2xl border border-[#004E89]/20 bg-white/90 p-4 shadow-lg flex flex-col min-h-0">
            <h3 className="text-lg font-semibold text-[#004E89] mb-4 flex-shrink-0">TO DO</h3>
            <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
              {todoLists.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-[#004E89]/20 bg-[#F7C59F]/10 p-4 text-center">
                  <p className="text-xs text-[#004E89]/60">No tasks in TO DO</p>
          </div>
              ) : (
                todoLists.map((list) => {
                  const completedCount = list.tasks.filter((t) => t.done).length;
                  const totalCount = list.tasks.length;
                  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

                  return (
                    <div
                      key={list.id}
                      className="rounded-xl border border-[#004E89]/20 bg-white p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => {
                        // Toggle first incomplete task when clicking the card
                        const incompleteTask = list.tasks.find(t => !t.done);
                        if (incompleteTask) {
                          handleTaskToggle(list.id, incompleteTask.id);
                        }
                      }}
                    >
                      <h4 className="text-sm font-semibold text-[#004E89] mb-3 truncate">{list.name}</h4>
                      <div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-[#F7C59F]/30">
                          <div
                            className="h-full rounded-full bg-[#FF6B35] transition-all duration-500"
                            style={{ width: `${progress}%` }}
                          />
              </div>
                        <p className="text-xs text-[#004E89]/60 mt-1">{completedCount}/{totalCount} tasks</p>
                </div>
                    </div>
                  );
                })
              )}
            </div>
            </div>

          {/* Doing Column */}
          <div className="flex-1 rounded-2xl border border-[#004E89]/20 bg-white/90 p-4 shadow-lg flex flex-col min-h-0">
            <h3 className="text-lg font-semibold text-[#004E89] mb-4 flex-shrink-0">Doing</h3>
            <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
              {doingLists.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-[#004E89]/20 bg-[#F7C59F]/10 p-4 text-center">
                  <p className="text-xs text-[#004E89]/60">No tasks in progress</p>
                </div>
              ) : (
                doingLists.map((list) => {
                  const completedCount = list.tasks.filter((t) => t.done).length;
                  const totalCount = list.tasks.length;
                  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

                  return (
                    <div
                      key={list.id}
                      className="rounded-xl border border-[#004E89]/20 bg-white p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => {
                        // Toggle first incomplete task when clicking the card
                        const incompleteTask = list.tasks.find(t => !t.done);
                        if (incompleteTask) {
                          handleTaskToggle(list.id, incompleteTask.id);
                        }
                      }}
                    >
                      <h4 className="text-sm font-semibold text-[#004E89] mb-3 truncate">{list.name}</h4>
                      <div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-[#F7C59F]/30">
                          <div
                            className="h-full rounded-full bg-[#FF6B35] transition-all duration-500"
                            style={{ width: `${progress}%` }}
                      />
                    </div>
                        <p className="text-xs text-[#004E89]/60 mt-1">{completedCount}/{totalCount} tasks</p>
                  </div>
          </div>
                  );
                })
              )}
              </div>
            </div>

          {/* Done Column */}
          <div className="flex-1 rounded-2xl border border-[#004E89]/20 bg-white/90 p-4 shadow-lg flex flex-col min-h-0">
            <h3 className="text-lg font-semibold text-[#004E89] mb-4 flex-shrink-0">Done</h3>
            <div className="flex-1 overflow-y-auto space-y-3 min-h-0">
              {doneLists.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-[#004E89]/20 bg-[#F7C59F]/10 p-4 text-center">
                  <p className="text-xs text-[#004E89]/60">No completed tasks</p>
                </div>
              ) : (
                doneLists.map((list) => {
                  const completedCount = list.tasks.filter((t) => t.done).length;
                  const totalCount = list.tasks.length;
                  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

                  return (
                    <div
                      key={list.id}
                      className="rounded-xl border border-[#004E89]/20 bg-white p-4 shadow-sm opacity-75"
                    >
                      <h4 className="text-sm font-semibold text-[#004E89] mb-3 truncate">{list.name}</h4>
                      <div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-[#F7C59F]/30">
                          <div
                            className="h-full rounded-full bg-[#FF6B35] transition-all duration-500"
                            style={{ width: `${progress}%` }}
                  />
                </div>
                        <p className="text-xs text-[#004E89]/60 mt-1">{completedCount}/{totalCount} tasks</p>
              </div>
            </div>
                  );
                })
              )}
          </div>
            </div>
          </div>
          </>
      )}
      </main>

      <FocusModeModal isOpen={isFocusModalOpen} onClose={() => setIsFocusModalOpen(false)} mode="combined" />
      <AddTasksModal
        isOpen={isAddTasksModalOpen}
        onClose={() => setIsAddTasksModalOpen(false)}
        onAddTasks={handleAddTasks}
        existingTaskIds={existingTaskIds}
        mode="hyperactive"
        key={isAddTasksModalOpen ? "open" : "closed"}
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
