import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

// Frequency mapping (same as Python notebook)
const FREQ_MAP: Record<string, number> = {
  "Never": 1,
  "Rarely": 2,
  "Sometimes": 3,
  "Often": 4,
  "Very Often": 5,
};

// Map form field values to Python notebook format
function normalizeFrequency(value: string): string {
  const mapping: Record<string, string> = {
    "never": "Never",
    "rarely": "Rarely",
    "sometimes": "Sometimes",
    "often": "Often",
    "very-often": "Very Often",
  };
  return mapping[value.toLowerCase()] || value;
}

function scoreFreq(value: string): number {
  const normalized = normalizeFrequency(value);
  return FREQ_MAP[normalized] || 0;
}

// Map form fields to Python notebook field names
function mapFormDataToNotebookFormat(formData: Record<string, string>): Record<string, any> {
  const mapped: Record<string, any> = {
    age: formData.age || "",
    attention_focus_loss: normalizeFrequency(formData.q1 || ""),
    unfinished_tasks: normalizeFrequency(formData.q2 || ""),
    disorganization: normalizeFrequency(formData.q3 || ""),
    avoid_long_focus: normalizeFrequency(formData.q4 || ""),
    losing_items: normalizeFrequency(formData.q5 || ""),
    restlessness: normalizeFrequency(formData.q6 || ""),
    interrupting: normalizeFrequency(formData.q7 || ""),
    task_switching: normalizeFrequency(formData.q8 || ""),
    time_blindness: normalizeFrequency(formData.q9 || ""),
    forgetting_deadlines: normalizeFrequency(formData.q11 || ""),
  };

  // Map work environment
  const workEnvMap: Record<string, string> = {
    "structured": "Structured",
    "interruptions": "Interruptions",
    "fast-paced": "Fast-paced",
    "remote": "Remote",
    "unstructured": "Unstructured",
  };
  mapped.work_environment = workEnvMap[formData.q12?.toLowerCase()] || formData.q12 || "";

  // Map social support (convert to number scale 1-5)
  const supportMap: Record<string, number> = {
    "not-at-all": 1,
    "slightly": 2,
    "moderately": 3,
    "very": 4,
    "extremely": 5,
  };
  mapped.social_support = supportMap[formData.q13?.toLowerCase()] || 3;

  // Map preferred focus environment
  const focusEnvMap: Record<string, string> = {
    "quiet": "Quiet",
    "background-music": "Background music",
    "busy": "Busy",
    "depends": "Depends",
  };
  mapped.preferred_focus_environment = focusEnvMap[formData.q14?.toLowerCase()] || formData.q14 || "";

  // Map largest distraction
  const distractionMap: Record<string, string> = {
    "noise": "Noise",
    "visual-movement": "Visual movement",
    "interruptions": "Interruptions",
    "notifications": "Notifications",
    "internal-thoughts": "Internal thoughts",
  };
  mapped.largest_distraction = distractionMap[formData.q15?.toLowerCase()] || formData.q15 || "";

  mapped.emotional_swings = normalizeFrequency(formData.q16 || "");
  mapped.stress_impact = normalizeFrequency(formData.q17 || "");

  return mapped;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.json();

    if (!formData || Object.keys(formData).length === 0) {
      return NextResponse.json(
        { error: "No form data provided" },
        { status: 400 }
      );
    }

    const googleAPIKey = "AIzaSyBt744MGot6AhsB42gR_t2_ZjnPoNMAyLk";

    if (!googleAPIKey || googleAPIKey.trim() === "") {
      return NextResponse.json(
        { error: "Google API key is not set" },
        { status: 500 }
      );
    }

    // Map form data to notebook format
    const userResponses = mapFormDataToNotebookFormat(formData);

    // Calculate scores (same as Python notebook)
    const inattentionItems = [
      "attention_focus_loss",
      "unfinished_tasks",
      "disorganization",
      "avoid_long_focus",
      "losing_items",
      "time_blindness",
      "forgetting_deadlines",
    ];

    const hyperItems = [
      "restlessness",
      "interrupting",
      "task_switching",
    ];

    const inattScore = inattentionItems.reduce(
      (sum, key) => sum + scoreFreq(userResponses[key] || "Never"),
      0
    );
    const hyperScore = hyperItems.reduce(
      (sum, key) => sum + scoreFreq(userResponses[key] || "Never"),
      0
    );

    // Initialize Google Gemini
    const genAI = new GoogleGenerativeAI(googleAPIKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    // Build prompt (same structure as Python notebook)
    const prompt = `You are an expert in ADHD screening and UX personalization.

Classify the user into one of these UI personas:

1. Inattentive → The Calm Organizer
2. Hyperactive–Impulsive → The Energetic Achiever
3. Combined → The Adaptive Balancer

Here are the numeric scores:
Inattention Score = ${inattScore}
Hyperactivity Score = ${hyperScore}

Here are the original responses:
${JSON.stringify(userResponses, null, 2)}

Classification rules:
- If Inattention >> Hyper → Inattentive subtype.
- If Hyper >> Inattention → Hyperactive–Impulsive subtype.
- If both are moderately high or close → Combined subtype.
- Respond ONLY with JSON in this exact structure:

{
  "subtype": "",
  "persona": "",
  "reasoning": "",
  "recommended_ui_features": []
}`;

    const response = await model.generateContent(prompt);
    const result = response.response.text();

    // Clean and parse the result (same as Python notebook)
    let cleanedResult = result.trim();

    // Extract JSON even if the model adds text before/after
    let parsedResult: {
      subtype: string;
      persona: string;
      reasoning: string;
      recommended_ui_features: string[];
    };

    try {
      const jsonStart = cleanedResult.indexOf("{");
      const jsonEnd = cleanedResult.lastIndexOf("}") + 1;
      if (jsonStart === -1 || jsonEnd === 0) {
        throw new Error("No JSON found in response");
      }
      const cleaned = cleanedResult.substring(jsonStart, jsonEnd);
      parsedResult = JSON.parse(cleaned);
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError);
      console.error("Raw response:", result);
      throw new Error(`Model did not return valid JSON:\n${result}`);
    }

    // Validate and normalize subtype
    const subtype = parsedResult.subtype.toLowerCase();
    let normalizedSubtype: "inattentive" | "hyperactive" | "combined";
    
    if (subtype.includes("inattentive")) {
      normalizedSubtype = "inattentive";
    } else if (subtype.includes("hyperactive") || subtype.includes("impulsive")) {
      normalizedSubtype = "hyperactive";
    } else {
      normalizedSubtype = "combined";
    }

    return NextResponse.json({
      subtype: normalizedSubtype,
      persona: parsedResult.persona || "",
      reasoning: parsedResult.reasoning || "",
      recommended_ui_features: parsedResult.recommended_ui_features || [],
      // Keep backward compatibility with old format
      adhdType: normalizedSubtype,
      confidence: "high", // Default for new format
      explanation: parsedResult.reasoning || "",
    });
  } catch (error) {
    console.error("Error in classify API route:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
