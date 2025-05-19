import React from "react";

const SecondaryInput = ({ title, name, type = "text", value, disabled ,onChange, otherStyle = "", InputStyle: inputStyle = "" }) => {
    return (
        <div className={`flex items-center gap-4 w-full ${otherStyle}`}>
            {title &&<label className="text-white text-base min-w-[100px]">{title}</label>}
            {type === "checkbox" ? (
                <input 
                    disabled = {disabled}
                    type="checkbox" 
                    name={name} 
                    checked={value} 
                    onChange={(e) => onChange({ target: { name, value: e.target.checked } })} 
                    className={` w-5 h-5 rounded-b-xl accent-accent bg-red-50  ${inputStyle} ${!disabled&&"cursor-pointer"}`}
                />
            ) : type === "image" ? (
                <div className={`place-content-center relative w-full border border-gray-600 bg-gray-800 flex items-center justify-center rounded-lg overflow-hidden ${inputStyle}`}>
                    {value ? (
                        <img src={value} alt="Uploaded" className="object-cover" />
                    ) : (
                        <span className="text-gray-400">No Image</span>
                    )}
                    <input 
                        name={name}
                        disabled = {disabled}
                        type="file" 
                        accept="image/*" 
                        onChange={onChange} 
                        className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                </div>
            ) : (
                <input 
                    disabled = {disabled}
                    type={type} 
                    name={name} 
                    value={value} 
                    onChange={onChange} 
                    className={`bg-primary text-white border border-accent rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-accent ${inputStyle}`}
                />
            )}
        </div>
    );
};

export default SecondaryInput;
