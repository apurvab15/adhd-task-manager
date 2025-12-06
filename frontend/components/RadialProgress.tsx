"use client";

type RadialProgressProps = {
  percentage: number;
  emoji: string;
  size?: number;
  strokeWidth?: number;
};

export default function RadialProgress({ 
  percentage, 
  emoji, 
  size = 120, 
  strokeWidth = 8 
}: RadialProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-zinc-200"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-violet-500 transition-all duration-500"
        />
      </svg>
      {/* Emoji in center */}
      <div className="absolute inset-0 flex items-center justify-center" style={{ fontSize: `${size * 0.35}px` }}>
        {emoji}
      </div>
    </div>
  );
}

