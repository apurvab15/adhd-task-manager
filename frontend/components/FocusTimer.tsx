"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type ColorPalette, violetPalette } from "./TaskListDrawer";

type FocusTimerProps = {
  /** initial timer length in minutes */
  defaultMinutes?: number;
  /** optional label rendered above the timer */
  label?: string;
  /** color palette for styling */
  colorPalette?: ColorPalette;
  /** whether to show the pause button */
  showPause?: boolean;
};

export default function FocusTimer({
  defaultMinutes = 25,
  label = "Focus Timer",
  colorPalette = violetPalette,
  showPause = true,
}: FocusTimerProps) {
  const [minutesInput, setMinutesInput] = useState(defaultMinutes.toString());
  const [secondsRemaining, setSecondsRemaining] = useState(defaultMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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

  const handleStart = () => {
    if (secondsRemaining === 0) {
      return;
    }
    setIsRunning(true);
    setIsEditMode(false); // Exit edit mode when starting
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    const mins = parseInt(minutesInput, 10);
    const safeMinutes = Number.isNaN(mins) ? defaultMinutes : Math.max(1, mins);
    setSecondsRemaining(safeMinutes * 60);
  };

  const handleMinutesChange = (value: string) => {
    setMinutesInput(value);
    const parsed = parseInt(value, 10);
    if (!Number.isNaN(parsed) && parsed > 0) {
      setSecondsRemaining(parsed * 60);
      setIsRunning(false);
    }
  };

  const handleEditClick = () => {
    setIsEditMode(true);
    setIsRunning(false); // Pause timer when entering edit mode
  };

  return (
    <div className={`flex flex-col rounded-3xl border ${colorPalette.border} bg-gradient-to-b ${colorPalette.bg} p-6 shadow-lg ${colorPalette.shadow}`}>
      <div className="flex items-center justify-between">
        <p className={`text-xs font-semibold uppercase tracking-[0.4em] ${colorPalette.textMuted}`}>
          {label}
        </p>
        {!isEditMode && (
          <button
            type="button"
            onClick={handleEditClick}
            className="group relative opacity-50 transition-opacity hover:opacity-100"
            aria-label="Edit Timer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="h-5 w-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
              />
            </svg>
            <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
              Edit Timer
            </span>
          </button>
        )}
      </div>
      <div className="mt-6 text-center">
        <p className={`text-5xl font-semibold ${colorPalette.text}`}>{formattedTime}</p>
        {isEditMode && (
          <div className="mt-4 flex items-center justify-center gap-2">
            <input
              type="number"
              min={1}
              className={`w-20 rounded-2xl border ${colorPalette.borderLight} bg-white px-3 py-2 text-sm ${colorPalette.text} ${colorPalette.borderLight.replace('border-', 'focus:border-')} focus:outline-none`}
              value={minutesInput}
              onChange={(event) => handleMinutesChange(event.target.value)}
            />
            <span className={`text-xs font-semibold uppercase tracking-wide ${colorPalette.text}`}>
              minutes
            </span>
          </div>
        )}
      </div>

      {isEditMode && (
        <div className={`mt-6 grid gap-3 ${showPause ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
          <button
            type="button"
            onClick={handleStart}
            className={`rounded-2xl ${colorPalette.accent} px-3 py-2 text-sm font-semibold text-white transition ${colorPalette.accentHover} disabled:opacity-50`}
            disabled={isRunning || secondsRemaining === 0}
          >
            Start
          </button>
          {showPause && (
            <button
              type="button"
              onClick={handlePause}
              className={`rounded-2xl border ${colorPalette.borderLight} px-3 py-2 text-sm font-semibold ${colorPalette.text} transition ${colorPalette.accentLight.replace('bg-', 'hover:bg-')}`}
              disabled={!isRunning}
            >
              Pause
            </button>
          )}
          <button
            type="button"
            onClick={handleReset}
            className={`rounded-2xl border ${colorPalette.borderLight} px-3 py-2 text-sm font-semibold ${colorPalette.text} transition ${colorPalette.accentLight.replace('bg-', 'hover:bg-')}`}
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
}

