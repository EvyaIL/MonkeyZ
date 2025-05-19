const SecondaryButton = ({ title, onClick, otherStyle = "", ariaLabel }) => {
  return (
    <button
      type="button"
      className={`bg-base-200 px-4 py-2 rounded-lg text-base-content font-semibold hover:bg-base-300 hover:scale-110 transition-all shadow-md ${otherStyle}`}
      onClick={onClick}
      aria-label={ariaLabel || title}
    >
      {title}
    </button>
  );
};

export default SecondaryButton;
