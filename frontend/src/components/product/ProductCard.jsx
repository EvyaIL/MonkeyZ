import { useNavigate } from "react-router-dom";
import PrimaryButton from "../buttons/PrimaryButton";
import { useGlobalProvider } from "../../context/GlobalProvider";

const ProductCard = ({product, otherStyle}) => {
    const navigate = useNavigate();
    const {addItemToCart} = useGlobalProvider()
    return (
        <div className={`bg-secondary border rounded-lg border-primary shadow-lg shadow-primary p-6 w-64 h-auto flex flex-col items-center hover:scale-105 hover:z-10 z-0 transition-all ${otherStyle} cursor-pointer`} onClick={() => navigate(`/product/${product.name}`)}>
            <h2 className="text-accent font-semibold text-lg mb-3 text-center">{product?.name}</h2>

            <div className=" flex items-center justify-center w-full h-44 border border-gray-600 bg-gray-800 text-white rounded-lg">
                <span className="text-gray-400">{product?.image}</span>
            </div>

            <p className="mt-3 text-white text-sm text-center leading-relaxed">
                {product?.description}
            </p>

            <div className="flex items-center justify-between w-full mt-4">
                <p className="text-lg font-medium text-white">${product?.price}</p>
                <PrimaryButton title="Add to card" onClick={(e) => (e.stopPropagation(), addItemToCart(product.id, 1, product))}/>
            </div>
        </div>
    );
};

export default ProductCard;
