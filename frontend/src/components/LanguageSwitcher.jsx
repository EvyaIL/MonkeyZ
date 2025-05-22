import React from "react";
import { useTranslation } from "react-i18next";

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  
  return (
    <div className="flex gap-2 items-center" role="region" aria-label="Language selection">
      <button
        onClick={() => i18n.changeLanguage("he")}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200 
          ${i18n.language === "he" 
            ? "bg-accent text-white shadow-sm" 
            : "bg-white text-accent hover:bg-accent/10"}`}
        aria-pressed={i18n.language === "he"}
        aria-label="Switch to Hebrew"
      >
        עברית
      </button>
      <button
        onClick={() => i18n.changeLanguage("en")}
        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200
          ${i18n.language === "en" 
            ? "bg-accent text-white shadow-sm" 
            : "bg-white text-accent hover:bg-accent/10"}`}
        aria-pressed={i18n.language === "en"}
        aria-label="Switch to English"
      >
        English
      </button>
    </div>
  );
};

export default LanguageSwitcher;
