import { useLocation, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useGlobalProvider } from "../../context/GlobalProvider";
import Role from "../../components/lib/models";
import { apiService } from "../../lib/apiService";
import DashboardSidebar from "./DashboardSidebar";
import PrimaryButton from "../../components/buttons/PrimaryButton";
import Popup from "../../components/popup/Popup";
import SecondaryButton from "../../components/buttons/SecondaryButton";

const ProductsDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { token, user } = useGlobalProvider();
    const [activeTab, setActiveTab] = useState("");
    const [allProducts, setAllProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletePopUp, setDeletePopUp] = useState(false);

    useEffect(() => {
        if (!token || !user || user.role !== Role.MANAGER) {
            navigate("/");
        }
    }, [token, user, navigate]);

    useEffect(() => {
        setActiveTab(location.pathname);
    }, [location]);

    useEffect(() => {
        fetchAllProducts();
    }, []);

    const fetchAllProducts = async () => {
        setLoading(true);
        const { data, error } = await apiService.get("/product/all");

        if (error) {
            alert(error);
            setLoading(false);
            return;
        }

        setAllProducts(data);
        setLoading(false);
    };

    const DeleteProduct = async (product) => {
        setLoading(true);
        const params ={"product_id":product.id}
        const { data, error } = await apiService.delete("/product", params);
        setDeletePopUp(false)
        if (error) {
            alert(error);
            setLoading(false);
            return;
        }
        const new_data = allProducts.filter((item) => item.id != product.id)
        setAllProducts(new_data);
        setLoading(false);
    };



    return (
        <div className="bg-primary min-h-screen flex flex-col items-center p-10">
            <h1 className="text-accent font-bold text-4xl mb-8">Manager Dashboard</h1>
            <div className="flex flex-col md:flex-row w-full max-w-7xl bg-secondary rounded-lg shadow-lg overflow-hidden">
                <DashboardSidebar activeTab={activeTab} />


                <main className="w-full p-10">
                    <div className="flex justify-between">
                        <h2 className="text-accent font-semibold text-2xl mb-4">
                            Welcome, {user?.username || "Manager"}
                        </h2>
                        <SecondaryButton title={"+"} otherStyle={"text-success"} onClick={(e) => navigate("/dashboard/product/")}/>
                    </div>
                    <div className="mt-6 bg-primary p-6 rounded-lg border border-accent">
                        <h3 className="text-white text-xl font-semibold mb-4">Products</h3>

                        {loading ? (
                            <p className="text-gray-400 text-center">Loading products...</p>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {allProducts.map((product) => (
                                    <div
                                        key={product.id}
                                        onClick={() => navigate(`/dashboard/product/${product.name}`)}
                                        className="cursor-pointer bg-gray-800 hover:bg-gray-700 p-5 rounded-lg shadow-md transition transform hover:scale-105"
                                    >   
                                        <div className="flex justify-between">
                                            <h4 className="text-white text-lg font-bold">{product.name}</h4>
                                            <button onClick={(e) =>(e.stopPropagation(), setDeletePopUp(product))} className="text-white hover:text-red-600 hover:scale-125 transition-all">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                </svg>
                                            </button>
                                        </div>
                                        <p className="text-gray-400">${(product.price / 100).toFixed(2)}</p>
                                        <p className="text-gray-500 text-sm mt-2">{product.description}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>
                <Popup 
                    isOpen={deletePopUp}
                    title="Confirm delete product"
                    message={`Are you sure you want to delete "${deletePopUp?.name}"?`}
                    onClose={() => setDeletePopUp(false)}
                    onConfirm={() =>DeleteProduct(deletePopUp)}
                />
            </div>
        </div>
    );
};

export default ProductsDashboard;
