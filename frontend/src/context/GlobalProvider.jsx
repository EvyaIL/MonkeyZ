import { createContext, useContext, useState, useEffect } from "react";
import { apiService } from "../lib/apiService";

const GlobalContext = createContext();
export const useGlobalProvider = () => useContext(GlobalContext);

const GlobalProvider = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem("token") || null);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [cartItems, setCartItems] = useState({})
    const [openCart, setOpenCart] = useState(false);


    useEffect(() => {
        const initialize = async () => {
            setIsLoading(true);
            await CheckToken(localStorage.getItem("token"));
            setIsLoading(false);
        };

        initialize();
    }, []);

    const Logout = async () => {
        localStorage.removeItem("token");
        setToken(null);
        setUser(null);
    };

    const setUserAndToken = (data) => {
        const { access_token, user } = data;
        localStorage.setItem("token", access_token);
        setToken(access_token);
        setUser(user);
    }

    const CheckToken = async (token) => {
        if (token) {
            apiService.setToken(token);
            const { data, error } = await apiService.get("/user/me");

            if (!error) {
                setUserAndToken(data)
                return;
            }
            showError(error);
            window.location.href = "/";

        }
        await Logout();
    };

    const showError = (message) => {
        alert("Error:", message);
    };

    const addItemToCart = (id, count, item) =>{
        if(item.stock <= 0) return

        let newCartItems = {...cartItems}
        if(id in newCartItems){
            if(newCartItems[id].count + 1 > item.stock) 
                return

            newCartItems[id].count += 1 
        }else{
            newCartItems[id] ={...item, count:count}
        }

        setCartItems(newCartItems)
        setOpenCart(true)
    }

    const removeItemFromCart = (id, count) =>{
        let newCartItems = {...cartItems}
        if (!(id in newCartItems)){
            return
        }

        newCartItems[id].count -= count

        if ( newCartItems[id].count <= 0){
            delete newCartItems[id]
        }

        setCartItems(newCartItems)
    }


    const deleteItemFromCart = (id) =>{
        let newCartItems = {...cartItems}
        if (!(id in newCartItems)){
            return
        }

        delete newCartItems[id]

        setCartItems(newCartItems)
    }

    return (
        <GlobalContext.Provider
            value={{
                token,
                setToken,
                user,
                setUser,
                isLoading,
                setIsLoading,
                Logout,
                setUserAndToken,
                addItemToCart,
                removeItemFromCart,
                cartItems,
                deleteItemFromCart,
                openCart,
                setOpenCart
            }}
        >
            {children}
        </GlobalContext.Provider>
    );
};

export default GlobalProvider;
