import React from "react";

const PrimaryButton = React.memo(({
  title,
  onClick,
  otherStyle = "",
  disabled = false,
  ariaLabel,
}) => {
  return (
    <button
      type="button"
      className={`btn-modern-primary ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'} ${otherStyle}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel || title}
    >
      {title}
    </button>
  );
});

// Set display name for debugging
PrimaryButton.displayName = 'PrimaryButton';

export default PrimaryButton;
