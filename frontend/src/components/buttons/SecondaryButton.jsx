const SecondaryButton = ({ title, onClick, otherStyle = "", ariaLabel }) => {
  return (
    <button
      type="button"
      className={`border-2 border-brand-primary text-brand-primary px-6 py-3 rounded-xl hover:bg-brand-primary hover:text-white transition-all duration-300 font-medium ${otherStyle}`}
      onClick={onClick}
      aria-label={ariaLabel || title}
    >
      {title}
    </button>
  );
};

export default SecondaryButton;
