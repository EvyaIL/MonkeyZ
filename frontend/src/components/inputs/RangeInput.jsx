import { useEffect, useState, useRef, useLayoutEffect } from "react";
import PointButton from "../buttons/PointButton";
import MovementWrapper from "../wrapper/MovementWrapper";
import PrimaryInput from "./PrimaryInput";

const scaleToPixels = (val, currentMin, currentMax, width) => {
  if (currentMax === currentMin || width <= 1) return 0;
  let percentage = (val - currentMin) / (currentMax - currentMin);
  percentage = Math.max(0, Math.min(1, percentage)); // Clamp percentage between 0 and 1
  return percentage * width;
};
const scaleToValue = (px, currentMin, currentMax, width) => {
  if (width <= 1) return currentMin;
  let value = (px / width) * (currentMax - currentMin) + currentMin;
  // Round to 2 decimal places for currency, then clamp
  value = parseFloat(value.toFixed(2)); 
  return Math.max(currentMin, Math.min(value, currentMax));
};

const RangeInput = ({ min, max, value, onChange }) => {
  const range = value;
  const [containerWidth, setContainerWidth] = useState(1);
  const containerRef = useRef(null);

  // Ensure min and max for scaleToPixels are always valid numbers
  const validMin = Number(min) || 0;
  const validMax = Number(max) || 0;

  const [rightPoint, setRightPoint] = useState({ x: scaleToPixels(value.max, validMin, validMax, containerWidth), y: -8 });
  const [leftPoint, setLeftPoint] = useState({ x: scaleToPixels(value.min, validMin, validMax, containerWidth), y: -8 });

  useLayoutEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  useEffect(() => {
    if (containerWidth > 1 && value && typeof value.min !== 'undefined' && typeof value.max !== 'undefined') {
      // Ensure min/max for scaling are valid numbers
      const currentMin = Number(min) || 0;
      const currentMax = Number(max) || 0;
      setLeftPoint({ x: scaleToPixels(value.min, currentMin, currentMax, containerWidth), y: -8 });
      setRightPoint({ x: scaleToPixels(value.max, currentMin, currentMax, containerWidth), y: -8 });
    }
  }, [value, containerWidth, min, max]);

  const handleDrag = (side, newX) => {
    // Ensure min/max for scaling are valid numbers
    const currentMin = Number(min) || 0;
    const currentMax = Number(max) || 0;

    let newValue = scaleToValue(newX, currentMin, currentMax, containerWidth);
    const currentVal = value;
    let updatedMin = parseFloat(currentVal.min.toFixed(2));
    let updatedMax = parseFloat(currentVal.max.toFixed(2));
    const step = 0.01; // Minimum difference between min and max

    if (side === "left") {
      newValue = Math.max(currentMin, newValue); // Ensure not less than overall min
      updatedMin = Math.min(newValue, updatedMax - step); // Ensure min is less than max
      updatedMin = parseFloat(updatedMin.toFixed(2));
    } else {
      newValue = Math.min(currentMax, newValue); // Ensure not more than overall max
      updatedMax = Math.max(newValue, updatedMin + step); // Ensure max is greater than min
      updatedMax = parseFloat(updatedMax.toFixed(2));
    }
    onChange({ min: updatedMin, max: updatedMax });
  };

  const handleInputChange = (side, val) => {
    let numVal = parseFloat(val);
    if (isNaN(numVal)) {
      // If input is not a number (e.g., empty string), revert to current value or min/max
      // This prevents NaN issues and allows clearing the input
      if (side === "left") numVal = value.min;
      else numVal = value.max;
    }

    // Regex to allow numbers with up to two decimal places
    const regex = /^\d*\.?\d{0,2}$/;
    if (val !== "" && !regex.test(val)) {
        // If the value is not empty and does not match the regex, do not update.
        // Or, alternatively, you could try to format it, but that might be aggressive.
        // For now, just prevent invalid format beyond two decimal places from being processed further.
        // We will re-evaluate if this feels too restrictive.
        return; 
    }

    numVal = parseFloat(parseFloat(val).toFixed(2)); // Ensure two decimal places
    if (isNaN(numVal)) { // Check again after toFixed, in case val was something like '.'
        if (side === "left") numVal = value.min;
        else numVal = value.max;
    }

    const currentVal = value;
    let updatedMin = parseFloat(currentVal.min.toFixed(2));
    let updatedMax = parseFloat(currentVal.max.toFixed(2));
    const step = 0.01; // Minimum difference

    // Ensure min/max for clamping are valid numbers
    const overallMin = Number(min) || 0;
    const overallMax = Number(max) || 0;

    if (side === "left") {
      updatedMin = Math.max(overallMin, Math.min(numVal, updatedMax - step));
      updatedMin = parseFloat(updatedMin.toFixed(2));
    } else {
      updatedMax = Math.min(overallMax, Math.max(numVal, updatedMin + step));
      updatedMax = parseFloat(updatedMax.toFixed(2));
    }
    onChange({ min: updatedMin, max: updatedMax });
  };

  // Determine a smaller, more sensitive gap for handle boundaries
  const handleMinGap = containerWidth > 20 ? 5 : containerWidth / 4; 

  return (
    <div className="flex flex-col w-full" aria-label="Price range slider">
      <div
        ref={containerRef}
        className="relative w-full h-2 bg-gray-700 rounded-lg mt-2 cursor-pointer"
      >
        <div
          className="absolute h-2 bg-green-500 rounded-lg"
          style={{
            left: `${scaleToPixels(value.min, Number(min) || 0, Number(max) || 0, containerWidth)}px`,
            width: `${scaleToPixels(value.max, Number(min) || 0, Number(max) || 0, containerWidth) - scaleToPixels(value.min, Number(min) || 0, Number(max) || 0, containerWidth)}px`,
          }}
          aria-hidden="true"
        />

        <MovementWrapper
          item={{ x: leftPoint.x, y: leftPoint.y }}
          setItem={(item) => handleDrag("left", item.x)}
          boundaries={{
            xMin: 0,
            xMax: scaleToPixels(value.max, Number(min) || 0, Number(max) || 0, containerWidth) - handleMinGap,
            yMin: -8,
            yMax: -8,
          }}
        >
          <div className="w-10 h-10 flex justify-center items-center -translate-x-5 -translate-y-2">
            <PointButton
              otherStyle=""
              current={true}
              ariaLabel="Minimum price handle"
            />
          </div>
        </MovementWrapper>

        <MovementWrapper
          item={{ x: rightPoint.x, y: rightPoint.y }}
          setItem={(item) => handleDrag("right", item.x)}
          boundaries={{
            xMin: scaleToPixels(value.min, Number(min) || 0, Number(max) || 0, containerWidth) + handleMinGap,
            xMax: containerWidth,
            yMin: -8,
            yMax: -8,
          }}
        >
          <div className="w-10 h-10 flex justify-center items-center -translate-x-5 -translate-y-2">
            <PointButton
              otherStyle=""
              current={true}
              ariaLabel="Maximum price handle"
            />
          </div>
        </MovementWrapper>
      </div>

      <div className="flex justify-between items-center mt-2 gap-2">
        <PrimaryInput
          min={min} // HTML5 min attribute for native validation hint
          max={value.max - 0.01} // HTML5 max attribute
          step="0.01" // Allow two decimal places
          onChange={(e) => handleInputChange("left", e.target.value)}
          type="number"
          value={value.min} // Controlled component
          otherStyle="w-24 p-2 bg-gray-900 text-white border border-gray-600 rounded-md text-center appearance-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          aria-label="Minimum price"
          onKeyDown={(e) => { // Prevent more than 2 decimal places on input
            const currentValue = e.target.value;
            const charPressed = e.key;
            if (charPressed === '.' && currentValue.includes('.')) {
              e.preventDefault();
            }
            if (currentValue.includes('.') && currentValue.split('.')[1].length >= 2 && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(charPressed)) {
              e.preventDefault();
            }
          }}
        />
        <span className="text-white mx-2">-</span>
        <PrimaryInput
          min={value.min + 0.01} // HTML5 min attribute
          max={max} // HTML5 max attribute
          step="0.01" // Allow two decimal places
          onChange={(e) => handleInputChange("right", e.target.value)}
          type="number"
          value={value.max} // Controlled component
          otherStyle="w-24 p-2 bg-gray-900 text-white border border-gray-600 rounded-md text-center appearance-none [-moz-appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          aria-label="Maximum price"
          onKeyDown={(e) => { // Prevent more than 2 decimal places on input
            const currentValue = e.target.value;
            const charPressed = e.key;
            if (charPressed === '.' && currentValue.includes('.')) {
              e.preventDefault();
            }
            if (currentValue.includes('.') && currentValue.split('.')[1].length >= 2 && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(charPressed)) {
              e.preventDefault();
            }
          }}
        />
      </div>
    </div>
  );
};

export default RangeInput;
