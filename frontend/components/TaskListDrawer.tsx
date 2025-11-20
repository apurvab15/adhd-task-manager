"use client";

type TaskList = {
    id: number;
    name: string;
    tasks: { id: number; text: string; done: boolean }[];
};

export type ColorPalette = {
    bg: string;
    border: string;
    borderLight: string;
    shadow: string;
    text: string;
    textDark: string;
    textMuted: string;
    accent: string;
    accentHover: string;
    accentLight: string;
    activeBg: string;
    activeText: string;
    hoverBg: string;
};

export const violetPalette: ColorPalette = {
    bg: "from-white via-violet-50 to-white",
    border: "border-violet-100",
    borderLight: "border-violet-200",
    shadow: "shadow-violet-100",
    text: "text-violet-900",
    textDark: "text-violet-950",
    textMuted: "text-violet-500",
    accent: "bg-violet-600",
    accentHover: "hover:bg-violet-500",
    accentLight: "bg-violet-50",
    activeBg: "bg-violet-100",
    activeText: "text-violet-900",
    hoverBg: "hover:bg-white",
};

export const skyPalette: ColorPalette = {
    bg: "from-white via-sky-50 to-white",
    border: "border-sky-100",
    borderLight: "border-sky-200",
    shadow: "shadow-sky-100",
    text: "text-sky-900",
    textDark: "text-sky-950",
    textMuted: "text-sky-500",
    accent: "bg-sky-600",
    accentHover: "hover:bg-sky-500",
    accentLight: "bg-sky-50",
    activeBg: "bg-sky-100",
    activeText: "text-sky-900",
    hoverBg: "hover:bg-white",
};

type TaskListDrawerProps = {
    taskLists: TaskList[];
    currentListId: number;
    onSelectList: (listId: number) => void;
    onCreateList: () => void;
    onDeleteList?: (listId: number) => void;
    isOpen: boolean;
    onToggle: () => void;
    colorPalette?: ColorPalette;
};

export default function TaskListDrawer({
    taskLists,
    currentListId,
    onSelectList,
    onCreateList,
    onDeleteList,
    isOpen,
    onToggle,
    colorPalette = violetPalette,
}: TaskListDrawerProps) {
    return (
        <div 
            className={`h-full min-h-[75vh] rounded-3xl border ${colorPalette.border} bg-gradient-to-b ${colorPalette.bg} shadow-lg ${colorPalette.shadow} transition-all duration-300 ease-in-out ${
                isOpen ? "w-72" : "w-16"
            }`}
        >
            <div className="flex flex-col h-full">
                {/* Header with toggle button */}
                <div className={`flex items-center justify-between p-4 border-b ${colorPalette.border}`}>
                    {isOpen ? (
                        <>
                            <h2 className={`text-lg font-semibold ${colorPalette.text}`}>
                                Task Lists
                            </h2>
                            <button
                                onClick={onToggle}
                                className={`p-1 rounded-lg ${colorPalette.textMuted} transition-colors ${colorPalette.accentLight.replace('bg-', 'hover:bg-')}`}
                                title="Close drawer"
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    className="w-5 h-5"
                                >
                                    <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                                </svg>
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={onToggle}
                            className={`w-full rounded-lg p-2 ${colorPalette.text} transition-colors ${colorPalette.accentLight.replace('bg-', 'hover:bg-')} flex items-center justify-center`}
                            title="Open task lists"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                className="w-5 h-5"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Zm0 5.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z"
                                    clipRule="evenodd"
                                />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Task lists - only show when open */}
                {isOpen && (
                    <>
                        <div className="flex-1 overflow-y-auto p-3">
                            {taskLists.length === 0 ? (
                                <p className={`text-sm ${colorPalette.textMuted} p-4 text-center`}>
                                    No task lists yet
                                </p>
                            ) : (
                                <ul className="space-y-1">
                                    {taskLists.map((list) => {
                                        const taskCount = list.tasks.length;
                                        const completedCount = list.tasks.filter((t) => t.done).length;
                                        const isActive = list.id === currentListId;

                                        return (
                                            <li key={list.id}>
                                                <div
                                                    onClick={() => onSelectList(list.id)}
                                                    className={`w-full flex items-center justify-between rounded-2xl border ${colorPalette.border} p-3 text-left transition-colors group cursor-pointer ${
                                                        isActive
                                                            ? `${colorPalette.activeBg} ${colorPalette.activeText}`
                                                            : `${colorPalette.text} ${colorPalette.hoverBg}`
                                                    }`}
                                                >
                                                    <div className="flex-1 min-w-0">
                                                        <p
                                                            className={`font-medium truncate ${
                                                                isActive
                                                                    ? colorPalette.activeText
                                                                    : colorPalette.text
                                                            }`}
                                                        >
                                                            {list.name}
                                                        </p>
                                                        <p className={`text-xs ${colorPalette.textMuted} mt-0.5`}>
                                                            {completedCount}/{taskCount} tasks
                                                        </p>
                                                    </div>
                                                    {onDeleteList && taskLists.length > 1 && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onDeleteList(list.id);
                                                            }}
                                                            className={`opacity-0 group-hover:opacity-100 p-1 rounded ${colorPalette.borderLight.replace('border-', 'hover:bg-')} transition-opacity`}
                                                            title="Delete list"
                                                        >
                                                            <svg
                                                                xmlns="http://www.w3.org/2000/svg"
                                                                viewBox="0 0 20 20"
                                                                fill="currentColor"
                                                                className="w-4 h-4 text-red-600 dark:text-red-400"
                                                            >
                                                                <path
                                                                    fillRule="evenodd"
                                                                    d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z"
                                                                    clipRule="evenodd"
                                                                />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>

                        {/* Footer with create button */}
                        <div className={`p-4 border-t ${colorPalette.border}`}>
                            <button
                                onClick={onCreateList}
                                className={`w-full flex items-center justify-center gap-2 rounded-2xl ${colorPalette.accent} px-4 py-2 font-medium text-white transition-colors ${colorPalette.accentHover}`}
                            >
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    className="w-5 h-5"
                                >
                                    <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                                </svg>
                                New List
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

