import { useEffect } from "react";
import PrimaryButton from "../buttons/PrimaryButton";
import SecondaryButton from "../buttons/SecondaryButton";

const Popup = ({ title, message, onClose, onConfirm, isOpen }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden"; 
        } else {
            document.body.style.overflow = "auto";
        }
    }, [isOpen]);

    if (!isOpen) return null; 

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-secondary text-white p-6 rounded-lg shadow-lg w-96">
                <h2 className="text-xl font-semibold text-accent">{title}</h2>
                <p className="text-gray-400 mt-2">{message}</p>

                <div className="flex justify-center space-x-3 mt-4">
                    <SecondaryButton 
                        title={"Cancel"}
                        onClick={onClose} 
                        className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-md"
                    />
                    <PrimaryButton 
                        title={"Confirm"}
                        onClick={onConfirm} 
                    />
                        
                </div>
            </div>
        </div>
    );
};

export default Popup;
