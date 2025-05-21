const PrimaryInput = ({
  title,
  value,
  placeholder,
  onChange,
  otherStyle = "",
  type = "text",
  min,
  max,
  id,
  ...rest
}) => {
  const inputId = id || title?.toLowerCase().replace(/\s+/g, "-") || undefined;
  return (
    <div className="flex flex-col space-y-2">
      {title && (
        <label
          htmlFor={inputId}
          className="text-accent font-semibold text-center"
        >
          {title}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        value={value}
        min={min}
        max={max}
        placeholder={placeholder}
        className={`bg-secondary p-2 rounded-lg shadow-sm text-white outline-none focus:ring-2 focus:ring-accent ring-2 ring-border transition-all duration-200 text-right rtl:text-right ltr:text-left ${otherStyle}`}
        onChange={onChange}
        {...rest}
      />
    </div>
  );
};

export default PrimaryInput;
