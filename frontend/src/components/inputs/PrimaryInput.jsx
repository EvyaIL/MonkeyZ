const PrimaryInput = ({ title, value, placeholder, onChange, otherStyle, type = "text" , min, max}) => {
    return (
        <div className="flex flex-col space-y-2 ">
            <label className="text-accent font-semibold text-center">{title}</label>
            <input 
                type={type}
                value={value} 
                min={min}
                max={max}
                placeholder={placeholder} 
                className={`bg-secondary p-2 rounded-lg shadow-sm text-white outline-none focus:ring-2 focus:ring-accent ring-2 ring-border transition-all duration-200 ${otherStyle}`} 
                onChange={onChange}
            />
        </div>
    );
};

export default PrimaryInput;
