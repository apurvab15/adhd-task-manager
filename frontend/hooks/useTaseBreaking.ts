import { useState } from "react";
import { getApiKey, promptForApiKey } from "@/utils/apiKeyManager";

export type task = {
    id: number;
    text: string;
    done: boolean;
};

export type ADHDType = "inattentive" | "hyperactive" | "combined";

export function useTaskBreaker(userTask: string, adhdType: ADHDType = "combined") {

    const [isBreaking, setIsBreaking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const breakTask = async (userTask: string, adhdType: ADHDType = "combined") => {

        if (!userTask || userTask.trim() === "") {
            setError("Task cannot be empty");
            return;
        }

        setIsBreaking(true);
        setError(null);
        try {
            // Get API key from storage or prompt user
            let apiKey = getApiKey();
            
            const response = await fetch("/api/break-tasks", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ 
                    userTask: userTask.trim(), 
                    adhdType: adhdType,
                    ...(apiKey ? { apiKey } : {})
                }),
            });

            const data = await response.json();

            // If API key is required, prompt user and retry
            if (!response.ok && data.requiresApiKey) {
                apiKey = await promptForApiKey();
                if (!apiKey) {
                    setError("API key is required to break down tasks");
                    return;
                }
                
                // Retry with API key
                const retryResponse = await fetch("/api/break-tasks", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ 
                        userTask: userTask.trim(), 
                        adhdType: adhdType,
                        apiKey 
                    }),
                });

                if (!retryResponse.ok) {
                    const retryData = await retryResponse.json();
                    throw new Error(retryData.error || "Failed to break task");
                }

                const retryResult = await retryResponse.json();
                const subTasks = retryResult.subTasks || [];

                if (subTasks.length === 0) {
                    throw new Error("No sub-tasks were generated. Please try again.");
                }

                return subTasks;
            }

            if (!response.ok) {
                throw new Error(data.error || "Failed to break task");
            }

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