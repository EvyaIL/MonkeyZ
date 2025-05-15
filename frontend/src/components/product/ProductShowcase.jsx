import { useState } from "react";
import SecondaryButton from "../buttons/SecondaryButton";
import PrimaryButton from "../buttons/PrimaryButton";
import PointButton from "../buttons/PointButton";
import { useNavigate } from "react-router-dom";
import { useGlobalProvider } from "../../context/GlobalProvider";

const ProductShowcase = ({ products, title }) => {
    const navigate = useNavigate();
    const {addItemToCart} = useGlobalProvider()
    
    const [currentIndex, setCurrentIndex] = useState(0);

    const nextProduct = () => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % products.length);
    };

    const prevProduct = () => {
        setCurrentIndex((prevIndex) => (prevIndex - 1 + products.length) % products.length);
    };

    return (
        <div className="bg-secondary border border-gray-700 rounded-lg shadow-lg p-6 w-full max-w-6xl overflow-hidden">
            <h2 className="text-center text-accent font-bold text-2xl mb-4">{title}</h2>

            <div className="relative overflow-hidden h-[300px]">
                <div 
                    className="flex transition-transform duration-500 ease-in-out"
                    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                    {products.map((product, index) => (
                        <div key={index} className="min-w-full flex flex-col md:flex-row gap-6 items-start p-4 cursor-pointer" onClick={() => navigate(`/product/${products[currentIndex].name}`)}>
                            <div className="w-full md:w-1/2 min-h-[250px] rounded-lg border border-gray-600 bg-gray-800 flex items-center justify-center">
                                {product.image ? (
                                    <img src={product.image} alt={product.name} className="object-cover w-full h-full rounded-lg" />
                                ) : (
                                    <span className="text-white text-lg">Image</span>
                                )}
                            </div>

                            <div className="flex-1 text-white">
                                <h2 className="text-start text-accent font-bold text-xl mb-4">{product.name}</h2>
                                <p className="break-words text-lg leading-relaxed">{product.description}</p>
                                <p className="text-lg font-semibold text-accent mt-4">${product.price}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-4 flex justify-end">
                <PrimaryButton title="Add to card" onClick={() => addItemToCart(products[currentIndex].id, 1, products[currentIndex])}/>
            </div>

            <div className="flex justify-center items-center space-x-5 mt-6">
                <SecondaryButton title="<" onClick={prevProduct} />
                <div className="flex space-x-2">
                    {products.map((_, index) => (
                        <PointButton  key={index} onClick={() => setCurrentIndex(index)} current={index === currentIndex}/>
                    ))}
                </div>
                <SecondaryButton title=">" onClick={nextProduct} />
            </div>
        </div>
    );
};

export default ProductShowcase;
