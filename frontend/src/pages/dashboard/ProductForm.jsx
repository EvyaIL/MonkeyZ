import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiService } from "../../lib/apiService";
import PrimaryButton from "../../components/buttons/PrimaryButton";
import PrimaryInput from "../../components/inputs/PrimaryInput";
import { useGlobalProvider } from "../../context/GlobalProvider";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import SecondaryInput from "../../components/inputs/SecondaryInput";
import Role from "../../components/lib/models";
import KeyList from "../../components/product/KeyList";
import DashboardSidebar from "./DashboardSidebar";
import SecondaryButton from "../../components/buttons/SecondaryButton";
import Popup from "../../components/popup/Popup";

const ProductForm = () => {
    const { name } = useParams();
    const navigate = useNavigate();
    const { token, user } = useGlobalProvider();

    if (!token || !user || user.role !== Role.MANAGER) navigate("/");

    useEffect(() => {
        if (!token || !user || user.role !== Role.MANAGER) navigate("/");
    }, [token, user]);

    const [product, setProduct] = useState({
        id: null,
        name: "",
        description: "",
        image: "",
        price: "",
        active: false,
        stock: 0,
        best_seller: false,
        keys: [],
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ message: "", color: "" });

    useEffect(() => {
        if (name) fetchProduct();
    }, [name]);

    const fetchProduct = async () => {
        setLoading(true);
        const { data, error } = await apiService.get(`/product/${name}`);
        if (error) setMessage({ message: error, color: "#DC2626" });
        if (data) {
            const  product = await fetchKeys(data);
            setProduct(await getImage(product))
        }
        setLoading(false);
    };

    const getImage = async (product_data) => {
        const { data, error } = await apiService.post("/image/many", [product_data?.image]);
        product_data.image = ""
        if (error) {
            alert(error);
            return;
        }
        if (data)
            product_data.image=data[0]
        return product_data
    };


    const fetchKeys = async (product) => {
        apiService.setToken(token);
        const params = { product_id: product.id, start_index: 10, max_keys: -1 };
        const { data, error } = await apiService.get(`/key/by_product`, params);
        if (error) setMessage({ message: error, color: "#DC2626" });
        product["keys"]  = data
        setProduct(product);
        return product
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setProduct((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleInputChangeImage = (e) => {
        const { name, type, files } = e.target;
    
        if (type === "file" && files.length > 0) {
            const file = files[0];
    
            setProduct((prev) => ({
                ...prev,
                [name]: {
                    data: URL.createObjectURL(e.target.files[0]) , 
                    filename: file.name,
                },
            }));
            
        }
    };
    
    
    const handleSave = async () => {
        if (product?.id)
            await handleUpdate()
        else
            await handleCreate()
    };

    const handleCreate = async () => {
        setLoading(true);
        const { id, ...productData } = product;
        apiService.setToken(token);

        const { data, error } = await apiService.post(`/product`, productData);
        if (error){ 
            setMessage({ message: error, color: "#DC2626" }); 
            return
        }
        if (data && !id)setProduct({ ...product, id: data.id });
        setMessage({ message: "product created successfully", color: "#16A34A" });

        setLoading(false);
    };


    const handleUpdate = async () => {
        setLoading(true);
        const { id, ...productData } = product;
        apiService.setToken(token);
        const params = { product_id: id } ;

        const { data, error } = await apiService.put( `/product`, productData, params);
        if (error)
        { 
            setMessage({ message: error, color: "#DC2626" }); 
            return
        }
        if (data && !id) setProduct({ ...product, id: data.id });
        setMessage({ message: "product update successfully", color: "#16A34A" });

        setLoading(false);
    };

    return (
        <div className="bg-primary min-h-screen flex flex-col items-center p-10">
        <h1 className="text-accent font-bold text-4xl mb-8">Manager Dashboard</h1>
        <div className="flex flex-col md:flex-row w-full max-w-7xl bg-secondary rounded-lg shadow-lg overflow-hidden">
            <DashboardSidebar activeTab={"/dashboard/products"} />


            <main className="w-full p-10">
                <div className="flex flex-wrap space-x-5">
                    <SecondaryButton title={"<"}  onClick={(e) => navigate("/dashboard/products")}/>

                    <h2 className="text-accent font-semibold text-2xl mb-4">
                        {product.id ? "Edit Product" : "Create Product"}
                    </h2>
                </div>
                <div className="mt-6 bg-primary p-6 rounded-lg border border-accent grid">
                    <h3 className="text-white text-xl font-semibold mb-4">Product</h3>
                    <p className={`text-center font-bold transition-all mb-10 ${message.message ? "scale-100" : "scale-0"} w-full h-5`}
                    style={{ color: message.color }}
                    >
                        {message.message}
                    </p>
                    {loading ? (
                        <p className="text-gray-400 text-center">Loading products...</p>
                    ) : (
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="w-full md:w-1/2 min-h-[250px] rounded-lg border border-gray-600 bg-gray-800 flex items-center justify-center">
                            <SecondaryInput name="image" value={product?.image?.data} onChange={handleInputChangeImage} type="image" />
                        </div>
                        <div className="flex-1 text-white space-y-6">
                            <PrimaryInput title="Name" name="name" value={product.name} onChange={handleInputChange} />
                            <textarea  
                                className={`bg-secondary p-2 rounded-lg shadow-sm w-full text-white outline-none focus:ring-2 focus:ring-accent ring-2 ring-border transition-all duration-200  `}
                                title="Description" name="description" value={product.description} onChange={handleInputChange} />
                            <SecondaryInput title="Price ($)" name="price" type="number" value={product.price} onChange={handleInputChange} />
                            <SecondaryInput title="Active" name="active" type="checkbox" value={product.active} onChange={handleInputChange} />
                            <SecondaryInput title="Best Seller" name="best_seller" type="checkbox" value={product.best_seller} onChange={handleInputChange} />
                        </div>
                    </div>
                    )}
                      <PrimaryButton title={product.id ? "Save Changes" : "Create Product"} otherStyle={" mt-5 place-self-end"} onClick={handleSave} disabled={loading} />
                      {product.id && <KeyList productId={product.id} />}
                </div>
            </main>

        </div>
    </div>
       
    );
};

export default ProductForm;
