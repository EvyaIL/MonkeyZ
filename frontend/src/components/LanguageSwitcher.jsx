import React from "react";
import { useTranslation } from "react-i18next";

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  return (
    <div className="flex gap-2 items-center">
      <button
        onClick={() => i18n.changeLanguage("he")}
        className={`px-2 py-1 rounded ${i18n.language === "he" ? "bg-accent text-white" : "bg-gray-700 text-gray-200"}`}
      >
        עברית (ברירת מחדל)
      </button>
      <button
        onClick={() => i18n.changeLanguage("en")}
        className={`px-2 py-1 rounded ${i18n.language === "en" ? "bg-accent text-white" : "bg-gray-700 text-gray-200"}`}
      >
        English
      </button>
    </div>
  );
};

export default LanguageSwitcher;
