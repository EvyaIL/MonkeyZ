import React from 'react';
import { useTranslation } from 'react-i18next';

const TrustpilotWidget = React.memo(() => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'en';

  const handleClick = () => {
    window.open('https://www.trustpilot.com/review/monkeyz.co.il', '_blank', 'noopener,noreferrer');
  };

  // Trustpilot on the right side to avoid collision with theme toggle
  const positionClass = isRTL ? 'left-20' : 'right-20';

  return (
    <button
      id="our-custom-trustpilot-button"
      onClick={handleClick}
      className={`fixed bottom-4 ${positionClass} p-3 rounded-full bg-green-600 hover:bg-green-700 transition-colors z-40 shadow-lg group`}
      aria-label={t("trustpilot_reviews", "View our Trustpilot reviews")}
      title={t("trustpilot_reviews", "View our Trustpilot reviews")}
    >
      <div className="flex items-center gap-2">
        <svg 
          width="28" 
          height="28" 
          viewBox="0 0 24 24" 
          fill="white" 
          xmlns="http://www.w3.org/2000/svg"
          className="flex-shrink-0"
        >
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
        </svg>
        <span className="text-white font-semibold text-sm hidden group-hover:block whitespace-nowrap">
          {t("trustpilot", "Trustpilot")}
        </span>
      </div>
    </button>
  );
});

// Set display name for debugging
TrustpilotWidget.displayName = 'TrustpilotWidget';

export default TrustpilotWidget;
