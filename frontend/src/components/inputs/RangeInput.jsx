import React from "react";
import Slider, { Range } from "rc-slider";
import "rc-slider/assets/index.css";
import { useTranslation } from "react-i18next";

const RangeInput = ({ value, onChange }) => {
  const { i18n } = useTranslation();
  const lang = i18n.language || "he";
  const isRTL = lang === "he";
  const sliderMin = 0;
  const sliderMax = 200;

  const handleChange = (vals) => {
    onChange({ min: vals[0], max: vals[1] });
  };

  // Improved input logic: allow any valid number, but only update if valid
  const handleInput = (side, e) => {
    const val = e.target.value;
    // Only allow numbers, no leading zeros, and max 3 digits
    if (!/^\d{0,3}$/.test(val)) return;
    let v = parseInt(val, 10);
    if (isNaN(v)) v = side === "min" ? sliderMin : sliderMax;
    if (side === "min") {
      if (v < sliderMin || v >= value.max) return;
      onChange({ min: v, max: value.max });
    } else {
      if (v > sliderMax || v <= value.min) return;
      onChange({ min: value.min, max: v });
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <Range
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
              value={value.min}
              min={sliderMin}
              max={value.max - 1}
              step={1}
              onInput={e => handleInput("min", e)}
            />
            <span className="text-white mx-2">-</span>
            <input
              type="number"
              className="w-24 p-2 bg-gray-900 text-white border border-gray-600 rounded-md text-center"
              value={value.max}
              min={value.min + 1}
              max={sliderMax}
              step={1}
              onInput={e => handleInput("max", e)}
            />
          </>
        ) : (
          <>
            <input
              type="number"
              className="w-24 p-2 bg-gray-900 text-white border border-gray-600 rounded-md text-center"
              value={value.min}
              min={sliderMin}
              max={value.max - 1}
              step={1}
              onInput={e => handleInput("min", e)}
            />
            <span className="text-white mx-2">-</span>
            <input
              type="number"
              className="w-24 p-2 bg-gray-900 text-white border border-gray-600 rounded-md text-center"
              value={value.max}
              min={value.min + 1}
              max={sliderMax}
              step={1}
              onInput={e => handleInput("max", e)}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default RangeInput;
