"use client";

import { useState, useRef, useEffect } from "react";
import TaskListDrawer, { type ColorPalette, violetPalette } from "./TaskListDrawer";
import { awardXPForTask } from "@/utils/gamification";

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

const STORAGE_KEY = "adhd-task-lists";

type Mode = "inattentive" | "hyperactive";

type TaskListWindowProps = {
    mode?: Mode;
    colorPalette?: ColorPalette;
};

export default function TaskListWindow({ mode = "hyperactive", colorPalette = violetPalette }: TaskListWindowProps) {
    // Always start with default state to avoid hydration mismatch
    const [taskLists, setTaskLists] = useState<TaskList[]>([{ id: 1, name: "Task List", tasks: [] }]);
    const [currentListId, setCurrentListId] = useState<number>(1);
    const [isHydrated, setIsHydrated] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(mode === "hyperactive");
    const [input, setInput] = useState("");
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editingTitle, setEditingTitle] = useState("");
    const inputRef = useRef<HTMLTextAreaElement | null>(null);
    const titleInputRef = useRef<HTMLInputElement | null>(null);
    const nextTaskId = useRef(1);
    const nextListId = useRef(2);

    // Load from localStorage after mount (client-side only)
    useEffect(() => {
        if (typeof window === "undefined") return;
        
        try {
            const saved = window.localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved) as TaskList[];
                if (parsed.length > 0) {
                    setTaskLists(parsed);
                    setCurrentListId(parsed[0].id);
                }
            }
        } catch (error) {
            console.error("Error loading tasks from localStorage:", error);
        }
        
        setIsHydrated(true);
    }, []);

    // Initialize nextTaskId and nextListId from existing data (only on mount)
    useEffect(() => {
        if (taskLists.length > 0) {
            const maxListId = Math.max(...taskLists.map((list) => list.id));
            nextListId.current = maxListId + 1;
            const allTasks = taskLists.flatMap((list) => list.tasks);
            if (allTasks.length > 0) {
                const maxTaskId = Math.max(...allTasks.map((task) => task.id));
                nextTaskId.current = maxTaskId + 1;
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Persist to localStorage (only after hydration to avoid overwriting with default state)
    useEffect(() => {
        if (typeof window === "undefined" || !isHydrated) return;
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(taskLists));
    }, [taskLists, isHydrated]);

    // Ensure currentListId is valid
    useEffect(() => {
        const currentListExists = taskLists.some((list) => list.id === currentListId);
        if (!currentListExists && taskLists.length > 0) {
            setCurrentListId(taskLists[0].id);
        }
    }, [taskLists, currentListId]);

    // Sync drawer state with mode
    useEffect(() => {
        setIsDrawerOpen(mode === "hyperactive");
    }, [mode]);

    const currentList = taskLists.find((list) => list.id === currentListId) || taskLists[0];

    function addTask(text: string) {
        const t = text.trim();
        if (!t) return;
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
    }

    // "Break task" will split the current input at the caret position into two tasks
    function breakTaskAtCaret() {
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
            setTaskLists((lists) =>
                lists.map((list) =>
                    list.id === currentListId
                        ? { ...list, tasks: [...list.tasks, ...newTasks] }
                        : list
                )
            );
        }
        setInput("");
        el.focus();
    }

    function toggleDone(taskId: number) {
        setTaskLists((lists) => {
            const currentList = lists.find((list) => list.id === currentListId);
            const task = currentList?.tasks.find((t) => t.id === taskId);
            
            // Award XP only when marking a task as done (not when unchecking) and only once
            if (task && !task.done && typeof window !== "undefined") {
                awardXPForTask();
                // Trigger a custom event to refresh stats on home page
                window.dispatchEvent(new CustomEvent("taskCompleted"));
            }

            return lists.map((list) =>
                list.id === currentListId
                    ? {
                          ...list,
                          tasks: list.tasks.map((t) =>
                              t.id === taskId ? { ...t, done: !t.done } : t
                          ),
                      }
                    : list
            );
        });
    }

    function removeTask(taskId: number) {
        setTaskLists((lists) =>
            lists.map((list) =>
                list.id === currentListId
                    ? { ...list, tasks: list.tasks.filter((t) => t.id !== taskId) }
                    : list
            )
        );
    }

    function startEditingTitle() {
        setEditingTitle(currentList.name);
        setIsEditingTitle(true);
        setTimeout(() => titleInputRef.current?.focus(), 0);
    }

    function saveTitle() {
        const trimmed = editingTitle.trim();
        if (trimmed) {
            setTaskLists((lists) =>
                lists.map((list) =>
                    list.id === currentListId ? { ...list, name: trimmed } : list
                )
            );
        }
        setIsEditingTitle(false);
    }

    function cancelEditingTitle() {
        setIsEditingTitle(false);
        setEditingTitle("");
    }

    function createNewList() {
        const newList: TaskList = {
            id: nextListId.current++,
            name: `Task List ${taskLists.length + 1}`,
            tasks: [],
        };
        setTaskLists((lists) => [...lists, newList]);
        setCurrentListId(newList.id);
        // Drawer remains open when creating new list
    }

    function deleteList(listId: number) {
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
    }

    function selectList(listId: number) {
        setCurrentListId(listId);
        // Drawer remains open when selecting a list
    }

    /* // keyboard: Enter -> add, Shift+Enter -> break
     function handleKeyDown(e) {
       if (e.key === "Enter" && !e.shiftKey) {
         e.preventDefault();
         addTask(input);
       }
       if (e.key === "Enter" && e.shiftKey) {
         e.preventDefault();
         breakTaskAtCaret();
       }
     }*/

    return (
        <div className="flex h-full min-h-[70vh] gap-6">
            <TaskListDrawer
                taskLists={taskLists}
                currentListId={currentListId}
                onSelectList={selectList}
                onCreateList={createNewList}
                onDeleteList={deleteList}
                isOpen={isDrawerOpen}
                onToggle={() => setIsDrawerOpen(!isDrawerOpen)}
                colorPalette={colorPalette}
            />
            <div className={`flex-1 rounded-3xl border ${colorPalette.border} bg-gradient-to-b ${colorPalette.bg} p-6 shadow-lg ${colorPalette.shadow} flex flex-col`}>
            {/* Editable title with pencil icon */}
            <div className="flex items-center mb-2">
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
                            className={`flex-1 text-lg font-semibold ${colorPalette.textDark} bg-transparent border-b-2 ${colorPalette.accent.replace('bg-', 'border-')} focus:outline-none px-1`}
                        />
                    </div>
                ) : (
                    <div className={`flex items-center gap-1.5 ${colorPalette.textDark}`}>
                        <h3 className={`text-lg font-semibold ${colorPalette.textDark}`}>{currentList.name}</h3>
                        <button
                            onClick={startEditingTitle}
                            className={`p-0.5 rounded ${colorPalette.text} ${colorPalette.accentLight.replace('bg-', 'hover:bg-')} transition-colors`}
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
            <div className={`flex-1 min-h-[200px] max-h-[500px] overflow-auto rounded-2xl border ${colorPalette.border} bg-white/70 p-3 mb-4`}>
                <ul>
                    {currentList.tasks.map((task) => (
                        <li
                            key={task.id}
                            className={`flex items-center justify-between rounded-2xl border ${colorPalette.border} bg-white/90 px-4 py-3 transition ${colorPalette.borderLight.replace('border-', 'hover:border-')}`}
                        >
                            <div className="flex items-center gap-3">
                                {/* custom radio-like button */}
                                <button
                                    onClick={() => toggleDone(task.id)}
                                    aria-pressed={task.done}
                                    className={`w-4 h-4 rounded-full flex items-center justify-center border-2 transition-all focus:outline-none ${task.done
                                        ? `${colorPalette.accent.replace('bg-', 'border-')} ${colorPalette.accent}`
                                        : `${colorPalette.borderLight} bg-transparent`
                                        }`}
                                    title={task.done ? "Mark as not done" : "Mark as done"}
                                >
                                    {/* inner dot when done */}
                                    <span className={`${task.done ? "w-2 h-2 rounded-full bg-white" : "hidden"}`}></span>
                                </button>

                                {/* task text */}
                                <span
                                    className={`select-none ${task.done ? `line-through ${colorPalette.textMuted}` : colorPalette.text}`}
                                    onClick={() => toggleDone(task.id)}
                                >
                                    {task.text}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => removeTask(task.id)}
                                    className={`text-xs px-2 py-1 rounded-xl ${colorPalette.text} ${colorPalette.accentLight.replace('bg-', 'hover:bg-')}`}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                                        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                                    </svg>


                                </button>
                            </div>
                        </li>
                    ))}

                    {currentList.tasks.length === 0 && (
                        <li className={`text-sm ${colorPalette.textMuted}`}>No tasks yet — add one!</li>
                    )}
                </ul>
            </div>

            {/* input area with Add and Break Task on the right */}
            <div className={`flex items-start gap-3 rounded-2xl border ${colorPalette.border} bg-white/80 p-3`}>
                <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    //onKeyDown={handleKeyDown}
                    rows={2}
                    placeholder="Type a task... (Enter = add, Shift+Enter = break)"
                    className={`flex-1 resize-none rounded-2xl border ${colorPalette.border} bg-white/80 p-3 text-sm ${colorPalette.text} ${colorPalette.borderLight.replace('border-', 'focus:border-')} focus:outline-none`}
                />

                <div className="flex flex-col gap-3 px-1">
                    <button
                        onClick={() => addTask(input)}
                        className={`rounded-2xl ${colorPalette.accent} px-4 py-2 text-sm font-semibold text-white shadow-sm transition ${colorPalette.accentHover} focus:outline-none`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                        </svg>

                    </button>

                    <button
                        onClick={breakTaskAtCaret}
                        className={`rounded-2xl border ${colorPalette.borderLight} px-4 py-2 text-sm font-semibold ${colorPalette.text} transition ${colorPalette.accentLight.replace('bg-', 'hover:bg-')}`}
                        title="Split the current input at the cursor into two tasks"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-5">
                            <path d="M15.98 1.804a1 1 0 0 0-1.96 0l-.24 1.192a1 1 0 0 1-.784.785l-1.192.238a1 1 0 0 0 0 1.962l1.192.238a1 1 0 0 1 .785.785l.238 1.192a1 1 0 0 0 1.962 0l.238-1.192a1 1 0 0 1 .785-.785l1.192-.238a1 1 0 0 0 0-1.962l-1.192-.238a1 1 0 0 1-.785-.785l-.238-1.192ZM6.949 5.684a1 1 0 0 0-1.898 0l-.683 2.051a1 1 0 0 1-.633.633l-2.051.683a1 1 0 0 0 0 1.898l2.051.684a1 1 0 0 1 .633.632l.683 2.051a1 1 0 0 0 1.898 0l.683-2.051a1 1 0 0 1 .633-.633l2.051-.683a1 1 0 0 0 0-1.898l-2.051-.683a1 1 0 0 1-.633-.633L6.95 5.684ZM13.949 13.684a1 1 0 0 0-1.898 0l-.184.551a1 1 0 0 1-.632.633l-.551.183a1 1 0 0 0 0 1.898l.551.183a1 1 0 0 1 .633.633l.183.551a1 1 0 0 0 1.898 0l.184-.551a1 1 0 0 1 .632-.633l.551-.183a1 1 0 0 0 0-1.898l-.551-.184a1 1 0 0 1-.633-.632l-.183-.551Z" />
                        </svg>

                    </button>
                </div>
            </div>
        </div>
        </div>
    );
}
