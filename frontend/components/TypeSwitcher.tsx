"use client";

import Link from "next/link";

export type AdhdType = "inattentive" | "hyperactive" | "combined";

const OPTIONS: { type: AdhdType; href: string; label: string }[] = [
  { type: "inattentive", href: "/inattentive", label: "Inattentive" },
  { type: "hyperactive", href: "/hyperactive", label: "Hyperactive" },
  { type: "combined", href: "/combined", label: "Combined" },
];

type TypeSwitcherProps = {
  current: AdhdType;
};

export default function TypeSwitcher({ current }: TypeSwitcherProps) {
  return (
    <div className="flex items-center gap-2">
      <Link
        href="/"
        className="rounded-lg border border-zinc-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
      >
        Home
      </Link>
      <div className="flex items-center rounded-full border border-zinc-300 bg-white p-0.5 shadow-sm">
        {OPTIONS.map((option) => {
          const isActive = option.type === current;
          return (
            <Link
              key={option.type}
              href={option.href}
              aria-current={isActive ? "page" : undefined}
              className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors ${
                isActive
                  ? "bg-zinc-900 text-white shadow-sm"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
              }`}
            >
              {option.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
