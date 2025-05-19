import { useNavigate } from "react-router-dom";
import PrimaryButton from "../buttons/PrimaryButton";
import { useGlobalProvider } from "../../context/GlobalProvider";

const ProductCard = ({ product, otherStyle }) => {
    const navigate = useNavigate();
    const { addItemToCart } = useGlobalProvider();
    const isOutOfStock = product?.stock < 1; 

    return (
        <div 
            className={`relative bg-secondary border rounded-lg border-primary shadow-lg shadow-primary p-6 w-64 h-auto flex flex-col items-center transition-all 
                ${isOutOfStock ? "opacity-50 cursor-not-allowed" : "hover:scale-105 hover:z-10 z-0 cursor-pointer"}  
                ${otherStyle}`}
            onClick={() => !isOutOfStock && navigate(`/product/${product?.name}`)}
        >
            {isOutOfStock && (
                <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-lg">
                    Out of Stock
                </div>
            )}

            <h2 className="text-accent font-semibold text-lg mb-3 text-center">{product?.name}</h2>

            <div className={` flex  items-center justify-center w-full h-44 border border-gray-600 bg-gray-800 text-white rounded-lg  ${!product.image?.data && product.image == "" &&"animate-pulse"}`}>
                {product.image ? (
                    <img src={product?.image?.data} alt={product?.image?.filename} className="object-cover w-full h-full rounded-lg" />
                ) : (
                    <span className="text-white text-lg ">Image</span>
                )}
            </div>

            <p className="mt-3 text-white text-sm text-center leading-relaxed">
                {product?.description}
            </p>

            <div className="flex items-center justify-between w-full mt-4">
                <p className="text-lg font-medium text-white">${product?.price}</p>
                <PrimaryButton 
                    title={isOutOfStock ? "Out of Stock" : "Add to Cart"} 
                    onClick={(e) => {
                        e.stopPropagation();
                        addItemToCart(product.id, 1, product);
                    }} 
                    disabled={isOutOfStock}
                />
            </div>
        </div>
    );
};

export default ProductCard;
