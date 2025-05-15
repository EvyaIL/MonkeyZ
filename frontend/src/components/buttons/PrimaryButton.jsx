const PrimaryButton = ({ title, onClick, otherStyle }) => {
    return (
        <button 
            className={`bg-accent px-4 py-2 rounded-lg text-primary font-semibold hover:bg-border hover:scale-110 transition-all shadow-md ${otherStyle}`} 
            onClick={onClick}
        >
            {title}
        </button>
    );
};

export default PrimaryButton;
