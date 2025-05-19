const SecondaryButton = ({ title, onClick, otherStyle, disabled }) => {
    return (
        <button 
            className={`px-4 py-2 rounded-lg font-semibold transition-all shadow-md 
                ${disabled 
                    ? "bg-gray-500 text-gray-300 cursor-not-allowed opacity-50" 
                    : "bg-primary text-accent hover:bg-border hover:scale-110"} 
                ${otherStyle}`} 
            onClick={onClick}
            disabled={disabled}
        >
            {title}
        </button>
    );
};

export default SecondaryButton;
