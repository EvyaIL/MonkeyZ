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
      className={`bg-accent px-4 py-2 rounded-lg text-primary font-semibold hover:bg-border hover:scale-110 transition-all shadow-md ${otherStyle}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel || title}
    >
      {title}
    </button>
  );
};

export default PrimaryButton;
