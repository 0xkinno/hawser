"use client";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);
  return (
    <button type="button" className="btn toggle" aria-pressed={dark} onClick={() => setDark((d) => !d)}>
      {dark ? "Light theme" : "Dark theme"}
    </button>
  );
}
