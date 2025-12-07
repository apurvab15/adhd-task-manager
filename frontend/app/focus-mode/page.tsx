"use client";
import { Suspense } from "react";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import SimpleTaskList from "@/components/SimpleTaskList";
import { violetPalette, periwinklePalette, combinedPalette, inattentivePalette, hyperactivePalette, type ColorPalette } from "@/components/TaskListDrawer";
import JSConfetti from "js-confetti";

type Mode = "inattentive" | "hyperactive" | "combined";

const FOCUS_MODE_STORAGE_KEY = "adhd-focus-mode-tasks";
const FOCUS_MODE_TIMER_KEY = "adhd-focus-mode-timer";

type Task = {
  id: number;
  text: string;
};

export default function FocusModePage() {
  return (
    <Suspense fallback={null}>
      <FocusModePageData />
    </Suspense>
  );
}
export function FocusModePageData() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const modeParam = searchParams.get("mode");
  const mode: Mode = (modeParam === "inattentive" || modeParam === "hyperactive" || modeParam === "combined") 
    ? modeParam 
    : "hyperactive";
  
  const colorPalette: ColorPalette = 
    mode === "inattentive" ? inattentivePalette :
    mode === "combined" ? combinedPalette :
    hyperactivePalette;
  
  const [tasks, setTasks] = useState<Task[]>([]);
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [completedTaskIds, setCompletedTaskIds] = useState<Set<number>>(new Set());
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const confettiRef = useRef<JSConfetti | null>(null);
  const hasTriggeredConfettiRef = useRef(false);
  
  // Timer state
  const [minutesInput, setMinutesInput] = useState(timerMinutes.toString());
  const [secondsRemaining, setSecondsRemaining] = useState(timerMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get home URL based on mode
  const getHomeUrl = () => {
    if (mode === "inattentive") return "/inattentive";
    if (mode === "hyperactive") return "/hyperactive";
    if (mode === "combined") return "/combined";
    return "/hyperactive";
  };
  
  // Update timer state when timerMinutes changes
  useEffect(() => {
    setMinutesInput(timerMinutes.toString());
    setSecondsRemaining(timerMinutes * 60);
  }, [timerMinutes]);
  
  // Timer logic
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  
  const formattedTime = useMemo(
    () => `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
    [minutes, seconds],
  );
  
  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);
  
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearTimer();
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearTimer();
    }
    
    return clearTimer;
  }, [isRunning, clearTimer]);
  
  const handleTimerStart = () => {
    if (secondsRemaining === 0) return;
    setIsRunning(true);
    setIsEditing(false);
  };
  
  const handleTimerPause = () => {
    setIsRunning(false);
  };
  
  const handleTimerEditClick = () => {
    setIsEditing(true);
    setIsRunning(false);
  };
  
  const handleMinutesChange = (value: string) => {
    setMinutesInput(value);
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setSecondsRemaining(parsed * 60);
      setIsRunning(false);
    }
  };
  
  const handleEditSave = () => {
    const mins = parseInt(minutesInput, 10);
    const safeMinutes = isNaN(mins) ? timerMinutes : Math.max(1, Math.min(120, mins));
    setTimerMinutes(safeMinutes);
    setSecondsRemaining(safeMinutes * 60);
    setMinutesInput(safeMinutes.toString());
    setIsEditing(false);
  };

  // Initialize confetti
  useEffect(() => {
    if (typeof window !== "undefined") {
      confettiRef.current = new JSConfetti();
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      // Load selected tasks
      const savedTasks = window.localStorage.getItem(FOCUS_MODE_STORAGE_KEY);
      if (savedTasks) {
        const parsedTasks = JSON.parse(savedTasks) as Task[];
        setTasks(parsedTasks);
      }

      // Load timer duration
      const savedTimer = window.localStorage.getItem(FOCUS_MODE_TIMER_KEY);
      if (savedTimer) {
        const parsedTimer = parseInt(savedTimer, 10);
        if (!isNaN(parsedTimer) && parsedTimer > 0) {
          setTimerMinutes(parsedTimer);
        }
      }
    } catch (error) {
      console.error("Error loading focus mode data:", error);
    }
  }, []);

  // Track completed tasks
  const handleTaskToggle = (taskId: string | number, isChecked: boolean) => {
    const id = typeof taskId === 'string' ? parseInt(taskId, 10) : taskId;
    if (isNaN(id)) return;
    
    setCompletedTaskIds((prev) => {
      const newSet = new Set(prev);
      if (isChecked) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  // Check if all tasks are completed
  const allTasksCompleted = tasks.length > 0 && completedTaskIds.size === tasks.length;

  // Handle completion: trigger confetti, pause timer, show modal
  useEffect(() => {
    if (allTasksCompleted && !hasTriggeredConfettiRef.current) {
      hasTriggeredConfettiRef.current = true;
      
      // Trigger confetti
      if (confettiRef.current) {
        const confettiColors = mode === "inattentive" 
          ? ['#665FD1', '#CCCCFF', '#E6E6FF', '#7C83BC', '#FFFFFF']
          : mode === "combined"
          ? ['#FF6B35', '#F7C59F', '#EFEFD0', '#004E89', '#FFFFFF']
          : ['#FF6B35', '#FF8D63', '#FFAF91', '#FFD1BF', '#FFFFFF'];
        
        confettiRef.current.addConfetti({
          emojis: ["🎉", "✨", "🌟", "💫", "🎊"],
          emojiSize: 100,
          confettiNumber: 50,
          confettiColors,
        });
      }
      
      // Pause timer
      setIsRunning(false);
      
      // Show completion modal
      setShowCompletionModal(true);
    } else if (!allTasksCompleted) {
      hasTriggeredConfettiRef.current = false;
    }
  }, [allTasksCompleted, mode]);

  // Background styling based on mode
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

  return (
    <div className={`h-screen overflow-hidden ${backgroundClass} flex flex-col`}>
      {/* Navigation Bar */}
      <nav className={`flex-shrink-0 border-b ${navBorderClass} bg-white/90 backdrop-blur-sm`}>
        <div className="flex items-center justify-between px-6 py-4">
          {/* Left side - Bullseye icon + Focus Mode text */}
          <div className="flex items-center gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
              fill="currentColor"
              className={`h-6 w-6 ${navTextClass}`}
            >
              <path d="M448 256A192 192 0 1 0 64 256a192 192 0 1 0 384 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zm256 80a80 80 0 1 0 0-160 80 80 0 1 0 0 160zm0-224a144 144 0 1 1 0 288 144 144 0 1 1 0-288zM224 256a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z"/>
            </svg>
            <span className={`text-xl font-semibold ${navTextClass}`}>Focus Mode</span>
          </div>
          
          {/* Right side - Home icon */}
          <Link
            href={getHomeUrl()}
            className={`flex items-center justify-center rounded-lg p-2 bg-white border-2 transition-colors ${
              mode === "combined"
                ? "border-[#004E89] text-[#004E89] hover:bg-[#F7C59F]/10"
                : mode === "inattentive"
                ? `${colorPalette.accent.replace('bg-', 'border-')} ${colorPalette.accent.replace('bg-', 'text-')} ${colorPalette.accentLight.replace('bg-', 'hover:bg-')}`
                : `${colorPalette.accent.replace('bg-', 'border-')} ${colorPalette.accent.replace('bg-', 'text-')} ${colorPalette.accentLight.replace('bg-', 'hover:bg-')}`
            }`}
            title="Home"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-5 w-5"
            >
              <path
                fillRule="evenodd"
                d="M9.293 2.293a1 1 0 0 1 1.414 0l7 7A1 1 0 0 1 17 11h-1v6a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-6H3a1 1 0 0 1-.707-1.707l7-7Z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        </div>
      </nav>

      {/* Main Content - 2 Column Layout */}
      <main className="flex-1 flex gap-4 p-4 overflow-hidden min-h-0">
        {/* Left Column - Timer (with card, vertically centered) */}
        <div className="w-1/2 flex flex-col">
          <div className={`flex-1 rounded-2xl border ${colorPalette.borderLight} bg-white/90 p-6 shadow-lg flex items-center justify-center`}>
            <div className="flex flex-col items-center justify-center w-full">
              {/* Timer Label */}
              <p className={`text-xs font-semibold uppercase tracking-[0.4em] mb-6 ${colorPalette.textMuted}`}>
                Focus Timer
              </p>
              
              {/* Timer with Radial Progress */}
              <div className="relative flex items-center justify-center mb-8" style={{ width: 280, height: 280 }}>
                {/* Radial Progress */}
                {(() => {
                  const totalSeconds = timerMinutes * 60;
                  const elapsedSeconds = totalSeconds - secondsRemaining;
                  const progressPercentage = totalSeconds > 0 ? (elapsedSeconds / totalSeconds) * 100 : 0;
                  const size = 280;
                  const strokeWidth = 12;
                  const radius = (size - strokeWidth) / 2;
                  const circumference = 2 * Math.PI * radius;
                  const offset = circumference - (progressPercentage / 100) * circumference;
                  
                  const progressColor = mode === "inattentive" 
                    ? "#665FD1"
                    : mode === "combined"
                    ? "#FF6B35"
                    : "#FF6B35";
                  
                  const bgColor = mode === "inattentive"
                    ? "#7C83BC"
                    : mode === "combined"
                    ? "#1A659E"
                    : "#BFC9D4";
                  
                  return (
                    <svg
                      width={size}
                      height={size}
                      className="absolute transform -rotate-90"
                    >
                      {/* Background circle */}
                      <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={bgColor}
                        strokeWidth={strokeWidth}
                        strokeOpacity={0.3}
                      />
                      {/* Progress circle */}
                      {progressPercentage > 0 && (
                        <circle
                          cx={size / 2}
                          cy={size / 2}
                          r={radius}
                          fill="none"
                          stroke={progressColor}
                          strokeWidth={strokeWidth}
                          strokeDasharray={circumference}
                          strokeDashoffset={offset}
                          strokeLinecap="round"
                          style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                        />
                      )}
                    </svg>
                  );
                })()}
                
                {/* Timer Display */}
                <div className="text-center relative z-10">
                  {isEditing ? (
                    <div className="flex items-center justify-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={120}
                        className={`w-20 rounded-2xl border ${colorPalette.borderLight} bg-white px-3 py-2 text-sm ${colorPalette.textDark} ${colorPalette.borderLight.replace('border-', 'focus:border-')} focus:outline-none`}
                        value={minutesInput}
                        onChange={(event) => handleMinutesChange(event.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleEditSave();
                          }
                        }}
                        autoFocus
                      />
                      <span className={`text-xs font-semibold uppercase tracking-wide ${colorPalette.textDark}`}>
                        minutes
                      </span>
                    </div>
                  ) : (
                    <p className={`text-6xl font-semibold ${colorPalette.textDark}`}>{formattedTime}</p>
                  )}
                </div>
              </div>

              {/* Timer Controls */}
              <div className="grid grid-cols-3 gap-3 w-full">
                <button
                  type="button"
                  onClick={handleTimerStart}
                  className={`rounded-2xl ${colorPalette.accent} px-4 py-3 text-sm font-semibold text-white transition ${colorPalette.accentHover} disabled:opacity-50`}
                  disabled={isRunning || secondsRemaining === 0 || isEditing}
                >
                  Start
                </button>
                <button
                  type="button"
                  onClick={handleTimerPause}
                  className={`rounded-2xl border ${colorPalette.borderLight} px-4 py-3 text-sm font-semibold ${colorPalette.text} transition ${colorPalette.accentLight.replace('bg-', 'hover:bg-')}`}
                  disabled={!isRunning || isEditing}
                >
                  Pause
                </button>
                <button
                  type="button"
                  onClick={isEditing ? handleEditSave : handleTimerEditClick}
                  className={`rounded-2xl border ${colorPalette.borderLight} px-4 py-3 text-sm font-semibold ${colorPalette.text} transition ${colorPalette.accentLight.replace('bg-', 'hover:bg-')}`}
                  disabled={isRunning}
                >
                  {isEditing ? 'Save' : 'Edit'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Task List */}
        <div className="w-1/2 flex flex-col">
          <div className={`flex-1 rounded-2xl border ${colorPalette.borderLight} bg-white/90 p-6 shadow-lg flex flex-col overflow-hidden`}>
            {/* Target Title */}
            <div className="mb-6 flex-shrink-0">
              <h2 className={`text-2xl font-semibold ${colorPalette.textDark} flex items-center gap-2`}>
                <span>🎯</span>
                <span>Target</span>
              </h2>
            </div>
            
            {/* Task List - Scrollable */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {tasks.length > 0 ? (
                <SimpleTaskList 
                  tasks={tasks} 
                  showDelete={false} 
                  colorPalette={colorPalette}
                  onTaskToggle={handleTaskToggle}
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <p className={`text-center text-sm ${colorPalette.textMuted}`}>
                    No tasks selected. Go to Task Manager to set up your focus session.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className={`w-full max-w-md rounded-3xl border-2 ${colorPalette.borderLight} bg-white p-8 shadow-2xl`}>
            <div className="text-center">
              <div className="mb-4 text-6xl">🎉</div>
              <h2 className={`mb-4 text-3xl font-bold ${colorPalette.textDark}`}>Yay you did it!</h2>
              <p className={`mb-6 ${colorPalette.textMuted}`}>
                All tasks completed! Great job staying focused.
              </p>
              <button
                onClick={() => router.push(getHomeUrl())}
                className={`w-full rounded-xl ${colorPalette.accent} px-6 py-3 text-lg font-semibold text-white transition-colors ${colorPalette.accentHover}`}
              >
                Go Back to Home
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

