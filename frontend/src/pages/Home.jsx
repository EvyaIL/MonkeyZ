import { useEffect, useState } from "react";
import PrimaryButton from "../components/buttons/PrimaryButton";
import ProductCard from "../components/product/ProductCard";
import ProductShowcase from "../components/product/ProductShowcase";
import { apiService } from "../lib/apiService";

const Home = () => {
    const products = [
        { id: 1, name: "Product 1", description: "This is the 1 product.", image: "", price:10 },
        { id: 2, name: "Product 2", description: "This is the 2 product.", image: "" , price:20},
        { id: 3, name: "Product 3", description: "This is the 3 product.", image: "" , price:30},
        { id: 4, name: "Product 4", description: "This is the 4 product.", image: "" , price:40},
        { id: 5, name: "Product 5", description: "This is the 5 product.", image: "" , price:50},
        { id: 6, name: "Product 6", description: "This is the 6 product.", image: "" , price:60},
        { id: 7, name: "Product 7", description: "This is the 7 product.", image: "" , price:70},
        { id: 8, name: "Product 8", description: "This is the 8 product.", image: "" , price:80},
    ];
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
        
        setBestSellers([...data,...products])
    };


    const getRecent = async () => {
        const params = {"limit":8}

        const { data, error } = await apiService.get("/product/recent",params);

        if (error) {
            alert(error);
            return;
        }
        
        setRecent([...data,...products])
    };
    return (
        <div className="bg-primary min-h-screen flex flex-col items-center justify-center p-6">
            <h1 className="text-accent font-bold text-3xl mb-8">Home</h1>

            <ProductShowcase products={bestSellers} title={"Best Sellers"}/>

            <div className="bg-secondary border border-gray-700 rounded-lg shadow-lg p-6 w-full max-w-6xl mt-5">
                <h2 className="text-center text-accent font-bold text-2xl mb-4 ">New Products</h2>
                <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {recent.map((product) => (
                    <ProductCard product={product}/>
                ))}
                </div>
            </div>
        </div>
    );
};

export default Home;
