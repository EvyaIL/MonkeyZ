import React from 'react';
import { useTranslation } from 'react-i18next';

const SingleRangeInput = ({ value, onChange, min, max }) => {
  const { i18n } = useTranslation();
  const lang = i18n.language || "he";
  const isRTL = lang === "he";

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          className="w-full accent-accent"
        />
      </div>
      <div className={`flex justify-center items-center`}>
        <input
          type="number"
          className="w-24 p-2 bg-gray-900 text-white border border-gray-600 rounded-md text-center"
          value={value}
          min={min}
          max={max}
          step={1}
          onChange={(e) => {
            const val = e.target.value;
            if (/^\d{0,3}$/.test(val)) {
              onChange(Math.max(min, Math.min(max, parseInt(val) || min)));
            }
          }}
        />
      </div>
    </div>
  );
};

export default SingleRangeInput;
