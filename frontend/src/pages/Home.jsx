import { useEffect, useState } from "react";
import PrimaryButton from "../components/buttons/PrimaryButton";
import ProductCard from "../components/product/ProductCard";
import ProductShowcase from "../components/product/ProductShowcase";
import { apiService } from "../lib/apiService";

const Home = () => {
    const [bestSellers,setBestSellers] = useState([])
    const [recent,setRecent] = useState([])

    useEffect(() => {
        getBestSellers();
        getRecent()
    }, [])
    
    const getBestSellers = async () => {
        const { data, error } = await apiService.get("/product/best-sellers");

        if (error) {
            alert(error);
            return;
        }
        
        setBestSellers(data)
        setBestSellers(await getImages(data))
    };

    const getRecent = async () => {
        const params = {"limit":8}

        const { data, error } = await apiService.get("/product/recent",params);

        if (error) {
            alert(error);
            return;
        }
        
        setRecent(data)
        setRecent(await getImages(data))

    };

    const getImages = async (products_data) => {
        
        const ids = products_data.map((item) => item.image);
        const { data, error } = await apiService.post("/image/many", ids);

        if (error) {
            alert(error);
            return;
        }

        const updatedProducts = products_data.map((item, index) => ({
            ...item,
            image: data[index], 
        }));

        return updatedProducts
    };

    return (
        <div className="bg-primary min-h-screen flex flex-col items-center justify-center p-6">
            <h1 className="text-accent font-bold text-3xl mb-8">Home</h1>

            <ProductShowcase products={bestSellers} title={"Best Sellers"}/>

            <div className="bg-secondary border border-gray-700 rounded-lg shadow-lg p-6 w-full max-w-6xl mt-5">
                <h2 className="text-center text-accent font-bold text-2xl mb-4 ">New Products</h2>
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {recent.map((product) => (
                    <ProductCard key={product.id} product={product}/>
                ))}
                </div>
            </div>
        </div>
    );
};

export default Home;
