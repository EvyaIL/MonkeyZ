import { useGlobalProvider } from "../context/GlobalProvider";
import { useNavigate } from "react-router-dom";
import PrimaryButton from "./buttons/PrimaryButton";
import SecondaryButton from "./buttons/SecondaryButton";
import { useEffect, useRef, useState } from "react";

const Navbar = () => {
    const { user, cartItems, removeItemFromCart, addItemToCart, deleteItemFromCart, openCart, setOpenCart } = useGlobalProvider();
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
                        <div
                            className="space-x-3 cursor-pointer rounded-full border-2 border-border p-2"
                            onClick={() => navigate("/account")}
                        >
                            Welcome back{" "}
                            <span className="text-accent font-semibold">{user?.username}</span>
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


                <div ref={cartRef} className={`fixed top-0 right-0 h-full bg-primary shadow-lg border-l border-gray-700 p-6 overflow-y-hidden rounded-t-md rounded-b-md  ${openCart ?"scale-x-100 translate-x-0":"translate-x-[50%] scale-x-0"} transition-all drop-shadow-xl duration-1000`}>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-white">Shopping Cart</h2>
                        <button
                            className="text-gray-400 hover:text-white text-2xl"
                            onClick={() => setOpenCart(false)}
                        >
                            ×
                        </button>
                    </div>
                        {Object.keys(cartItems).length === 0 ? (
                            <p className="text-gray-400 text-center py-4">Your cart is empty.</p>
                        ) : (
                            <div className="space-y-4  h-full ">
                                <div className="space-y-4 h-[70%] item overflow-x-hidden w-[105%]  p-2 rounded-sm ">
                                    {Object.values(cartItems).map((item) => (
                                        <div key={item.id} className="flex items-center justify-between border-b border-border pb-2 ">
                                            <div>
                                                <h3 className="text-white font-semibold">{item.name}</h3>
                                                <p className="text-gray-400 text-sm">${item.price} x {item.count}</p>
                                            </div>
                                            <div className="flex items-center space-x-2 ">
                                                <SecondaryButton title="+" onClick={() => addItemToCart(item.id, 1, item)} otherStyle={"scale-75 hover:scale-90 border-2 border-accent"}/>
                                                <p className="text-white w-7 truncate text-center">{item.count}</p>
                                                <SecondaryButton title="-" onClick={() => removeItemFromCart(item.id, 1, item)}  otherStyle={"scale-75 hover:scale-90 border-2 border-accent"}/>
                                            </div>

                                            <p className=" text-white w-10 truncate ">${item.price*item.count}</p>
                                            <button className="text-red-500 hover:text-red-700 text-lg hover:scale-125 transition-all" onClick={() => deleteItemFromCart(item.id)}>×</button>

                                        </div>
                                    ))}
                                </div>
                            <div className="mt-4 text-right text-lg text-white font-semibold ">
                                Total: ${Object.values(cartItems).reduce((acc, item) => acc + item.price * item.count, 0).toFixed(2)}
                            </div>
                                <PrimaryButton title="Checkout" otherStyle="w-full" onClick={() => navigate("/checkout")} />
                            </div>
                            
                        )}
                </div>
        </div>
    );
};

export default Navbar;
