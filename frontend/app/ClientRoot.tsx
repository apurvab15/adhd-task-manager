"use client";

import { useEffect, useState, type ReactNode } from "react";

type ClientRootProps = {
  children: ReactNode;
};

// Bump this via NEXT_PUBLIC_APP_VERSION on each deploy to trigger a one-time reset
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "dev";
const VERSION_STORAGE_KEY = "adhd-app-version";

/**
 * Client-side wrapper that clears localStorage only when
 * the deployed app version changes (not on normal reloads).
 */
export function ClientRoot({ children }: ClientRootProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const storedVersion = window.localStorage.getItem(VERSION_STORAGE_KEY);

      // If version changed (or no version stored yet), clear and store new version
      if (storedVersion !== APP_VERSION) {
        window.localStorage.clear();
        window.localStorage.setItem(VERSION_STORAGE_KEY, APP_VERSION);
      }
    } catch (error) {
      console.error("Failed to handle localStorage on startup:", error);
    } finally {
      setIsReady(true);
    }
  }, []);

  // Avoid rendering children until we've handled storage/version check
  if (!isReady) {
    return null;
  }

  return <>{children}</>;
}

