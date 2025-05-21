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
      className={`bg-accent px-4 py-2 rounded-lg text-white font-semibold hover:bg-accent-dark active:bg-accent-dark/90 transition-all shadow-lg backdrop-blur-sm ring-1 ring-white/10 ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 hover:shadow-xl'} ${otherStyle}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel || title}
    >
      {title}
    </button>
  );
};

export default PrimaryButton;
