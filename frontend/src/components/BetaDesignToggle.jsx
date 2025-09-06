import React from 'react';
import { useGlobalProvider } from '../context/GlobalProvider';

/**
 * Floating toggle button to switch between default and beta design modes.
 */
const BetaDesignToggle = () => {
  const { betaDesign, toggleBetaDesign } = useGlobalProvider();
  return (
    <button
      onClick={toggleBetaDesign}
      type="button"
      className={`fixed z-50 left-4 bottom-20 md:bottom-24 px-4 py-2 rounded-full font-semibold text-[13px] shadow-lg transition group
        ${betaDesign ? 'bg-accent text-white' : 'bg-white/80 text-accent border border-accent/30 backdrop-blur-md'}
        hover:scale-105 hover:shadow-xl backdrop-saturate-150`}
      aria-pressed={betaDesign}
      aria-label={betaDesign ? 'Disable Beta Design' : 'Enable Beta Design'}
    >
      <span className="flex items-center gap-2">
        <span className="inline-block w-2.5 h-2.5 rounded-full shadow-inner ring-2 ring-white/50"
          style={{
            background: betaDesign ? 'linear-gradient(135deg,#5b7bff,#c343ff)' : '#bbb'
          }} />
        {betaDesign ? 'BETA ON' : 'NEW DESIGN'}
      </span>
    </button>
  );
};

export default BetaDesignToggle;
