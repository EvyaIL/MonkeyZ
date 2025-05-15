import { useEffect, useState } from "react";
import ProductCard from "../components/product/ProductCard";
import { apiService } from "../lib/apiService";
import PrimaryButton from "../components/buttons/PrimaryButton";
import RangeInput from "../components/inputs/RangeInput";
import PrimaryInput from "../components/inputs/PrimaryInput";

const AllProducts = () => {
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
    const [allProducts, setAllProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [priceRange, setPriceRange] = useState({ min: 0, max: -1 });
    const [filterPriceRange, setFilterPriceRange] = useState({ min: 0, max: -1 });
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAllProducts();
    }, []);

    useEffect(() => {
        filterProducts();
    }, [filterPriceRange, searchQuery]); // Auto-update on filter change

    const fetchAllProducts = async () => {
        setLoading(true);
        const { data, error } = await apiService.get("/product/all");

        if (error) {
            alert(error);
            setLoading(false);
            return;
        }

        const product_data= [...data,...products]
        const prices = product_data.map((item) => item.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        setAllProducts(product_data);
        setPriceRange({ min: 0, max: maxPrice +10 });
        setFilterPriceRange({ min: minPrice, max: maxPrice });
        setFilteredProducts(product_data);
        setLoading(false);
    };

    const filterProducts = () => {
        const filtered = allProducts.filter(
            (product) =>
                product.price >= filterPriceRange.min &&
                product.price <= filterPriceRange.max &&
                product.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFilteredProducts(filtered);
    };

    return (
        <div className="bg-primary min-h-screen flex flex-col items-center p-6">
            <h1 className="text-accent font-bold text-3xl mb-6">All Products</h1>

            <div className="bg-secondary border border-gray-700 rounded-lg shadow-lg p-6 w-full max-w-7xl flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/4 bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-accent text-xl font-semibold mb-4">Filters</h3>

                    <label className="block text-white text-sm font-medium mb-2">
                        Price Range: ${filterPriceRange.min} - ${filterPriceRange.max}
                    </label>
                    { priceRange.max != -1 && <RangeInput 
                        min={priceRange.min} 
                        max={priceRange.max} 
                        value={filterPriceRange} 
                        onChange={setFilterPriceRange} 
                    />}
                    <PrimaryInput 
                        type="search" title={"search"}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search products..."
                        value={searchQuery}
                        otherStyle={"bg-gray-900"}
                        />
                </div>

                <div className="w-full">
                    <h2 className="text-center text-accent font-bold text-2xl mb-4">New Products</h2>

                    {loading ? (
                        <p className="text-white text-center">Loading products...</p>
                    ) : filteredProducts.length === 0 ? (
                        <p className="text-gray-400 text-center">No products found.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {filteredProducts.map((product) => (
                                <ProductCard key={product.id} product={product} otherStyle={"xl:scale-90"} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AllProducts;
