const PrimaryButton = ({
  title,
  onClick,
  otherStyle = "",
  disabled = false,
  ariaLabel,
}) => {
  return (
    <button
      type="button"
      className={`bg-primary px-4 py-2 rounded-lg text-white font-semibold hover:bg-accent hover:text-accent-content hover:scale-110 transition-all shadow-md ${otherStyle}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel || title}
    >
      {title}
    </button>
  );
};

export default PrimaryButton;
