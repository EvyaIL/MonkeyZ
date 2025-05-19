const PointButton = ({
  onClick,
  otherStyle = "",
  style = {},
  current = false,
  slideNumber, // New prop for slide number
  productName, // New prop for product name, for ARIA label
  ariaLabel // Allow explicit aria-label to be passed
}) => {
  // Generate default aria-label if none provided
  const defaultAriaLabel = current
    ? `Current slide: ${productName || ''}`.trim()
    : `Go to slide ${slideNumber}${productName ? `: ${productName}` : ''}`.trim();

  // Use passed ariaLabel or fallback to generated one
  const finalAriaLabel = ariaLabel || defaultAriaLabel;

  return (
    <button
      type="button"
      onClick={onClick}
      style={style}
      className={`w-6 h-6 rounded-full transition-all duration-300 flex items-center justify-center text-xs font-medium ${otherStyle} ${
        current
          ? "bg-accent scale-110 text-white"
          : "bg-white opacity-50 hover:opacity-100 text-gray-700"
      }`}
      aria-current={current ? "true" : undefined}
      aria-label={finalAriaLabel}
    >
      {slideNumber}
    </button>
  );
};

export default PointButton;
