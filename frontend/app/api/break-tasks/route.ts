import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        let { userTask, adhdType } = await req.json();


        if (!userTask || userTask.length === 0) {
            return NextResponse.json({ error: "No task provided, task is needed!" },
                { status: 400 });
        }

        if (!adhdType || !["inattentive", "hyperactive", "combined"].includes(adhdType)) {
            adhdType = "combined";
        }

        const googleAPIKey = process.env.GOOGLE_API_KEY;


        if (!googleAPIKey || googleAPIKey.trim() === "") {
            return NextResponse.json({ error: "Google API key is not set" }, { status: 500 });
        } else {
            console.log("Google API key is set");
        }

        // initializing Google Gemini for task breakdown

        const genAI = new GoogleGenerativeAI(googleAPIKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

        const prompt = `
        You are an ADHD-aware task structuring assistant.

        Break down the user's task into actionable subtasks based on their ADHD subtype.

        ADHD subtype behavior rules:

        Inattentive = The Calm Organizer:
        - Provide simplified steps
        - Reduce cognitive load
        - Maintain steady pacing
        - Use clear, sequential order

        Hyperactive-Impulsive = The Energetic Achiever:
        - Use short micro-tasks
        - Provide quick wins
        - Include fast feedback loops
        - Keep steps energetic and engaging

        Combined = The Adaptive Balancer:
        - Mix calm/structured phases with energetic micro-tasks
        - Allow flexible switching
        - Medium-length steps
        - Balanced stimulation

        User ADHD subtype: ${adhdType}
        User task: "${userTask}"

        Return ONLY clean JSON:

        {
        "subtype": "${adhdType}",
        "original_task": "${userTask}",
        "subtasks": [],
        "explanation": ""
        }

        Let the format of each subtask be continous text, the subtask a array of string, where each item is a subtask. no list items or other formatting for all types of ADHD subtypes.
        `
        const response = await model.generateContent(prompt);
        const result = response.response.text();

        let parsedResult : { subtype: string, original_task: string, subtasks: string[], explanation: string };

        //cleaning up the result
        try {
            let cleanedResult = result.trim();
            // Remove markdown code blocks
            if (cleanedResult.startsWith("n")) {
                cleanedResult = cleanedResult.replace(/\n?/g, "").replace(/```\n?/g, "");
            } else if (cleanedResult.startsWith("```")) {
                cleanedResult = cleanedResult.replace(/```\n?/g, "");
            }

            if (cleanedResult.startsWith("json")) {
                cleanedResult = cleanedResult.replace(/json/g, "");
            }
            // Parse JSON
            parsedResult = JSON.parse(cleanedResult);
            console.log("parsedResult", parsedResult);
            // Validate response structure
            if (!parsedResult.subtasks || !Array.isArray(parsedResult.subtasks)) {
                throw new Error("Invalid response format: subtasks must be an array");
            } else {
                console.log("subtasks are an array", parsedResult.subtasks);
            }

            // Validate subtasks are strings
            if (!parsedResult.subtasks.every(i => typeof i === "string")) {
                throw new Error("Invalid response format: all subtasks must be strings");
            } else {
                console.log("subtasks are strings", parsedResult.subtasks);
            }

        } catch (error) {
            console.error("Error parsing results:", error);
            return NextResponse.json({ error: "Invalid response format" }, { status: 400 });
        }

        if (!parsedResult.subtasks || parsedResult.subtasks.length === 0) {
            return NextResponse.json(
                { error: "No subtasks were generated. Please try again." },
                { status: 500 }
            );
        }
        console.log("subTasks are valid", parsedResult.subtasks);
        return NextResponse.json({ 
            subTasks: parsedResult.subtasks,
            explanation: parsedResult.explanation || "",
            originalTask: parsedResult.original_task,
            subtype: parsedResult.subtype
        });

    } catch (error) {
        console.error("Error in API route:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}