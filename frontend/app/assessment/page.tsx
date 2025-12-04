"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type FormData = {
  email: string;
  age: string;
  // Focus & Attention Patterns
  q1: string; // lose focus
  q2: string; // start tasks but leave unfinished
  q3: string; // struggle to organize
  q4: string; // avoid tasks requiring focus
  q5: string; // misplace items
  // Energy & Impulsivity Patterns
  q6: string; // restless/fidgety
  q7: string; // interrupt others
  q8: string; // switch tasks quickly
  // Time Management
  q9: string; // time blindness
  q10: string; // multiple tasks pattern
  q11: string; // forget appointments
  // Social & Work Environment
  q12: string; // work/study setting
  q13: string; // feel supported
  // Sensory & Distractibility
  q14: string; // environment for focus
  q15: string; // type of distraction
  q16: string; // emotional swings
  q17: string; // stress worsens focus
};

export default function AssessmentPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    email: "",
    age: "",
    q1: "",
    q2: "",
    q3: "",
    q4: "",
    q5: "",
    q6: "",
    q7: "",
    q8: "",
    q9: "",
    q10: "",
    q11: "",
    q12: "",
    q13: "",
    q14: "",
    q15: "",
    q16: "",
    q17: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const isFormValid = (): boolean => {
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return false;
    }
    if (!formData.age) {
      return false;
    }
    // Check all questions (q1 through q17)
    const questionKeys: Array<keyof FormData> = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10', 'q11', 'q12', 'q13', 'q14', 'q15', 'q16', 'q17'];
    return questionKeys.every(key => formData[key] && formData[key].trim() !== '');
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!formData.age) {
      newErrors.age = "Age is required";
    }

    // Validate all questions
    const questionKeys: Array<keyof FormData> = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10', 'q11', 'q12', 'q13', 'q14', 'q15', 'q16', 'q17'];
    questionKeys.forEach(key => {
      if (!formData[key] || formData[key].trim() === '') {
        newErrors[key] = "This question is required";
      }
    });

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

  const defaultOptions = [
    { value: "never", label: "Never" },
    { value: "rarely", label: "Rarely" },
    { value: "sometimes", label: "Sometimes" },
    { value: "often", label: "Often" },
    { value: "very-often", label: "Very Often" },
  ];

  const supportOptions = [
    { value: "not-at-all", label: "Not at all" },
    { value: "slightly", label: "Slightly" },
    { value: "moderately", label: "Moderately" },
    { value: "very", label: "Very" },
    { value: "extremely", label: "Extremely supported" },
  ];

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
                <label htmlFor="email" className="block text-sm font-medium text-indigo-900 mb-2">
                  Email <span className="text-indigo-600">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className={`w-full rounded-lg border-2 ${
                    errors.email ? "border-red-300" : "border-indigo-200"
                  } bg-white px-4 py-2 text-indigo-900 focus:border-indigo-400 focus:outline-none transition-colors`}
                  placeholder="Enter your email"
                />
                {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="age" className="block text-sm font-medium text-indigo-900 mb-2">
                  Age <span className="text-indigo-600">*</span>
                </label>
                <select
                  id="age"
                  value={formData.age}
                  onChange={(e) => handleChange("age", e.target.value)}
                  className={`w-full rounded-lg border-2 ${
                    errors.age ? "border-red-300" : "border-indigo-200"
                  } bg-white px-4 py-2 text-indigo-900 focus:border-indigo-400 focus:outline-none transition-colors`}
                >
                  <option value="">Select an option</option>
                  <option value="<18">&lt;18</option>
                  <option value="18-45">18-45</option>
                  <option value="45<">45&lt;</option>
                </select>
                {errors.age && <p className="mt-1 text-sm text-red-600">{errors.age}</p>}
              </div>
            </div>

            {/* Assessment Questions */}
            <div className="space-y-8 pt-4">
              {/* Subsection: Focus & Attention Patterns */}
              <div className="space-y-4">
                <div className="bg-indigo-100 rounded-lg p-4 border-2 border-indigo-300">
                  <h3 className="text-xl font-bold text-indigo-900 mb-2">Focus & Attention Patterns</h3>
                  <p className="text-sm text-indigo-700">
                    Helps us understand how easily you stay focused, organized, and on track during everyday tasks.
                  </p>
                </div>

                <QuestionField
                  id="q1"
                  number={1}
                  label="How often do you lose focus or get distracted during tasks requiring sustained attention?"
                  value={formData.q1}
                  onChange={(value) => handleChange("q1", value)}
                  options={defaultOptions}
                  error={errors.q1}
                />

                <QuestionField
                  id="q2"
                  number={2}
                  label="How often do you start tasks but leave them unfinished because something else catches your attention?"
                  value={formData.q2}
                  onChange={(value) => handleChange("q2", value)}
                  options={defaultOptions}
                  error={errors.q2}
                />

                <QuestionField
                  id="q3"
                  number={3}
                  label="How often do you struggle to organize tasks, schedules, or your workspace?"
                  value={formData.q3}
                  onChange={(value) => handleChange("q3", value)}
                  options={defaultOptions}
                  error={errors.q3}
                />

                <QuestionField
                  id="q4"
                  number={4}
                  label="How often do you avoid or postpone tasks that require long periods of focus?"
                  value={formData.q4}
                  onChange={(value) => handleChange("q4", value)}
                  options={defaultOptions}
                  error={errors.q4}
                />

                <QuestionField
                  id="q5"
                  number={5}
                  label="How often do you misplace or lose important items (keys, phone, documents)?"
                  value={formData.q5}
                  onChange={(value) => handleChange("q5", value)}
                  options={defaultOptions}
                  error={errors.q5}
                />
              </div>

              {/* Subsection: Energy & Impulsivity Patterns */}
              <div className="space-y-4">
                <div className="bg-indigo-100 rounded-lg p-4 border-2 border-indigo-300">
                  <h3 className="text-xl font-bold text-indigo-900 mb-2">Energy & Impulsivity Patterns</h3>
                  <p className="text-sm text-indigo-700">
                    Shows how your natural energy levels, restlessness, or quick reactions shape the way you work through tasks.
                  </p>
                </div>

                <QuestionField
                  id="q6"
                  number={6}
                  label="How often do you feel restless, fidgety, or &quot;on the go&quot;?"
                  value={formData.q6}
                  onChange={(value) => handleChange("q6", value)}
                  options={defaultOptions}
                  error={errors.q6}
                />

                <QuestionField
                  id="q7"
                  number={7}
                  label="How often do you interrupt others or speak before they finish?"
                  value={formData.q7}
                  onChange={(value) => handleChange("q7", value)}
                  options={defaultOptions}
                  error={errors.q7}
                />

                <QuestionField
                  id="q8"
                  number={8}
                  label="How often do you quickly switch tasks without finishing the previous one?"
                  value={formData.q8}
                  onChange={(value) => handleChange("q8", value)}
                  options={defaultOptions}
                  error={errors.q8}
                />
              </div>

              {/* Subsection: Time Management */}
              <div className="space-y-4">
                <div className="bg-indigo-100 rounded-lg p-4 border-2 border-indigo-300">
                  <h3 className="text-xl font-bold text-indigo-900 mb-2">Time Management</h3>
                  <p className="text-sm text-indigo-700">
                    Helps us learn how you plan, start, and finish tasks so we can structure your schedule in a way that fits you.
                  </p>
                </div>

                <QuestionField
                  id="q9"
                  number={9}
                  label="How often do you underestimate how long a task will take (time blindness)?"
                  value={formData.q9}
                  onChange={(value) => handleChange("q9", value)}
                  options={defaultOptions}
                  error={errors.q9}
                />

                <QuestionField
                  id="q10"
                  number={10}
                  label="When you have multiple tasks, which pattern best describes you?"
                  value={formData.q10}
                  onChange={(value) => handleChange("q10", value)}
                  options={[
                    { value: "complete-one", label: "Complete one fully" },
                    { value: "switch-often", label: "Switch often" },
                    { value: "start-many", label: "Start many, finish few" },
                    { value: "avoid-urgent", label: "Avoid until urgent" },
                    { value: "depends", label: "Depends on the day" },
                  ]}
                  error={errors.q10}
                />

                <QuestionField
                  id="q11"
                  number={11}
                  label="How often do you forget appointments, deadlines, or daily responsibilities?"
                  value={formData.q11}
                  onChange={(value) => handleChange("q11", value)}
                  options={defaultOptions}
                  error={errors.q11}
                />
              </div>

              {/* Subsection: Social & Work Environment */}
              <div className="space-y-4">
                <div className="bg-indigo-100 rounded-lg p-4 border-2 border-indigo-300">
                  <h3 className="text-xl font-bold text-indigo-900 mb-2">Social & Work Environment</h3>
                  <p className="text-sm text-indigo-700">
                    Tells us about the people and surroundings you interact with so we can tailor support to your daily context.
                  </p>
                </div>

                <QuestionField
                  id="q12"
                  number={12}
                  label="Which environment best describes your daily work/study setting?"
                  value={formData.q12}
                  onChange={(value) => handleChange("q12", value)}
                  options={[
                    { value: "structured", label: "Structured" },
                    { value: "interruptions", label: "Interruptions" },
                    { value: "fast-paced", label: "Fast-paced" },
                    { value: "remote", label: "Remote" },
                    { value: "unstructured", label: "Unstructured" },
                  ]}
                  error={errors.q12}
                />

                <RadioField
                  id="q13"
                  number={13}
                  label="How supported do you feel by the people around you in managing tasks and responsibilities?"
                  value={formData.q13}
                  onChange={(value) => handleChange("q13", value)}
                  options={supportOptions}
                  error={errors.q13}
                />
              </div>

              {/* Subsection: Sensory & Distractibility factors */}
              <div className="space-y-4">
                <div className="bg-indigo-100 rounded-lg p-4 border-2 border-indigo-300">
                  <h3 className="text-xl font-bold text-indigo-900 mb-2">Sensory & Distractibility factors</h3>
                  <p className="text-sm text-indigo-700">
                    Helps us understand what environmental factors (noise, visuals, movement) affect your focus the most.
                  </p>
                </div>

                <QuestionField
                  id="q14"
                  number={14}
                  label="Which environment helps you focus the best?"
                  value={formData.q14}
                  onChange={(value) => handleChange("q14", value)}
                  options={[
                    { value: "quiet", label: "Quiet" },
                    { value: "background-music", label: "Background music" },
                    { value: "busy", label: "Busy" },
                    { value: "depends", label: "Depends" },
                  ]}
                  error={errors.q14}
                />

                <QuestionField
                  id="q15"
                  number={15}
                  label="Which type of distraction disrupts you the most?"
                  value={formData.q15}
                  onChange={(value) => handleChange("q15", value)}
                  options={[
                    { value: "noise", label: "Noise" },
                    { value: "visual-movement", label: "Visual movement" },
                    { value: "interruptions", label: "Interruptions" },
                    { value: "notifications", label: "Notifications" },
                    { value: "internal-thoughts", label: "Internal thoughts" },
                  ]}
                  error={errors.q15}
                />

                <QuestionField
                  id="q16"
                  number={16}
                  label="How often do emotional swings (frustration, overwhelm, irritability) affect your task performance?"
                  value={formData.q16}
                  onChange={(value) => handleChange("q16", value)}
                  options={defaultOptions}
                  error={errors.q16}
                />

                <QuestionField
                  id="q17"
                  number={17}
                  label="How often does stress worsen your ability to focus or complete tasks?"
                  value={formData.q17}
                  onChange={(value) => handleChange("q17", value)}
                  options={defaultOptions}
                  error={errors.q17}
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
              disabled={!isFormValid() || isSubmitting}
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
  number,
  label,
  value,
  onChange,
  options,
  error,
}: {
  id: string;
  number: number;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-indigo-900 mb-2">
        {number}. {label} <span className="text-indigo-600">*</span>
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

function RadioField({
  id,
  number,
  label,
  value,
  onChange,
  options,
  error,
}: {
  id: string;
  number: number;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  error?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-indigo-900 mb-3">
        {number}. {label} <span className="text-indigo-600">*</span>
      </label>
      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option.value}
            htmlFor={`${id}-${option.value}`}
            className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border-2 border-indigo-200 hover:bg-indigo-50 transition-colors"
          >
            <input
              type="radio"
              id={`${id}-${option.value}`}
              name={id}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(e.target.value)}
              className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 focus:ring-2"
            />
            <span className="text-indigo-900">{option.label}</span>
          </label>
        ))}
      </div>
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
