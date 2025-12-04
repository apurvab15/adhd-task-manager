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
- Name: ${formData.name || "Not provided"}
- Age: ${formData.age || "Not provided"}
- Difficulty sustaining attention: ${formData.concentration || "Not answered"}
- Difficulty organizing tasks: ${formData.organization || "Not answered"}
- Forgetfulness: ${formData.forgetfulness || "Not answered"}
- Difficulty listening: ${formData.listening || "Not answered"}
- Fails to follow through: ${formData.followThrough || "Not answered"}
- Restlessness: ${formData.restlessness || "Not answered"}
- Fidgeting: ${formData.fidgeting || "Not answered"}
- Impulsivity: ${formData.impulsivity || "Not answered"}
- Interrupting others: ${formData.interrupting || "Not answered"}
- Difficulty waiting: ${formData.waiting || "Not answered"}
- Careless mistakes: ${formData.details || "Not answered"}
- Avoids sustained mental effort: ${formData.activities || "Not answered"}
- Symptoms since childhood: ${formData.symptoms || "Not answered"}
- Duration of symptoms: ${formData.duration || "Not answered"}
- Impact on daily life: ${formData.impact || "Not provided"}

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
