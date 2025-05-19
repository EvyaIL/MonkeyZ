import React from "react";
import { useTheme } from "../context/ThemeContext";

const ThemeSwitcher = () => {
  const { theme, setTheme, themes } = useTheme();

  return (
    <div className="relative inline-block">
      <select
        className="bg-secondary text-accent rounded px-2 py-1 mx-2 pr-8 appearance-none"
        value={theme}
        onChange={e => setTheme(e.target.value)}
        aria-label="Switch theme"
        style={{ direction: 'rtl' }}
      >
        {themes.map(t => (
          <option key={t.value} value={t.value}>
            {t.name}
          </option>
        ))}
      </select>
      {/* Custom arrow on the left */}
      <span
        className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2 text-accent"
        style={{ top: 0, bottom: 0 }}
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </span>
    </div>
  );
};

export default ThemeSwitcher;
