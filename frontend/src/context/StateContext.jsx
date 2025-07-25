import React, { createContext, useContext, useState } from 'react';
import { toast } from 'react-hot-toast';

const Context = createContext();

export const StateContext = ({ children }) => {
  const [showCart, setShowCart] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [totalQuantities, setTotalQuantities] = useState(0);
  const [qty, setQty] = useState(1);
  const [lastUpdated, setLastUpdated] = useState(Date.now());

  let foundProduct;
  let index;

  const onAdd = (product, quantity) => {
    const checkProductInCart = cartItems.find((item) => item.id === product.id);
    setTotalPrice((prevTotal) => prevTotal + product.price * quantity);
    setTotalQuantities((prevTotal) => prevTotal + quantity);

    if (checkProductInCart) {
      const updatedCartItems = cartItems.map((cartProduct) => {
        if (cartProduct.id === product.id) {
          return { ...cartProduct, quantity: cartProduct.quantity + quantity };
        }
        return cartProduct;
      });
      setCartItems(updatedCartItems);
    } else {
      product.quantity = quantity;
      setCartItems([...cartItems, { ...product }]);
    }
    setLastUpdated(Date.now());
    toast.success(`${qty} ${product.name} added to the cart.`);
  }

  const onRemove = (product) => {
    const foundProduct = cartItems.find((item) => item.id === product.id);
    setTotalPrice((prevTotal) => prevTotal - foundProduct.price * foundProduct.quantity);
    setTotalQuantities((prevTotal) => prevTotal - foundProduct.quantity);
    const updatedCartItems = cartItems.filter((item) => item.id !== product.id);
    setCartItems(updatedCartItems);
    setLastUpdated(Date.now());
  }

  const toggleCartItemQuanitity = (id, value) => {
    const foundProduct = cartItems.find((item) => item.id === id);
    if (foundProduct) {
      if (value === 'inc') {
        const updatedCartItems = cartItems.map((item) => {
          if (item.id === id) {
            return { ...item, quantity: item.quantity + 1 };
          }
          return item;
        });
        setCartItems(updatedCartItems);
        setTotalPrice((prevTotal) => prevTotal + foundProduct.price);
        setTotalQuantities((prevTotal) => prevTotal + 1);
        setLastUpdated(Date.now());
      } else if (value === 'dec') {
        if (foundProduct.quantity > 1) {
          const updatedCartItems = cartItems.map((item) => {
            if (item.id === id) {
              return { ...item, quantity: item.quantity - 1 };
            }
            return item;
          });
          setCartItems(updatedCartItems);
          setTotalPrice((prevTotal) => prevTotal - foundProduct.price);
          setTotalQuantities((prevTotal) => prevTotal - 1);
          setLastUpdated(Date.now());
        }
      }
    }
  }

  const incQty = () => {
    setQty((prevQty) => prevQty + 1);
  }

  const decQty = () => {
    setQty((prevQty) => {
      if (prevQty === 1) return 1;
      return prevQty - 1;
    });
  }

  return (
    <Context.Provider
      value={{
        showCart,
        setShowCart,
        cartItems,
        totalPrice,
        totalQuantities,
        qty,
        incQty,
        decQty,
        onAdd,
        toggleCartItemQuanitity,
        onRemove,
        setCartItems,
        setTotalPrice,
        setTotalQuantities,
        lastUpdated,
        setLastUpdated
      }}
    >
      {children}
    </Context.Provider>
  )
}

export const useStateContext = () => useContext(Context);