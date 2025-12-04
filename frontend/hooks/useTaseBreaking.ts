import { useState } from "react";

export type task = {
    id: number;
    text: string;
    done: boolean;
};

export type ADHDType = "inattentive" | "hyperactive" | "combined";

export function useTaskBreaker(defaultAdhdType: ADHDType = "combined") {

    const [isBreaking, setIsBreaking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const breakTask = async (userTask: string, adhdType?: ADHDType) => {
        const finalAdhdType = adhdType || defaultAdhdType;

        if (!userTask || userTask.trim() === "") {
            setError("Task cannot be empty");
            return;
        }

        // Get API key from localStorage
        let apiKey = "";
        if (typeof window !== "undefined") {
            apiKey = window.localStorage.getItem("google-api-key") || "";
        }

        if (!apiKey || apiKey.trim() === "") {
            setError("API key is not set. Please complete the assessment first.");
            return;
        }

        setIsBreaking(true);
        setError(null);
        try {
            const response = await fetch("/api/break-tasks", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ userTask: userTask.trim(), adhdType: finalAdhdType, apiKey: apiKey }),
            });

            if (!response.ok) {
                throw new Error("Failed to break task");
            }

            const data = await response.json();
            const subTasks = data.subTasks || [];

            if (subTasks.length === 0) {
                throw new Error("No sub-tasks were generated. Please try again.");
            }

            return subTasks;
        }
        catch (error) {
            setError(error instanceof Error ? error.message : "An error occurred");
        }
        finally {
            setIsBreaking(false);
        }
    }

    return { isBreaking, error, breakTask };
}