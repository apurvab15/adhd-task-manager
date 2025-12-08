"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import FocusModeModal from "@/components/FocusModeModal";
import BreakTasksModal from "@/components/BreakTasksModal";
import { violetPalette, periwinklePalette, combinedPalette, inattentivePalette, hyperactivePalette, type ColorPalette } from "@/components/TaskListDrawer";
import { useTaskBreaker } from "@/hooks/useTaseBreaking";
import { awardXPForTask, revokeXPForTaskCompletion } from "@/utils/gamification";

type Mode = "inattentive" | "hyperactive" | "combined";

type Task = {
  id: number;
  text: string;
  done: boolean;
};

type TaskList = {
  id: number;
  name: string;
  tasks: Task[];
};

export default function TasksPage() {
  return (
    <Suspense fallback={null}>
      <TasksPageData />
    </Suspense>
  );
}

export function TasksPageData() {
  const searchParams = useSearchParams();
  const modeParam = searchParams.get("mode");
  const mode: Mode = (modeParam === "inattentive" || modeParam === "hyperactive" || modeParam === "combined") 
    ? modeParam 
    : "hyperactive";
  
  const colorPalette: ColorPalette = 
    mode === "inattentive" ? inattentivePalette :
    mode === "combined" ? combinedPalette :
    hyperactivePalette;
  
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [currentListId, setCurrentListId] = useState<number | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [input, setInput] = useState("");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState("");
  const [isBreakTasksModalOpen, setIsBreakTasksModalOpen] = useState(false);
  const [brokenTasks, setBrokenTasks] = useState<string[]>([]);
  const [originalTaskText, setOriginalTaskText] = useState<string>("");
  
  // Input is a textarea (multi-line), so use the matching ref type
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const nextTaskId = useRef(1);
  const nextListId = useRef(1);
  const isUpdatingFromExternal = useRef(false);
  const taskListsRef = useRef<TaskList[]>([]);
  const { breakTask, isBreaking } = useTaskBreaker(mode);

  const getStorageKey = () => {
    if (mode === "inattentive") return "adhd-task-lists-inattentive";
    if (mode === "hyperactive") return "adhd-task-lists-hyperactive";
    return "adhd-task-lists-combined";
  };

  // Load data from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const storageKey = getStorageKey();
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as TaskList[];
        if (parsed.length > 0) {
          setTaskLists(parsed);
          setCurrentListId(parsed[0].id);
          const maxListId = Math.max(...parsed.map((list) => list.id));
          nextListId.current = maxListId + 1;
          const allTasks = parsed.flatMap((list) => list.tasks);
          if (allTasks.length > 0) {
            const maxTaskId = Math.max(...allTasks.map((task) => task.id));
            nextTaskId.current = maxTaskId + 1;
          }
        } else {
          // Create a default list if none exist
          const defaultList: TaskList = {
            id: 1,
            name: "My Tasks",
            tasks: [],
          };
          setTaskLists([defaultList]);
          setCurrentListId(1);
          nextListId.current = 2;
        }
      } else {
        // Create a default list if none exist
        const defaultList: TaskList = {
          id: 1,
          name: "My Tasks",
          tasks: [],
        };
        setTaskLists([defaultList]);
        setCurrentListId(1);
        nextListId.current = 2;
      }
    } catch (error) {
      console.error("Error loading data:", error);
      // Create a default list on error
      const defaultList: TaskList = {
        id: 1,
        name: "My Tasks",
        tasks: [],
      };
      setTaskLists([defaultList]);
      setCurrentListId(1);
      nextListId.current = 2;
    }

    setIsHydrated(true);
  }, [mode]);

  // Update ref whenever taskLists changes
  useEffect(() => {
    taskListsRef.current = taskLists;
  }, [taskLists]);

  // Save task lists to localStorage
  useEffect(() => {
    if (!isHydrated || typeof window === "undefined") return;
    // Skip if we're updating from external source to prevent infinite loop
    if (isUpdatingFromExternal.current) {
      isUpdatingFromExternal.current = false;
      return;
    }
    const storageKey = getStorageKey();
    window.localStorage.setItem(storageKey, JSON.stringify(taskLists));
    // Dispatch event to notify other pages of changes
    window.dispatchEvent(new CustomEvent("taskListUpdated"));
  }, [taskLists, isHydrated, mode]);

  // Listen for task list updates from focus mode or other pages
  useEffect(() => {
    if (typeof window === "undefined" || !isHydrated) return;

    const handleTaskListUpdate = () => {
      try {
        const storageKey = getStorageKey();
        const saved = window.localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved) as TaskList[];
          // Check if data actually changed to prevent unnecessary updates
          // Use ref to get current value without adding to dependencies
          const currentData = JSON.stringify(taskListsRef.current);
          const newData = JSON.stringify(parsed);
          if (currentData === newData) {
            return; // No change, skip update
          }
          
          if (parsed.length > 0) {
            isUpdatingFromExternal.current = true; // Mark as external update
            setTaskLists(parsed);
            // Update currentListId if needed
            if (!currentListId || !parsed.some((list) => list.id === currentListId)) {
              setCurrentListId(parsed[0].id);
            }
            // Update next IDs
            const maxListId = Math.max(...parsed.map((list) => list.id));
            nextListId.current = maxListId + 1;
            const allTasks = parsed.flatMap((list) => list.tasks);
            if (allTasks.length > 0) {
              const maxTaskId = Math.max(...allTasks.map((task) => task.id));
              nextTaskId.current = maxTaskId + 1;
            }
          }
        }
      } catch (error) {
        console.error("Error refreshing task lists:", error);
      }
    };

    window.addEventListener("taskListUpdated", handleTaskListUpdate);
    window.addEventListener("storage", handleTaskListUpdate);

    return () => {
      window.removeEventListener("taskListUpdated", handleTaskListUpdate);
      window.removeEventListener("storage", handleTaskListUpdate);
    };
  }, [isHydrated, mode, currentListId]);

  // Ensure currentListId is valid
  useEffect(() => {
    if (taskLists.length > 0 && (!currentListId || !taskLists.some((list) => list.id === currentListId))) {
      setCurrentListId(taskLists[0].id);
    }
  }, [taskLists, currentListId]);

  const currentList = taskLists.find((list) => list.id === currentListId) || taskLists[0];

  // Get home URL based on mode
  const getHomeUrl = () => {
    if (mode === "inattentive") return "/inattentive";
    if (mode === "hyperactive") return "/hyperactive";
    if (mode === "combined") return "/combined";
    return "/home";
  };

  // Task list management
  const createNewList = () => {
    const newList: TaskList = {
      id: nextListId.current++,
      name: `Task List ${taskLists.length + 1}`,
      tasks: [],
    };
    setTaskLists((lists) => [...lists, newList]);
    setCurrentListId(newList.id);
  };

  const deleteList = (listId: number) => {
    if (taskLists.length <= 1) {
      // Don't allow deleting the last list
      return;
    }
    setTaskLists((lists) => {
      const filtered = lists.filter((list) => list.id !== listId);
      // If we deleted the current list, switch to the first remaining list
      if (listId === currentListId && filtered.length > 0) {
        setCurrentListId(filtered[0].id);
      }
      return filtered;
    });
  };

  const selectList = (listId: number) => {
    setCurrentListId(listId);
  };

  // Task management
  const addTask = (text: string) => {
    const t = text.trim();
    if (!t || !currentListId) return;
    const newTask: Task = { id: nextTaskId.current++, text: t, done: false };
    setTaskLists((lists) =>
      lists.map((list) =>
        list.id === currentListId
          ? { ...list, tasks: [...list.tasks, newTask] }
          : list
      )
    );
    setInput("");
    inputRef.current?.focus();
  };

  const handleBreakTasks = async (text: string) => {
    const taskText = text.trim();
    if (!taskText) return;
    
    setOriginalTaskText(taskText);
    setIsBreakTasksModalOpen(true);
    
    try {
      const subTasks = await breakTask(taskText, mode);
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
    if (brokenTasksList.length === 0 || !currentListId) return;

    const validTasks = brokenTasksList.filter((t) => t.text.trim() !== "");
    if (validTasks.length === 0) return;

    // Generate unique IDs for tasks
    const tasksWithIds = validTasks.map((task) => ({
      id: nextTaskId.current++,
      text: task.text.trim(),
      done: false,
    }));

    setTaskLists((lists) =>
      lists.map((list) =>
        list.id === currentListId
          ? { ...list, tasks: [...list.tasks, ...tasksWithIds] }
          : list
      )
    );

    // Clean up
    setBrokenTasks([]);
    setOriginalTaskText("");
    setIsBreakTasksModalOpen(false);
    setInput("");
    inputRef.current?.focus();
  };

  const toggleDone = (taskId: number) => {
    if (!currentListId) return;
    setTaskLists((lists) => {
      const currentList = lists.find((list) => list.id === currentListId);
      const task = currentList?.tasks.find((t) => t.id === taskId);
      
      if (!task || typeof window === "undefined") {
        return lists.map((list) =>
          list.id === currentListId
            ? {
                ...list,
                tasks: (() => {
                  const updatedTasks = list.tasks.map((t) =>
                    t.id === taskId ? { ...t, done: !t.done } : t
                  );
                  const incomplete = updatedTasks.filter((t) => !t.done);
                  const completed = updatedTasks.filter((t) => t.done);
                  return [...incomplete, ...completed];
                })(),
              }
            : list
        );
      }

      const newDone = !task.done;

      // Sync with today's tasks
      try {
        const todayTasksKey = 
          mode === "inattentive" ? "adhd-today-tasks-inattentive" :
          mode === "combined" ? "adhd-today-tasks-combined" :
          "adhd-today-tasks-hyperactive";
        
        const savedTodayTasks = window.localStorage.getItem(todayTasksKey);
        if (savedTodayTasks) {
          const parsed = JSON.parse(savedTodayTasks);
          const today = new Date().toDateString();
          if (parsed.date === today) {
            const todayTasks = parsed.tasks || [];
            const todayTaskIndex = todayTasks.findIndex((t: { id: number }) => t.id === taskId);
            
            if (todayTaskIndex !== -1) {
              // Task exists in today's list, update it
              todayTasks[todayTaskIndex] = { ...todayTasks[todayTaskIndex], done: newDone };
              window.localStorage.setItem(
                todayTasksKey,
                JSON.stringify({ date: today, tasks: todayTasks })
              );
              window.dispatchEvent(new CustomEvent("todayTasksUpdated"));
            }
          }
        }
      } catch (error) {
        console.error("Error syncing with today's tasks:", error);
      }

      // Sync with focus mode (update completedTaskIds in focus mode storage)
      try {
        const focusModeTasksKey = "adhd-focus-mode-tasks";
        const savedFocusTasks = window.localStorage.getItem(focusModeTasksKey);
        if (savedFocusTasks) {
          const focusTasks = JSON.parse(savedFocusTasks) as Array<{ id: number; text: string }>;
          const focusTask = focusTasks.find((t) => t.id === taskId);
          if (focusTask) {
            // Task exists in focus mode, but focus mode doesn't store done status
            // Instead, we need to update the completedTaskIds in focus mode
            // Since focus mode uses a Set, we can't directly update it from here
            // But we dispatch an event that focus mode can listen to
            window.dispatchEvent(new CustomEvent("focusModeTaskToggled", { 
              detail: { taskId, done: newDone } 
            }));
          }
        }
      } catch (error) {
        console.error("Error syncing with focus mode:", error);
      }

      // Handle gamification for hyperactive mode
      if (mode === "hyperactive") {
        if (newDone && !task.done) {
          // Marking as done – award XP
          awardXPForTask();
        } else if (!newDone && task.done) {
          // Unchecking a completed task – revoke XP
          revokeXPForTaskCompletion();
        }
        window.dispatchEvent(new CustomEvent("taskCompleted"));
      }

      const updatedLists = lists.map((list) =>
        list.id === currentListId
          ? {
              ...list,
              tasks: (() => {
                const updatedTasks = list.tasks.map((t) =>
                  t.id === taskId ? { ...t, done: newDone } : t
                );
                const incomplete = updatedTasks.filter((t) => !t.done);
                const completed = updatedTasks.filter((t) => t.done);
                return [...incomplete, ...completed];
              })(),
            }
          : list
      );

      // Dispatch event to notify other pages of the task list update
      window.dispatchEvent(new CustomEvent("taskListUpdated"));

      return updatedLists;
    });
  };

  const removeTask = (taskId: number) => {
    if (!currentListId) return;
    setTaskLists((lists) =>
      lists.map((list) =>
        list.id === currentListId
          ? { ...list, tasks: list.tasks.filter((t) => t.id !== taskId) }
          : list
      )
    );
  };

  // Title editing
  const startEditingTitle = () => {
    if (currentList) {
      setEditingTitle(currentList.name);
      setIsEditingTitle(true);
      setTimeout(() => titleInputRef.current?.focus(), 0);
    }
  };

  const saveTitle = () => {
    if (!currentListId) return;
    const trimmed = editingTitle.trim();
    if (trimmed) {
      setTaskLists((lists) =>
        lists.map((list) =>
          list.id === currentListId ? { ...list, name: trimmed } : list
        )
      );
    }
    setIsEditingTitle(false);
  };

  const cancelEditingTitle = () => {
    setIsEditingTitle(false);
    setEditingTitle("");
  };

  // Calculate progress for a list
  const getProgress = (list: TaskList) => {
    if (list.tasks.length === 0) return 0;
    const completed = list.tasks.filter((t) => t.done).length;
    return (completed / list.tasks.length) * 100;
  };

  if (!isHydrated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  // Background and styling based on mode
  const backgroundClass = mode === "combined" 
    ? "bg-gradient-to-br from-[#EFEFD0] via-[#F7C59F]/20 to-[#EFEFD0]"
    : mode === "inattentive"
    ? `bg-gradient-to-br ${colorPalette.bg}`
    : "bg-gradient-to-b from-[#FFAF91] via-[#FFD1BF] to-[#FEF2EC]";
  
  const navBorderClass = mode === "combined"
    ? "border-[#004E89]/10"
    : mode === "inattentive"
    ? colorPalette.borderLight
    : colorPalette.borderLight;

  const navTextClass = mode === "combined"
    ? "text-[#004E89]"
    : mode === "inattentive"
    ? colorPalette.textDark
    : colorPalette.textDark;

  const columnBgClass = mode === "combined"
    ? "bg-white/90"
    : "bg-white/90";

  const columnBorderClass = mode === "combined"
    ? "border-[#004E89]/20"
    : mode === "inattentive"
    ? colorPalette.border
    : colorPalette.borderLight;

  return (
    <div className={`h-screen overflow-hidden ${backgroundClass} flex flex-col`}>
      {/* Navigation Bar */}
      <nav className={`flex-shrink-0 border-b ${navBorderClass} bg-white/90 backdrop-blur-sm`}>
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left side - Task Manager icon + text */}
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor" className={`h-6 w-6 ${navTextClass}`}>
              <path d="M152.1 38.2c9.9 8.9 10.7 24 1.8 33.9l-72 80c-4.4 4.9-10.6 7.8-17.2 7.9s-12.9-2.4-17.6-7L7 113C-2.3 103.6-2.3 88.4 7 79s24.6-9.4 33.9 0l22.1 22.1 55.1-61.2c8.9-9.9 24-10.7 33.9-1.8zm0 160c9.9 8.9 10.7 24 1.8 33.9l-72 80c-4.4 4.9-10.6 7.8-17.2 7.9s-12.9-2.4-17.6-7L7 273c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l22.1 22.1 55.1-61.2c8.9-9.9 24-10.7 33.9-1.8zM224 96c0-17.7 14.3-32 32-32H480c17.7 0 32 14.3 32 32s-14.3 32-32 32H256c-17.7 0-32-14.3-32-32zm0 160c0-17.7 14.3-32 32-32H480c17.7 0 32 14.3 32 32s-14.3 32-32 32H256c-17.7 0-32-14.3-32-32zM160 416c0-17.7 14.3-32 32-32H480c17.7 0 32 14.3 32 32s-14.3 32-32 32H192c-17.7 0-32-14.3-32-32zM48 368a48 48 0 1 1 0 96 48 48 0 1 1 0-96z"/>
            </svg>
            <span className={`text-lg font-semibold ${navTextClass}`}>Task Manager</span>
          </div>
          
          {/* Right side - Home + Focus Mode button */}
          <div className="flex items-center gap-3">
            <Link
              href={getHomeUrl()}
              className={`flex items-center justify-center rounded-lg p-2 bg-white border-2 ${
                mode === "combined" 
                  ? "border-[#004E89] text-[#004E89] hover:bg-[#F7C59F]/10"
                  : mode === "inattentive"
                  ? `${colorPalette.accent.replace('bg-', 'border-')} ${colorPalette.accent.replace('bg-', 'text-')} ${colorPalette.accentLight.replace('bg-', 'hover:bg-')}`
                  : "border-[#004E89] text-[#004E89] hover:bg-[#FFD1BF]/50"
              } transition-colors`}
              title="Home"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path
                  fillRule="evenodd"
                  d="M9.293 2.293a1 1 0 0 1 1.414 0l7 7A1 1 0 0 1 17 11h-1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6H3a1 1 0 0 1-.707-1.707l7-7Z"
                  clipRule="evenodd"
                />
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

      {/* Main Layout - Two Columns */}
      <main className="flex-1 flex gap-4 p-4 overflow-hidden min-h-0">
        {/* Left Column - Task Lists (30%) */}
        <div className={`w-[30%] rounded-2xl border ${columnBorderClass} ${columnBgClass} p-4 shadow-lg flex flex-col min-h-0`}>
          <div className="mb-4 flex-shrink-0">
            <h2 className={`text-lg font-semibold ${mode === "combined" ? "text-[#004E89]" : mode === "inattentive" ? colorPalette.textDark : "text-gray-900"}`}>Task Lists</h2>
          </div>

          {/* Scrollable list of task list cards */}
          <div className="flex-1 overflow-y-auto mb-4 min-h-0 space-y-3">
            {taskLists.map((list) => {
              const progress = getProgress(list);
              const completedCount = list.tasks.filter((t) => t.done).length;
              const totalCount = list.tasks.length;
              const isSelected = list.id === currentListId;

              return (
                <div
                  key={list.id}
                  onClick={() => selectList(list.id)}
                  className={`group rounded-xl border-2 p-4 cursor-pointer transition-all ${
                    isSelected
                      ? "border-[#004E89]/30 bg-white shadow-md"
                      : mode === "combined"
                      ? "border-[#004E89]/20 bg-white hover:border-[#004E89]/30 hover:shadow-md"
                      : mode === "inattentive"
                      ? "border-[#004E89]/20 bg-white hover:border-[#004E89]/30 hover:shadow-md"
                      : "border-[#004E89]/20 bg-white hover:border-[#004E89]/30 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className={`font-semibold text-sm flex-1 truncate ${
                      isSelected 
                        ? mode === "combined" 
                          ? "text-[#004E89]" 
                          : colorPalette.textDark 
                        : mode === "combined"
                        ? "text-[#004E89]"
                        : mode === "inattentive"
                        ? colorPalette.textDark
                        : "text-gray-900"
                    }`}>
                      {list.name}
                    </h3>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (taskLists.length > 1) {
                          deleteList(list.id);
                        } else {
                          alert("Cannot delete the last task list. Please create another list first.");
                        }
                      }}
                      className="flex-shrink-0 ml-2 p-1 rounded text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                      title={taskLists.length > 1 ? "Delete list" : "Cannot delete the last list"}
                      disabled={taskLists.length === 1}
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
                  </div>
                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className={`h-2 w-full overflow-hidden rounded-full ${
                      mode === "combined" ? "bg-[#F7C59F]/30" : mode === "inattentive" ? colorPalette.accentLight : "bg-gray-200"
                    }`}>
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          mode === "combined"
                            ? "bg-[#FF6B35]"
                            : mode === "hyperactive"
                            ? isSelected
                              ? "bg-gradient-to-r from-[#004E89] to-[#1A659E]"
                              : "bg-gray-400"
                            : isSelected 
                            ? colorPalette.accent 
                            : "bg-gray-400"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className={`text-xs ${
                      mode === "combined" ? "text-[#004E89]/60" : mode === "inattentive" ? colorPalette.textMuted : "text-gray-500"
                    }`}>
                      {completedCount}/{totalCount} tasks
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add New List Button */}
          <button
            onClick={createNewList}
            className={`flex-shrink-0 flex items-center justify-center gap-2 rounded-xl ${colorPalette.accent} px-4 py-2 font-medium text-white transition-colors ${colorPalette.accentHover}`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
            </svg>
            Add New List
          </button>
        </div>

        {/* Right Column - Selected Task List (70%) */}
        <div className={`flex-1 rounded-2xl border ${columnBorderClass} ${columnBgClass} p-6 shadow-lg flex flex-col min-h-0`}>
          {currentList ? (
            <>
              {/* Editable title with pencil icon */}
              <div className="flex items-center mb-4 flex-shrink-0">
                {isEditingTitle ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      ref={titleInputRef}
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onBlur={saveTitle}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          saveTitle();
                        } else if (e.key === "Escape") {
                          cancelEditingTitle();
                        }
                      }}
                      className={`flex-1 text-xl font-semibold ${colorPalette.textDark} bg-transparent border-b-2 ${colorPalette.accent.replace('bg-', 'border-')} focus:outline-none px-1`}
                    />
                  </div>
                ) : (
                  <div className={`flex items-center gap-2 ${colorPalette.textDark}`}>
                    <h2 className={`text-xl font-semibold ${colorPalette.textDark}`}>{currentList.name}</h2>
                    <button
                      onClick={startEditingTitle}
                      className={`p-1 rounded ${colorPalette.text} ${colorPalette.accentLight.replace('bg-', 'hover:bg-')} transition-colors`}
                      title="Edit title"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-4 h-4"
                      >
                        <path d="m2.695 14.762-1.262 3.155a.5.5 0 0 0 .65.65l3.155-1.262a4 4 0 0 0 1.343-.886L17.5 5.5a2.121 2.121 0 0 0-3-3L3.58 13.419a4 4 0 0 0-.885 1.343Z" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Scrollable task list */}
              <div className="flex-1 overflow-y-auto mb-4 min-h-0">
                {currentList.tasks.length === 0 ? (
                  <div className={`flex h-full items-center justify-center rounded-xl border border-dashed ${
                    mode === "combined" ? "border-[#004E89]/20 bg-[#F7C59F]/10" : mode === "inattentive" ? `${colorPalette.border} ${colorPalette.accentLight}` : "border-gray-200 bg-gray-50"
                  } p-8 text-center`}>
                    <p className={`text-sm ${mode === "combined" ? "text-[#004E89]/60" : colorPalette.textMuted}`}>
                      No tasks yet — add one!
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {currentList.tasks.map((task) => (
                      <li
                        key={task.id}
                        className={`flex items-center gap-3 rounded-xl border ${
                          mode === "combined" 
                            ? "border-[#004E89]/20 bg-white hover:bg-[#F7C59F]/10" 
                            : mode === "inattentive"
                            ? `${colorPalette.border} bg-white ${colorPalette.hoverBg}`
                            : `${colorPalette.border} bg-white hover:shadow-sm`
                        } p-3 transition-colors`}
                      >
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={() => toggleDone(task.id)}
                          className={`h-4 w-4 cursor-pointer rounded ${
                            mode === "combined"
                              ? "border-[#004E89]/40 text-[#FF6B35] focus:ring-[#FF6B35]"
                              : mode === "inattentive"
                              ? "border-[#7C83BC]/40 text-[#665FD1] focus:ring-[#665FD1]"
                              : `${colorPalette.borderLight.replace('border-', 'border-')} ${colorPalette.accent.replace('bg-', 'text-')} focus:ring-${colorPalette.accent.replace('bg-', '')}`
                          }`}
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm break-words ${
                              task.done 
                                ? `line-through ${mode === "combined" ? "text-[#004E89]/40" : colorPalette.textMuted}` 
                                : mode === "combined"
                                ? "text-[#004E89]"
                                : colorPalette.text
                            }`}
                          >
                            {task.text}
                          </p>
                        </div>
                        <button
                          onClick={() => removeTask(task.id)}
                          className={`flex-shrink-0 rounded p-1 ${
                            mode === "combined" ? "text-[#004E89]/40" : mode === "inattentive" ? colorPalette.textMuted : "text-gray-400"
                          } transition-colors hover:text-red-500`}
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

              {/* Input area with Add and Break Task buttons */}
              <div className={`flex-shrink-0 border-t ${
                mode === "combined" ? "border-[#004E89]/10" : mode === "inattentive" ? colorPalette.borderLight : colorPalette.border
              } pt-4 flex items-start gap-2`}>
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
                  className={`flex-1 rounded-lg border ${
                    mode === "combined" 
                      ? "border-[#004E89]/20 text-[#004E89] placeholder:text-[#004E89]/40 focus:border-[#FF6B35]"
                      : mode === "inattentive"
                      ? `${colorPalette.border} ${colorPalette.text} placeholder:${colorPalette.textMuted}/70 focus:border-[#665FD1]`
                      : `${colorPalette.border} ${colorPalette.text} ${colorPalette.borderLight.replace('border-', 'focus:border-')}`
                  } bg-white px-3 py-2 text-sm focus:outline-none resize-none`}
                />
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => addTask(input)}
                    className={`rounded-lg ${colorPalette.accent} px-4 py-2 text-sm font-medium text-white transition ${colorPalette.accentHover} flex items-center justify-center`}
                    title="Add task"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                      <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleBreakTasks(input)}
                    disabled={isBreaking}
                    className={`rounded-lg border ${
                      mode === "combined"
                        ? "border-[#004E89]/20 text-[#004E89] hover:bg-[#F7C59F]/20"
                        : mode === "inattentive"
                        ? `${colorPalette.border} ${colorPalette.text} ${colorPalette.hoverBg}`
                        : `${colorPalette.borderLight} ${colorPalette.text} ${colorPalette.accentLight.replace('bg-', 'hover:bg-')}`
                    } bg-white px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                    title={isBreaking ? "Breaking down task..." : "Break down task using AI"}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
                      <path d="M15.98 1.804a1 1 0 0 0-1.96 0l-.24 1.192a1 1 0 0 1-.784.785l-1.192.238a1 1 0 0 0 0 1.962l1.192.238a1 1 0 0 1 .785.785l.238 1.192a1 1 0 0 0 1.962 0l.238-1.192a1 1 0 0 1 .785-.785l1.192-.238a1 1 0 0 0 0-1.962l-1.192-.238a1 1 0 0 1-.785-.785l-.238-1.192ZM6.949 5.684a1 1 0 0 0-1.898 0l-.683 2.051a1 1 0 0 1-.633.633l-2.051.683a1 1 0 0 0 0 1.898l2.051.684a1 1 0 0 1 .633.632l.683 2.051a1 1 0 0 0 1.898 0l.683-2.051a1 1 0 0 1 .633-.633l2.051-.683a1 1 0 0 0 0-1.898l-2.051-.683a1 1 0 0 1-.633-.633L6.95 5.684ZM13.949 13.684a1 1 0 0 0-1.898 0l-.184.551a1 1 0 0 1-.632.633l-.551.183a1 1 0 0 0 0 1.898l.551.183a1 1 0 0 1 .633.633l.183.551a1 1 0 0 0 1.898 0l.184-.551a1 1 0 0 1 .632-.633l.551-.183a1 1 0 0 0 0-1.898l-.551-.184a1 1 0 0 1-.633-.632l-.183-.551Z" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className={`text-sm ${colorPalette.textMuted}`}>No task list selected</p>
            </div>
          )}
        </div>
      </main>

      {/* Modals */}
      <FocusModeModal isOpen={isFocusModalOpen} onClose={() => setIsFocusModalOpen(false)} mode={mode} />
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
