import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { apiService } from "../lib/apiService";
import PrimaryButton from "../components/buttons/PrimaryButton";
import PrimaryInput from "../components/inputs/PrimaryInput";
import { useGlobalProvider } from "../context/GlobalProvider";

const ProductPage = () => {
    const { name } = useParams();
    const { addItemToCart } = useGlobalProvider();
    
    const [product, setProduct] = useState({
        id: null,
        name: "",
        description: "",
        image: "",
        price: 0,
        stock: 0,
    });

    const [quantity, setQuantity] = useState(1);

    useEffect(() => {
        if (name) {
            fetchProduct();
        }
    }, [name]);

    const fetchProduct = async () => {
        const { data, error } = await apiService.get(`/product/${name}`);

        if (error) {
            console.error("Error fetching product:", error);
            return;
        }

        if (data) {
            setProduct(data);
            setProduct(await getImage(data))
        }
      
    };

    const getImage = async (product_data) => {
        const { data, error } = await apiService.post("/image/many", [product_data.image]);

        if (error) {
            alert(error);
            return;
        }
        if (data)
            product_data.image=data[0]
        return product_data
    };

    const handleAddToCart = () => {
        if (product.stock < 1) {
            return;
        }
        
        if (!product.id) return;
        addItemToCart(product.id, quantity, product);
        setQuantity(1);
    };

    return (
        <div className="bg-primary p-9 flex flex-col items-center justify-center">
            <div className="bg-secondary border border-gray-700 rounded-lg shadow-lg p-6 w-full max-w-6xl mt-5">
                <h2 className="text-center text-accent font-bold text-2xl mb-4">
                    {product.name || "Product Name"}
                </h2>

                <div className="flex flex-col md:flex-row gap-6 items-start p-4">
                    <div 
                        className={`w-full md:w-1/2 min-h-[250px] rounded-lg border border-gray-600 bg-gray-800 flex items-center justify-center ${product.stock < 1 ? "opacity-70 grayscale" : ""}  ${!product.image?.data && product.image == "" &&"animate-pulse"}`}
                    >
                        {product.image ? (
                            <img src={product?.image?.data} alt={product?.image?.filename} className="object-cover w-full h-full rounded-lg" />
                        ) : (
                            <span className="text-white text-lg">No Image Available</span>
                        )}

                        {product.stock < 1 && (
                            <div className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-lg">
                                Out of Stock
                            </div>
                        )}
                    </div>

                    <div className="flex-1 text-white">
                        <p className="text-lg leading-relaxed">{product.description || "No description available."}</p>

                        <p className="text-lg font-semibold text-accent mt-4">
                            ${product.price.toFixed(2)} 
                            {product.stock < 1 && (
                                <span className="text-red-500 font-bold ml-2">- Out of Stock</span>
                            )}
                        </p>
                    </div>
                </div>

                <div className="mt-4 flex justify-end items-center">
                    <PrimaryInput
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        otherStyle={`w-20 mx-3 bg-gray-900 text-center h-10 ${product.stock < 1 ? "opacity-50 cursor-not-allowed" : ""}`}
                        disabled={product.stock < 1}
                    />

                    <PrimaryButton 
                        title={product.stock < 1 ? "Out of Stock" : "Add to Cart"} 
                        otherStyle={`h-11`} 
                        onClick={handleAddToCart} 
                        disabled={product.stock < 1}
                    />
                </div>
            </div>
        </div>
    );
};

export default ProductPage;
