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
};

export default function FocusTimer({
  defaultMinutes = 25,
  label = "Focus Timer",
  colorPalette = violetPalette,
}: FocusTimerProps) {
  const [minutesInput, setMinutesInput] = useState(defaultMinutes.toString());
  const [secondsRemaining, setSecondsRemaining] = useState(defaultMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
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

  return (
    <div className={`flex flex-col rounded-3xl border ${colorPalette.border} bg-gradient-to-b ${colorPalette.bg} p-6 shadow-lg ${colorPalette.shadow}`}>
      <p className={`text-xs font-semibold uppercase tracking-[0.4em] ${colorPalette.textMuted}`}>
        {label}
      </p>
      <div className="mt-6 text-center">
        <p className={`text-5xl font-semibold ${colorPalette.text}`}>{formattedTime}</p>
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
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <button
          type="button"
          onClick={handleStart}
          className={`rounded-2xl ${colorPalette.accent} px-3 py-2 text-sm font-semibold text-white transition ${colorPalette.accentHover} disabled:opacity-50`}
          disabled={isRunning || secondsRemaining === 0}
        >
          Start
        </button>
        <button
          type="button"
          onClick={handlePause}
          className={`rounded-2xl border ${colorPalette.borderLight} px-3 py-2 text-sm font-semibold ${colorPalette.text} transition ${colorPalette.accentLight.replace('bg-', 'hover:bg-')}`}
          disabled={!isRunning}
        >
          Pause
        </button>
        <button
          type="button"
          onClick={handleReset}
          className={`rounded-2xl border ${colorPalette.borderLight} px-3 py-2 text-sm font-semibold ${colorPalette.text} transition ${colorPalette.accentLight.replace('bg-', 'hover:bg-')}`}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

