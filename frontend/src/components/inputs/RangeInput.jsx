import React, { useState, useEffect } from "react";
import { Slider } from "@mui/material";
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

  // Sync local input states if prop value changes
  useEffect(() => {
    setMinInputValue(String(value.min));
    setMaxInputValue(String(value.max));
  }, [value.min, value.max]);

  const handleSliderChange = (_, newValue) => {
    onChange({ min: newValue[0], max: newValue[1] });
  };

  const handleMinInput = (e) => {
    const val = e.target.value;
    if (/^\d{0,3}$/.test(val)) {
      setMinInputValue(val);
      const numVal = parseInt(val, 10);
      if (!isNaN(numVal) && numVal >= sliderMin && numVal <= value.max) {
        onChange({ min: numVal, max: value.max });
      }
    }
  };

  const handleMaxInput = (e) => {
    const val = e.target.value;
    if (/^\d{0,3}$/.test(val)) {
      setMaxInputValue(val);
      const numVal = parseInt(val, 10);
      if (!isNaN(numVal) && numVal <= sliderMax && numVal >= value.min) {
        onChange({ min: value.min, max: numVal });
      }
    }
  };

  const handleMinBlur = () => {
    let parsedMin = parseInt(minInputValue, 10);
    if (minInputValue === '' || isNaN(parsedMin) || parsedMin < sliderMin) {
      parsedMin = sliderMin;
    } else if (parsedMin > value.max) {
      parsedMin = value.max - 1;
    }
    setMinInputValue(String(parsedMin));
    onChange({ min: parsedMin, max: value.max });
  };

  const handleMaxBlur = () => {
    let parsedMax = parseInt(maxInputValue, 10);
    if (maxInputValue === '' || isNaN(parsedMax) || parsedMax > sliderMax) {
      parsedMax = sliderMax;
    } else if (parsedMax < value.min) {
      parsedMax = value.min + 1;
    }
    setMaxInputValue(String(parsedMax));
    onChange({ min: value.min, max: parsedMax });
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <Slider
        getAriaLabel={() => 'Price range'}
        value={[value.min, value.max]}
        onChange={handleSliderChange}
        min={sliderMin}
        max={sliderMax}
        step={1}
        disableSwap
        sx={{
          width: '100%',
          '& .MuiSlider-thumb': {
            height: 24,
            width: 24,
            backgroundColor: '#fff',
            border: '2px solid #22c55e',
            '&:focus, &:hover, &.Mui-active': {
              boxShadow: 'inherit',
            },
          },
          '& .MuiSlider-track': {
            height: 8,
            backgroundColor: '#22c55e',
          },
          '& .MuiSlider-rail': {
            height: 8,
            backgroundColor: '#374151',
          },
        }}
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
              onChange={handleMinInput}
              onBlur={handleMinBlur}
            />
            <span className="text-white mx-2">-</span>
            <input
              type="number"
              className="w-24 p-2 bg-gray-900 text-white border border-gray-600 rounded-md text-center"
              value={maxInputValue}
              min={sliderMin}
              max={sliderMax}
              onChange={handleMaxInput}
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
              onChange={handleMinInput}
              onBlur={handleMinBlur}
            />
            <span className="text-white mx-2">-</span>
            <input
              type="number"
              className="w-24 p-2 bg-gray-900 text-white border border-gray-600 rounded-md text-center"
              value={maxInputValue}
              min={sliderMin}
              max={sliderMax}
              onChange={handleMaxInput}
              onBlur={handleMaxBlur}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default RangeInput;
