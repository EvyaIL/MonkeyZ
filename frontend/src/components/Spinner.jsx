import React from "react";

const Spinner = ({ size = 48, color = "#A27B5C" }) => (
  <div className="flex items-center justify-center w-full py-8">
    <svg
      className="animate-spin"
      width={size}
      height={size}
      viewBox="0 0 50 50"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Loading"
      role="status"
    >
      <circle
        cx="25"
        cy="25"
        r="20"
        stroke="#393E46"
        strokeWidth="6"
        fill="none"
      />
      <path
        d="M45 25a20 20 0 1 1-20-20"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
      />
    </svg>
  </div>
);

export default Spinner;
