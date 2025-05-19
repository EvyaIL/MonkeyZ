import { useGlobalProvider } from "../context/GlobalProvider";
import { useNavigate } from "react-router-dom";
import PrimaryButton from "./buttons/PrimaryButton";
import SecondaryButton from "./buttons/SecondaryButton";
import { useEffect, useRef, useState } from "react";
import Role from "./lib/models";
import Cart from "./cart/Cart";

const Navbar = () => {
    const { user, cartItems, openCart, setOpenCart } = useGlobalProvider();
    const navigate = useNavigate();

    const cartRef = useRef(null);

    useEffect(() => {
        if(openCart == false) return;
        const handleClickOutside = (event) => {
            if (cartRef.current && !cartRef.current.contains(event.target)) {
                setOpenCart(false);
         
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [setOpenCart]);

    return (
        <div className="top-0 z-20 sticky ">
            <nav className="p-4 bg-secondary text-white shadow-md flex justify-between items-center w-full">
                <div className="text-2xl font-bold text-accent cursor-pointer" onClick={() => navigate("/")}>
                    KeyShop
                </div>

                <div className="space-x-6 text-lg">
                    <button className="hover:text-accent transition" onClick={() => navigate("/products")}>
                        All Products
                    </button>
                    <button className="hover:text-accent transition" onClick={() => navigate("/about")}>
                        About Us
                    </button>
                </div>

                <div className="flex items-center space-x-4 select-none">
                    {user ? (
                        <div className="flex space-x-5">

                            {user.role == Role.MANAGER &&
                                <div>
                                    <PrimaryButton title="dashboard" onClick={() => navigate("/dashboard")} />
                                </div>
                            }
                            <div
                                className="space-x-3 cursor-pointer rounded-full border-2 border-border p-2"
                                onClick={() => navigate("/profile")}
                            >
                                Welcome back{" "}
                                <span className="text-accent font-semibold">{user?.username}</span>
                            </div>

                        </div>
                    ) : (
                        <div className="space-x-3">
                            <PrimaryButton title="Sign In" onClick={() => navigate("/sign-in")} />
                            <SecondaryButton title="Sign Up" onClick={() => navigate("/sign-up")} />
                        </div>
                    )}

                    <button
                        className="relative bg-gray-800 px-3 py-2 rounded-lg text-white flex items-center"
                        onClick={() => setOpenCart(true)}
                    >
                        🛒
                        {Object.keys(cartItems).length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-danger text-xs px-2 py-1 rounded-full text-white">
                                {Object.keys(cartItems).length}
                            </span>
                        )}
                    </button>
                </div>
            </nav>

                <Cart cartRef={cartRef} />
                
        </div>
    );
};

export default Navbar;
