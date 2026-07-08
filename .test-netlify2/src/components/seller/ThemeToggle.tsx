"use client";

import { useState } from "react";
import { Moon, Sun } from "lucide-react";

import { api } from "@/lib/client/api";

export function ThemeToggle({ initial }: { initial: string }) {
  const [theme, setTheme] = useState(initial === "light" ? "light" : "dark");

  async function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    await api("/api/user/preferences", { method: "PATCH", body: { theme: next } });
  }

  return (
    <button
      onClick={toggle}
      className="flex h-9 w-9 items-center justify-center rounded-full text-ink-dim transition-colors hover:bg-hover hover:text-ink"
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
