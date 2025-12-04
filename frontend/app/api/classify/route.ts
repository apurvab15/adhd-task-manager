import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.json();

    if (!formData || Object.keys(formData).length === 0) {
      return NextResponse.json(
        { error: "No form data provided" },
        { status: 400 }
      );
    }

    const googleAPIKey = process.env.GOOGLE_API_KEY;

    if (!googleAPIKey || googleAPIKey.trim() === "") {
      return NextResponse.json(
        { error: "Google API key is not set" },
        { status: 500 }
      );
    }

    // Initialize Google Gemini
    const genAI = new GoogleGenerativeAI(googleAPIKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    // Build prompt from form data
    const prompt = `You are a professional ADHD assessment assistant. Analyze the following assessment responses and determine the most likely ADHD type: "inattentive", "hyperactive", or "combined".

Assessment Responses:
- Email: ${formData.email || "Not provided"}
- Age: ${formData.age || "Not provided"}

Focus & Attention Patterns:
1. Lose focus/get distracted during sustained attention tasks: ${formData.q1 || "Not answered"}
2. Start tasks but leave unfinished: ${formData.q2 || "Not answered"}
3. Struggle to organize tasks/schedules/workspace: ${formData.q3 || "Not answered"}
4. Avoid/postpone tasks requiring long focus: ${formData.q4 || "Not answered"}
5. Misplace or lose important items: ${formData.q5 || "Not answered"}

Energy & Impulsivity Patterns:
6. Feel restless, fidgety, or "on the go": ${formData.q6 || "Not answered"}
7. Interrupt others or speak before they finish: ${formData.q7 || "Not answered"}
8. Quickly switch tasks without finishing: ${formData.q8 || "Not answered"}

Time Management:
9. Underestimate how long tasks take (time blindness): ${formData.q9 || "Not answered"}
10. Multiple tasks pattern: ${formData.q10 || "Not answered"}
11. Forget appointments, deadlines, responsibilities: ${formData.q11 || "Not answered"}

Social & Work Environment:
12. Work/study environment: ${formData.q12 || "Not answered"}
13. Feel supported by people around: ${formData.q13 || "Not answered"}

Sensory & Distractibility:
14. Best environment for focus: ${formData.q14 || "Not answered"}
15. Most disruptive distraction type: ${formData.q15 || "Not answered"}
16. Emotional swings affect task performance: ${formData.q16 || "Not answered"}
17. Stress worsens ability to focus: ${formData.q17 || "Not answered"}

Based on these responses, analyze the pattern:
- Inattentive type: Primarily symptoms related to attention, organization, forgetfulness, and focus
- Hyperactive type: Primarily symptoms related to restlessness, fidgeting, impulsivity, interrupting, and difficulty waiting
- Combined type: Significant presence of both inattentive and hyperactive symptoms

Return ONLY a JSON object in this exact format:
{
  "type": "inattentive" | "hyperactive" | "combined",
  "confidence": "high" | "medium" | "low",
  "explanation": "A brief explanation (2-3 sentences) of why this type was determined based on the assessment responses"
}

Do not include any markdown formatting, code blocks, or additional text. Only return the JSON object.`;

    const response = await model.generateContent(prompt);
    const result = response.response.text();

    // Clean and parse the result
    let cleanedResult = result.trim();
    
    // Remove markdown code blocks if present
    if (cleanedResult.startsWith("```")) {
      cleanedResult = cleanedResult.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    }
    
    // Remove "json" prefix if present
    if (cleanedResult.toLowerCase().startsWith("json")) {
      cleanedResult = cleanedResult.replace(/^json\s*/i, "");
    }

    let parsedResult: {
      type: string;
      confidence: string;
      explanation: string;
    };

    try {
      parsedResult = JSON.parse(cleanedResult);
    } catch (parseError) {
      console.error("Error parsing Gemini response:", parseError);
      console.error("Raw response:", result);
      
      // Fallback: try to extract JSON from the response
      const jsonMatch = cleanedResult.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse response as JSON");
      }
    }

    // Validate response structure
    if (!parsedResult.type || !["inattentive", "hyperactive", "combined"].includes(parsedResult.type)) {
      // Default to combined if invalid type
      parsedResult.type = "combined";
    }

    if (!parsedResult.confidence) {
      parsedResult.confidence = "medium";
    }

    if (!parsedResult.explanation) {
      parsedResult.explanation = "Based on your assessment responses, this type was determined.";
    }

    return NextResponse.json({
      adhdType: parsedResult.type,
      confidence: parsedResult.confidence,
      explanation: parsedResult.explanation,
    });
  } catch (error) {
    console.error("Error in classify API route:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
