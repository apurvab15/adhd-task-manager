"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type FormData = {
  name: string;
  age: string;
  concentration: string;
  organization: string;
  forgetfulness: string;
  restlessness: string;
  impulsivity: string;
  listening: string;
  followThrough: string;
  fidgeting: string;
  interrupting: string;
  waiting: string;
  details: string;
  activities: string;
  symptoms: string;
  duration: string;
  impact: string;
};

export default function AssessmentPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    name: "",
    age: "",
    concentration: "",
    organization: "",
    forgetfulness: "",
    restlessness: "",
    impulsivity: "",
    listening: "",
    followThrough: "",
    fidgeting: "",
    interrupting: "",
    waiting: "",
    details: "",
    activities: "",
    symptoms: "",
    duration: "",
    impact: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!formData.age) {
      newErrors.age = "Age is required";
    }
    if (!formData.concentration) {
      newErrors.concentration = "Please answer this question";
    }
    if (!formData.organization) {
      newErrors.organization = "Please answer this question";
    }
    if (!formData.forgetfulness) {
      newErrors.forgetfulness = "Please answer this question";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Navigate to results page with form data
      const params = new URLSearchParams();
      Object.entries(formData).forEach(([key, value]) => {
        params.append(key, value);
      });
      
      router.push(`/results?${params.toString()}`);
    } catch (error) {
      console.error("Error submitting form:", error);
      setIsSubmitting(false);
      alert("An error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-indigo-900 mb-2">ADHD Assessment</h1>
          <p className="text-indigo-700">Please answer the following questions to help us understand your profile</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-indigo-200 shadow-lg p-6 space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-indigo-900 border-b border-indigo-200 pb-2">
                Personal Information
              </h2>
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-indigo-900 mb-2">
                  Name <span className="text-indigo-600">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className={`w-full rounded-lg border-2 ${
                    errors.name ? "border-red-300" : "border-indigo-200"
                  } bg-white px-4 py-2 text-indigo-900 focus:border-indigo-400 focus:outline-none transition-colors`}
                  placeholder="Enter your name"
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="age" className="block text-sm font-medium text-indigo-900 mb-2">
                  Age <span className="text-indigo-600">*</span>
                </label>
                <input
                  type="number"
                  id="age"
                  value={formData.age}
                  onChange={(e) => handleChange("age", e.target.value)}
                  className={`w-full rounded-lg border-2 ${
                    errors.age ? "border-red-300" : "border-indigo-200"
                  } bg-white px-4 py-2 text-indigo-900 focus:border-indigo-400 focus:outline-none transition-colors`}
                  placeholder="Enter your age"
                  min="1"
                  max="120"
                />
                {errors.age && <p className="mt-1 text-sm text-red-600">{errors.age}</p>}
              </div>
            </div>

            {/* Assessment Questions */}
            <div className="space-y-6 pt-4">
              <h2 className="text-2xl font-semibold text-indigo-900 border-b border-indigo-200 pb-2">
                Assessment Questions
              </h2>

              <QuestionField
                id="concentration"
                label="How often do you have difficulty sustaining attention in tasks or activities (e.g., during lectures, conversations, or lengthy reading)?"
                value={formData.concentration}
                onChange={(value) => handleChange("concentration", value)}
                error={errors.concentration}
                required
              />

              <QuestionField
                id="organization"
                label="How often do you have difficulty organizing tasks and activities?"
                value={formData.organization}
                onChange={(value) => handleChange("organization", value)}
                error={errors.organization}
                required
              />

              <QuestionField
                id="forgetfulness"
                label="How often are you forgetful in daily activities (e.g., missing appointments, forgetting to return calls)?"
                value={formData.forgetfulness}
                onChange={(value) => handleChange("forgetfulness", value)}
                error={errors.forgetfulness}
                required
              />

              <QuestionField
                id="listening"
                label="How often do you have difficulty listening when spoken to directly (mind seems elsewhere)?"
                value={formData.listening}
                onChange={(value) => handleChange("listening", value)}
                error={errors.listening}
              />

              <QuestionField
                id="followThrough"
                label="How often do you fail to follow through on instructions or fail to finish tasks at work or home?"
                value={formData.followThrough}
                onChange={(value) => handleChange("followThrough", value)}
                error={errors.followThrough}
              />

              <QuestionField
                id="restlessness"
                label="How often do you feel restless or fidgety?"
                value={formData.restlessness}
                onChange={(value) => handleChange("restlessness", value)}
                error={errors.restlessness}
              />

              <QuestionField
                id="fidgeting"
                label="How often do you fidget with or tap your hands or feet, or squirm in your seat?"
                value={formData.fidgeting}
                onChange={(value) => handleChange("fidgeting", value)}
                error={errors.fidgeting}
              />

              <QuestionField
                id="impulsivity"
                label="How often do you act impulsively or without thinking things through?"
                value={formData.impulsivity}
                onChange={(value) => handleChange("impulsivity", value)}
                error={errors.impulsivity}
              />

              <QuestionField
                id="interrupting"
                label="How often do you interrupt others or intrude on conversations?"
                value={formData.interrupting}
                onChange={(value) => handleChange("interrupting", value)}
                error={errors.interrupting}
              />

              <QuestionField
                id="waiting"
                label="How often do you have difficulty waiting your turn in conversations or activities?"
                value={formData.waiting}
                onChange={(value) => handleChange("waiting", value)}
                error={errors.waiting}
              />

              <QuestionField
                id="details"
                label="How often do you make careless mistakes or miss details in work or other activities?"
                value={formData.details}
                onChange={(value) => handleChange("details", value)}
                error={errors.details}
              />

              <QuestionField
                id="activities"
                label="How often do you avoid or dislike tasks that require sustained mental effort?"
                value={formData.activities}
                onChange={(value) => handleChange("activities", value)}
                error={errors.activities}
              />

              <div>
                <label htmlFor="symptoms" className="block text-sm font-medium text-indigo-900 mb-2">
                  Have you experienced these symptoms since childhood?
                </label>
                <select
                  id="symptoms"
                  value={formData.symptoms}
                  onChange={(e) => handleChange("symptoms", e.target.value)}
                  className="w-full rounded-lg border-2 border-indigo-200 bg-white px-4 py-2 text-indigo-900 focus:border-indigo-400 focus:outline-none transition-colors"
                >
                  <option value="">Select an option</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                  <option value="unsure">Not sure</option>
                </select>
              </div>

              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-indigo-900 mb-2">
                  How long have you been experiencing these symptoms?
                </label>
                <select
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => handleChange("duration", e.target.value)}
                  className="w-full rounded-lg border-2 border-indigo-200 bg-white px-4 py-2 text-indigo-900 focus:border-indigo-400 focus:outline-none transition-colors"
                >
                  <option value="">Select an option</option>
                  <option value="childhood">Since childhood</option>
                  <option value="recent">Recently (last few years)</option>
                  <option value="lifelong">Lifelong</option>
                  <option value="unknown">Not sure</option>
                </select>
              </div>

              <div>
                <label htmlFor="impact" className="block text-sm font-medium text-indigo-900 mb-2">
                  How do these symptoms impact your daily life?
                </label>
                <textarea
                  id="impact"
                  value={formData.impact}
                  onChange={(e) => handleChange("impact", e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border-2 border-indigo-200 bg-white px-4 py-2 text-indigo-900 focus:border-indigo-400 focus:outline-none transition-colors resize-none"
                  placeholder="Describe how these symptoms affect your work, relationships, and daily activities..."
                />
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-8 py-3 rounded-full border-2 border-indigo-300 text-indigo-700 font-semibold hover:bg-indigo-100 transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 rounded-full bg-indigo-600 text-white font-semibold shadow-lg shadow-indigo-500/50 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-600/60 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting..." : "Submit Assessment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function QuestionField({
  id,
  label,
  value,
  onChange,
  error,
  required = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
}) {
  const options = [
    { value: "never", label: "Never" },
    { value: "rarely", label: "Rarely" },
    { value: "sometimes", label: "Sometimes" },
    { value: "often", label: "Often" },
    { value: "very-often", label: "Very Often" },
  ];

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-indigo-900 mb-2">
        {label} {required && <span className="text-indigo-600">*</span>}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg border-2 ${
          error ? "border-red-300" : "border-indigo-200"
        } bg-white px-4 py-2 text-indigo-900 focus:border-indigo-400 focus:outline-none transition-colors`}
      >
        <option value="">Select an option</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
