"use client";

import { useState, useEffect, useRef } from "react";
import { useTaskBreaker } from "@/hooks/useTaseBreaking";
import Link from "next/link";
import { awardXPForTask, revokeXPForTaskCompletion, penalizeXPForUncompletedTask } from "@/utils/gamification";
import FocusModeModal from "@/components/FocusModeModal";
import AddTasksModal from "@/components/AddTasksModal";
import BreakTasksModal from "@/components/BreakTasksModal";
import { periwinklePalette, type ColorPalette } from "@/components/TaskListDrawer";
import JSConfetti from "js-confetti";

const STORAGE_KEY = "adhd-task-lists-inattentive";
const TODAY_TASKS_KEY = "adhd-today-tasks-inattentive";

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

export default function InattentivePage() {
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
  const [isAddTasksModalOpen, setIsAddTasksModalOpen] = useState(false);
  const [isBreakTasksModalOpen, setIsBreakTasksModalOpen] = useState(false);
  const [brokenTasks, setBrokenTasks] = useState<string[]>([]);
  const [originalTaskText, setOriginalTaskText] = useState<string>("");
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const nextTaskId = useRef(1);
  const nextListId = useRef(1);
  const confettiRef = useRef<JSConfetti | null>(null);
  const hasTriggeredConfettiRef = useRef(false);
  const { breakTask, isBreaking, error } = useTaskBreaker("inattentive");

  // Use periwinkle palette for inattentive type
  const colorPalette: ColorPalette = periwinklePalette;

  // Initialize confetti
  useEffect(() => {
    if (typeof window !== "undefined") {
      confettiRef.current = new JSConfetti();
    }
  }, []);


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

      // Load task lists (for AddTasksModal, but don't sync today's tasks to them)
      const savedLists = window.localStorage.getItem(STORAGE_KEY);
      if (savedLists) {
        const parsed = JSON.parse(savedLists);
        setTaskLists(parsed || []);

        // Initialize nextTaskId and nextListId from existing lists to avoid ID conflicts
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

    window.addEventListener("taskCompleted", handleTaskUpdate);
    window.addEventListener("storage", handleTaskUpdate);

    return () => {
      window.removeEventListener("taskCompleted", handleTaskUpdate);
      window.removeEventListener("storage", handleTaskUpdate);
    };
  }, []);

  // Save today's tasks to localStorage (separate storage, not synced to task lists)
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
    setTodayTasks((tasks) => {
      if (typeof window !== "undefined") {
        const task = tasks.find((t) => t.id === taskId);
        // Apply a small penalty only if the task was never completed
        if (task && !task.done) {
          penalizeXPForUncompletedTask();
          window.dispatchEvent(new CustomEvent("taskCompleted"));
        }
      }
      return tasks.filter((task) => task.id !== taskId);
    });
  };

  const handleAddTasks = (tasks: Array<{ id: number; text: string; done: boolean; sourceListId?: number; sourceListName?: string }>) => {
    // Filter out tasks that already exist to prevent duplicates
    setTodayTasks((prev) => {
      const existingIds = new Set(prev.map(t => t.id));
      const newTasks = tasks.filter(t => !existingIds.has(t.id));
      // Add new tasks to the beginning so they appear in "Next Step" first
      return [...newTasks, ...prev];
    });
  };

  const addTask = (text: string) => {
    const t = text.trim();
    if (!t) return;
    const newTask: Task = { id: nextTaskId.current++, text: t, done: false };
    setTodayTasks((prev) => [...prev, newTask]);
    setInput("");
    inputRef.current?.focus();
  };

  const handleBreakTasks = async (text: string) => {
    const taskText = text.trim();
    if (!taskText) return;
    
    setOriginalTaskText(taskText);
    setIsBreakTasksModalOpen(true);
    
    try {
      const subTasks = await breakTask(taskText, "inattentive");
      console.log("inattentive page: subTasks", subTasks);
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

  // Get the next incomplete task (first task that's not done)
  const nextTask = todayTasks.find((t) => !t.done);

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

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Navigation */}
      <nav className="border-b border-[#7085FF]/10 bg-white/90 backdrop-blur-sm">
        <div className="flex items-center justify-between px-8 py-2">
          <Link href="/inattentive" className="text-[#7085FF] transition-colors hover:text-[#5A75FF]">
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
          </Link>
          <div className="flex items-center gap-6">
            <Link
              href="/tasks?mode=inattentive"
              className="flex items-center justify-center rounded-xl p-2 bg-white border-2 border-[#7085FF] text-[#7085FF] transition-colors hover:bg-[#7085FF]/10"
              title="Task Manager"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" className="h-4 w-4">
                <path d="M152.1 38.2c9.9 8.9 10.7 24 1.8 33.9l-72 80c-4.4 4.9-10.6 7.8-17.2 7.9s-12.9-2.4-17.6-7L7 113C-2.3 103.6-2.3 88.4 7 79s24.6-9.4 33.9 0l22.1 22.1 55.1-61.2c8.9-9.9 24-10.7 33.9-1.8zm0 160c9.9 8.9 10.7 24 1.8 33.9l-72 80c-4.4 4.9-10.6 7.8-17.2 7.9s-12.9-2.4-17.6-7L7 273c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l22.1 22.1 55.1-61.2c8.9-9.9 24-10.7 33.9-1.8zM224 96c0-17.7 14.3-32 32-32H480c17.7 0 32 14.3 32 32s-14.3 32-32 32H256c-17.7 0-32-14.3-32-32zm0 160c0-17.7 14.3-32 32-32H480c17.7 0 32 14.3 32 32s-14.3 32-32 32H256c-17.7 0-32-14.3-32-32zM160 416c0-17.7 14.3-32 32-32H480c17.7 0 32 14.3 32 32s-14.3 32-32 32H192c-17.7 0-32-14.3-32-32zM48 368a48 48 0 1 1 0 96 48 48 0 1 1 0-96z"/>
              </svg>
            </Link>
            <button
              onClick={() => setIsFocusModalOpen(true)}
              className="flex items-center justify-center rounded-xl p-2 bg-white border-2 border-[#7085FF] text-[#7085FF] transition-colors hover:bg-[#7085FF]/10"
              title="Focus Mode"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" className="h-4 w-4">
                <path d="M448 256A192 192 0 1 0 64 256a192 192 0 1 0 384 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zm256 80a80 80 0 1 0 0-160 80 80 0 1 0 0 160zm0-224a144 144 0 1 1 0 288 144 144 0 1 1 0-288zM224 256a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z"/>
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* 2 Column Layout - Simplified for Inattentive Type */}
      <main className="flex h-[calc(100vh-65px)] gap-8 p-8">
        {/* Left Column - Today's List */}
        <div className="flex-1 rounded-3xl border-2 border-[#7085FF]/20 bg-white p-12 flex flex-col">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-4xl font-bold text-gray-900">Today&apos;s List</h2>
            </div>
            <p className="text-2xl text-gray-700">
              {completedToday} of {totalToday} completed
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {todayTasks.length === 0 ? (
              <div 
                onClick={() => inputRef.current?.focus()}
                className="flex h-full items-center justify-center rounded-xl border-2 border-dashed border-[#7085FF]/20 bg-[#7085FF]/5 p-12 text-center cursor-pointer transition-colors hover:bg-[#7085FF]/10"
              >
                <p className="text-2xl text-gray-700">
                  Let's add some tasks!
                </p>
              </div>
            ) : (
              <ul className="space-y-4">
                {todayTasks.map((task) => (
                  <li
                    key={task.id}
                    className={`flex items-start gap-4 rounded-xl border-2 p-4 cursor-pointer transition-colors ${
                      task.done
                        ? "border-[#7085FF]/40 bg-[#7085FF]/5"
                        : "border-[#7085FF] bg-white hover:bg-[#7085FF]/10"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={task.done}
                      onChange={() => handleTaskToggle(task.id)}
                      className="h-8 w-8 cursor-pointer rounded border-2 border-[#7085FF]/60 bg-white text-[#7085FF] focus:ring-2 focus:ring-[#7085FF]/30 focus:border-[#7085FF] checked:bg-[#7085FF] checked:border-[#7085FF] mt-1 transition-colors"
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-2xl leading-relaxed ${task.done ? "line-through text-gray-400" : "text-gray-900"
                          }`}
                      >
                        {task.text}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveTask(task.id)}
                      className="flex-shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:text-red-500"
                      aria-label="Remove task"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="h-6 w-6"
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

          {/* Input area - Small and Simple */}
          <div className="mt-6 border-t border-[#7085FF]/10 pt-4 flex items-center gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTask(input);
                }
              }}
              placeholder="Add task..."
              className="flex-1 rounded-lg border border-[#7085FF]/20 bg-white px-3 py-2 text-base text-gray-900 placeholder:text-gray-400 focus:border-[#7085FF] focus:outline-none"
            />
            <button
              onClick={() => addTask(input)}
              className={`rounded-lg ${colorPalette.accent} px-4 py-2 text-base font-medium text-white transition ${colorPalette.accentHover}`}
            >
              Add
            </button>
            <button
              onClick={() => handleBreakTasks(input)} 
              disabled={isBreaking}
              title={isBreaking ? "Breaking down task..." : "Break down task"}
              className={`text-base font-medium border-2 border-[#7085FF] text-[#7085FF] px-4 py-2 rounded-lg transition-colors hover:bg-[#7085FF]/10`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                <path d="M15.98 1.804a1 1 0 0 0-1.96 0l-.24 1.192a1 1 0 0 1-.784.785l-1.192.238a1 1 0 0 0 0 1.962l1.192.238a1 1 0 0 1 .785.785l.238 1.192a1 1 0 0 0 1.962 0l.238-1.192a1 1 0 0 1 .785-.785l1.192-.238a1 1 0 0 0 0-1.962l-1.192-.238a1 1 0 0 1-.785-.785l-.238-1.192ZM6.949 5.684a1 1 0 0 0-1.898 0l-.683 2.051a1 1 0 0 1-.633.633l-2.051.683a1 1 0 0 0 0 1.898l2.051.684a1 1 0 0 1 .633.632l.683 2.051a1 1 0 0 0 1.898 0l.683-2.051a1 1 0 0 1 .633-.633l2.051-.683a1 1 0 0 0 0-1.898l-2.051-.683a1 1 0 0 1-.633-.633L6.95 5.684ZM13.949 13.684a1 1 0 0 0-1.898 0l-.184.551a1 1 0 0 1-.632.633l-.551.183a1 1 0 0 0 0 1.898l.551.183a1 1 0 0 1 .633.633l.183.551a1 1 0 0 0 1.898 0l.184-.551a1 1 0 0 1 .632-.633l.551-.183a1 1 0 0 0 0-1.898l-.551-.184a1 1 0 0 1-.633-.632l-.183-.551Z" />
              </svg>

            </button>
          </div>
        </div>

        {/* Right Column - Next Step */}
        <div className="flex-1 rounded-3xl border-2 border-[#7085FF]/20 bg-white p-12 flex flex-col justify-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-8">Next Step</h2>

          {nextTask ? (
            <div className="space-y-6">
              <div className="flex items-start gap-6">
                <input
                  type="checkbox"
                  checked={nextTask.done}
                  onChange={() => handleTaskToggle(nextTask.id)}
                  className="h-8 w-8 cursor-pointer rounded border-2 border-[#7085FF]/60 bg-white text-[#7085FF] focus:ring-2 focus:ring-[#7085FF]/30 focus:border-[#7085FF] checked:bg-[#7085FF] checked:border-[#7085FF] mt-1 transition-colors"
                />
                <p className="text-3xl font-medium text-gray-900 leading-relaxed flex-1">
                  {nextTask.text}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <p className="text-3xl font-medium text-gray-400 leading-relaxed">
                {todayTasks.length === 0
                  ? "Lets get started!"
                  : "All tasks completed! 🎉"}
              </p>
            </div>
          )}
        </div>
      </main>

      <FocusModeModal isOpen={isFocusModalOpen} onClose={() => setIsFocusModalOpen(false)} mode="inattentive" />
      <AddTasksModal
        isOpen={isAddTasksModalOpen}
        onClose={() => setIsAddTasksModalOpen(false)}
        onAddTasks={handleAddTasks}
        existingTaskIds={existingTaskIds}
        mode="inattentive"
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
