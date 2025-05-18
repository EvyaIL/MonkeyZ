const SecondaryButton = ({ title, onClick, otherStyle = "", ariaLabel }) => {
  return (
    <button
      type="button"
      className={`bg-primary px-4 py-2 rounded-lg text-accent font-semibold hover:bg-border hover:scale-110 transition-all shadow-md ${otherStyle}`}
      onClick={onClick}
      aria-label={ariaLabel || title}
    >
      {title}
    </button>
  );
};

export default SecondaryButton;
