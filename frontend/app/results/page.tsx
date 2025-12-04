"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type ClassificationResult = {
  adhdType: "inattentive" | "hyperactive" | "combined";
  confidence?: string;
  explanation: string;
  // New fields from Python notebook format
  subtype?: "inattentive" | "hyperactive" | "combined";
  persona?: string;
  reasoning?: string;
  recommended_ui_features?: string[];
};

export default function ResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const classify = async () => {
      try {
        // Get all form data from URL params
        const formData: Record<string, string> = {};
        searchParams.forEach((value, key) => {
          formData[key] = value;
        });

        // Call the classification API
        const response = await fetch("/api/classify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to classify ADHD type");
        }

        const data = await response.json();
        setResult(data);
        setLoading(false);
      } catch (err) {
        console.error("Error classifying:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
        setLoading(false);
      }
    };

    classify();
  }, [searchParams]);

  const getTypeDisplay = (type: string) => {
    switch (type) {
      case "inattentive":
        return {
          title: "Inattentive Type",
          description: "You primarily experience challenges with attention, focus, and organization.",
          color: "sky",
          route: "/inattentive",
        };
      case "hyperactive":
        return {
          title: "Hyperactive-Impulsive Type",
          description: "You primarily experience challenges with restlessness, impulsivity, and hyperactivity.",
          color: "violet",
          route: "/hyperactive",
        };
      case "combined":
        return {
          title: "Combined Type",
          description: "You experience a mix of both inattentive and hyperactive-impulsive symptoms.",
          color: "orange",
          route: "/combined",
        };
      default:
        return {
          title: "Unknown Type",
          description: "Unable to determine your ADHD type.",
          color: "indigo",
          route: "/combined",
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-8">
          <div className="relative">
            <div className="w-24 h-24 mx-auto">
              <div className="absolute inset-0 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-indigo-900">Analyzing Your Assessment</h2>
            <p className="text-indigo-700 text-lg">Please wait while we process your responses...</p>
          </div>
          <div className="flex justify-center space-x-2">
            <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
            <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
            <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-indigo-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-red-200 shadow-lg p-8 text-center space-y-6">
          <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-red-900 mb-2">Error</h2>
            <p className="text-red-700">{error}</p>
          </div>
          <button
            onClick={() => router.push("/assessment")}
            className="w-full px-6 py-3 rounded-full bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  // Use subtype if available, otherwise fall back to adhdType
  const adhdType = result.subtype || result.adhdType;
  const typeInfo = getTypeDisplay(adhdType);
  const colorClasses = {
    sky: "from-sky-400 to-blue-500 border-sky-300 text-sky-900",
    violet: "from-violet-400 to-rose-500 border-violet-300 text-violet-900",
    orange: "from-orange-400 to-amber-500 border-orange-300 text-orange-900",
    indigo: "from-indigo-400 to-blue-500 border-indigo-300 text-indigo-900",
  };
  const bgColorClasses = {
    sky: "from-sky-50 via-white to-blue-50",
    violet: "from-violet-50 via-white to-rose-50",
    orange: "from-orange-50 via-white to-amber-50",
    indigo: "from-indigo-50 via-white to-blue-50",
  };
  const buttonColorClasses = {
    sky: "bg-sky-600 hover:bg-sky-700 shadow-sky-500/50 hover:shadow-sky-600/60",
    violet: "bg-violet-600 hover:bg-violet-700 shadow-violet-500/50 hover:shadow-violet-600/60",
    orange: "bg-orange-600 hover:bg-orange-700 shadow-orange-500/50 hover:shadow-orange-600/60",
    indigo: "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/50 hover:shadow-indigo-600/60",
  };

  const currentColor = colorClasses[typeInfo.color as keyof typeof colorClasses] || colorClasses.indigo;
  const currentBg = bgColorClasses[typeInfo.color as keyof typeof bgColorClasses] || bgColorClasses.indigo;
  const currentButton = buttonColorClasses[typeInfo.color as keyof typeof buttonColorClasses] || buttonColorClasses.indigo;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${currentBg} flex items-center justify-center px-4 py-12`}>
      <div className="max-w-2xl w-full space-y-8">
        {/* Success Animation */}
        <div className="text-center animate-fade-in">
          <div className="w-24 h-24 mx-auto mb-6">
            <div className={`w-full h-full bg-gradient-to-br ${currentColor} rounded-full flex items-center justify-center shadow-lg`}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Result Card */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border-2 shadow-xl p-8 space-y-6 animate-slide-up">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-gray-900">{typeInfo.title}</h1>
            <div className={`w-32 h-1 mx-auto bg-gradient-to-r ${currentColor} rounded-full`}></div>
            <p className="text-lg text-gray-700">{typeInfo.description}</p>
          </div>

          {/* Confidence Badge */}
          {result.confidence && (
            <div className="flex justify-center">
              <span
                className={`px-4 py-2 rounded-full text-sm font-semibold ${
                  result.confidence === "high"
                    ? "bg-green-100 text-green-800"
                    : result.confidence === "medium"
                    ? "bg-indigo-100 text-indigo-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                Confidence: {result.confidence.charAt(0).toUpperCase() + result.confidence.slice(1)}
              </span>
            </div>
          )}

          {/* Persona */}
          {result.persona && (
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-6 border-2 border-indigo-200">
              <h3 className="text-lg font-semibold text-indigo-900 mb-2">Your UI Persona</h3>
              <p className="text-xl font-bold text-indigo-700">{result.persona}</p>
            </div>
          )}

          {/* Explanation/Reasoning */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Assessment Summary</h3>
            <p className="text-gray-700 leading-relaxed">{result.reasoning || result.explanation}</p>
          </div>

          {/* Recommended UI Features */}
          {result.recommended_ui_features && result.recommended_ui_features.length > 0 && (
            <div className="bg-indigo-50 rounded-xl p-6 border-2 border-indigo-200">
              <h3 className="text-lg font-semibold text-indigo-900 mb-4">Recommended UI Features</h3>
              <ul className="space-y-3">
                {result.recommended_ui_features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${currentColor} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-gray-700 leading-relaxed">{feature}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              onClick={() => router.push(typeInfo.route)}
              className={`flex-1 px-8 py-4 rounded-full ${currentButton} text-white font-semibold shadow-lg transition-all hover:scale-105 text-lg`}
            >
              Explore {typeInfo.title}
            </button>
            <button
              onClick={() => router.push("/assessment")}
              className="flex-1 px-8 py-4 rounded-full border-2 border-indigo-300 text-indigo-700 font-semibold hover:bg-indigo-100 transition-colors text-lg"
            >
              Retake Assessment
            </button>
          </div>

          {/* Info Note */}
          <div className="text-center pt-4">
            <p className="text-sm text-gray-600">
              This assessment is for informational purposes only and is not a substitute for professional medical diagnosis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

