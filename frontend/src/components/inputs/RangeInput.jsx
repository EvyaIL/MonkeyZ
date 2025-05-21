import React, { useState, useEffect } from "react";
import { default as Slider } from "rc-slider";
import "rc-slider/assets/index.css";
import { useTranslation } from "react-i18next";

const RangeInput = ({ value, onChange }) => {
  const { i18n } = useTranslation();
  const lang = i18n.language || "he";
  const isRTL = lang === "he";
  const sliderMin = 0;
  const sliderMax = 200;

  // Local state for input values to allow intermediate typing
  const [minInputValue, setMinInputValue] = useState(String(value.min));
  const [maxInputValue, setMaxInputValue] = useState(String(value.max));

  // Sync local input states if prop value changes (e.g., from slider drag)
  useEffect(() => {
    setMinInputValue(String(value.min));
    setMaxInputValue(String(value.max));
  }, [value.min, value.max]);

  const handleChange = (vals) => {
    onChange({ min: vals[0], max: vals[1] });
  };

  const handleMinInput = (e) => {
    const val = e.target.value;
    if (/^\d{0,3}$/.test(val)) { // Allow up to 3 digits, numeric only
      setMinInputValue(val);
    }
  };

  const handleMaxInput = (e) => {
    const val = e.target.value;
    if (/^\d{0,3}$/.test(val)) { // Allow up to 3 digits, numeric only
      setMaxInputValue(val);
    }
  };

  const handleMinBlur = () => {
    let parsedMin = parseInt(minInputValue, 10);
    if (minInputValue === '' || isNaN(parsedMin)) {
      parsedMin = sliderMin;
    }
    parsedMin = Math.max(sliderMin, Math.min(sliderMax, parsedMin));

    if (parsedMin >= value.max) {
      onChange({ min: Math.max(sliderMin, value.max - 1), max: value.max });
    } else {
      onChange({ min: parsedMin, max: value.max });
    }
  };

  const handleMaxBlur = () => {
    let parsedMax = parseInt(maxInputValue, 10);
    if (maxInputValue === '' || isNaN(parsedMax)) {
      parsedMax = sliderMax;
    }
    parsedMax = Math.max(sliderMin, Math.min(sliderMax, parsedMax));

    if (parsedMax <= value.min) {
      onChange({ min: value.min, max: Math.min(sliderMax, value.min + 1) });
    } else {
      onChange({ min: value.min, max: parsedMax });
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <Slider
        range
        min={sliderMin}
        max={sliderMax}
        value={[value.min, value.max]}
        onChange={handleChange}
        allowCross={false}
        step={1}
        trackStyle={[{ backgroundColor: '#22c55e', height: 8 }]}
        handleStyle={[
          { borderColor: '#22c55e', height: 24, width: 24, marginTop: -8, backgroundColor: '#fff' },
          { borderColor: '#22c55e', height: 24, width: 24, marginTop: -8, backgroundColor: '#fff' }
        ]}
        railStyle={{ backgroundColor: '#374151', height: 8 }}
        dir={isRTL ? "rtl" : "ltr"}
      />
      <div className={`flex justify-between items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
        {isRTL ? (
          <>
            <input
              type="number"
              className="w-24 p-2 bg-gray-900 text-white border border-gray-600 rounded-md text-center"
              value={minInputValue}
              min={sliderMin}
              max={sliderMax}
              step={1}
              onInput={handleMinInput}
              onBlur={handleMinBlur}
            />
            <span className="text-white mx-2">-</span>
            <input
              type="number"
              className="w-24 p-2 bg-gray-900 text-white border border-gray-600 rounded-md text-center"
              value={maxInputValue}
              min={sliderMin}
              max={sliderMax}
              step={1}
              onInput={handleMaxInput}
              onBlur={handleMaxBlur}
            />
          </>
        ) : (
          <>
            <input
              type="number"
              className="w-24 p-2 bg-gray-900 text-white border border-gray-600 rounded-md text-center"
              value={minInputValue}
              min={sliderMin}
              max={sliderMax}
              step={1}
              onInput={handleMinInput}
              onBlur={handleMinBlur}
            />
            <span className="text-white mx-2">-</span>
            <input
              type="number"
              className="w-24 p-2 bg-gray-900 text-white border border-gray-600 rounded-md text-center"
              value={maxInputValue}
              min={sliderMin}
              max={sliderMax}
              step={1}
              onInput={handleMaxInput}
              onBlur={handleMaxBlur}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default RangeInput;
