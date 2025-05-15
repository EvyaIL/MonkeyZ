const PointButton = ({ onClick, otherStyle, style, current }) => {
    return (
        <button
        onClick={onClick}
        style ={style}
        className={`w-3 h-3 rounded-full transition-all duration-300 ${otherStyle} ${
            current ? "bg-accent scale-125" : "bg-white opacity-50 hover:opacity-100"
        }`}
    />
    );
};

export default PointButton;
