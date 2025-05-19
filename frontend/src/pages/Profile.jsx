import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useGlobalProvider } from "../context/GlobalProvider";
import PrimaryButton from "../components/buttons/PrimaryButton";
import SecondaryButton from "../components/buttons/SecondaryButton";
import { apiService } from "../lib/apiService";
import PrimaryInput from "../components/inputs/PrimaryInput";

const Profile = () => {
    const navigate = useNavigate();
    const { token, user,Logout} = useGlobalProvider();
    const [groupedKeysByProduct, setGroupedKeysByProduct] = useState({});
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (!token) navigate("/");
    }, [token, navigate]);

    useEffect(() => {
        if (!user?.keys) return;
        let keysByProduct = {};
        Object.values(user.keys).forEach((key) => {
            if (!keysByProduct[key.product]) keysByProduct[key.product] = [];
            keysByProduct[key.product].push(key);
        });


        const fetchProducts = async () => {
            try {
                const { data, error } = await apiService.post("/product/many", Object.keys(keysByProduct));

                if (error) {
                    console.error("Error fetching products:", error);
                    return;
                }

                const products = data.reduce((acc, product) => {
                    acc[product.id] = {
                        ...product,
                        keys: keysByProduct[product.id] || [],
                        openKeys: false,
                        openProduct: false,
                    };
                    return acc;
                }, {});

                setGroupedKeysByProduct(products);
            } catch (err) {
                console.error("Unexpected error fetching products:", err);
            }
        };

        fetchProducts();
    }, [user]);

    const toggleKeyVisibility = (productId, keyId, open) => {
        setGroupedKeysByProduct(prevState => ({
            ...prevState,
            [productId]: {
                ...prevState[productId],
                keys: prevState[productId].keys.map(key =>
                    key.id === keyId ? { ...key, open: open } : key
                ),
            },
        }));
    };

    const toggleProductVisibility = (productId, openProduct) => {
        setGroupedKeysByProduct(prevState => ({
            ...prevState,
            [productId]: {
                ...prevState[productId],
                openProduct: openProduct,
            },
        }));
    };

    const toggleKeysSection = (productId) => {
        setGroupedKeysByProduct(prevState => ({
            ...prevState,
            [productId]: {
                ...prevState[productId],
                openKeys: !prevState[productId].openKeys,
            },
        }));
    };

    const filteredProducts = useMemo(() => {
        return Object.values(groupedKeysByProduct).filter((product) =>
            product.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [groupedKeysByProduct, searchQuery]);

    return (
        <div className="bg-primary min-h-screen flex flex-col items-center p-6">
            <div className="bg-secondary border border-primary shadow-lg rounded-lg p-6 w-full max-w-4xl">
                <div className="grid">
                    <div className="justify-self-end">
                        <SecondaryButton title="Logout" otherStyle="text-red-600" onClick={Logout} />
                    </div>
                    <h2 className="text-accent font-bold text-2xl text-center mb-4">{user?.username}</h2>
                </div>

                <div className="text-white text-center mb-6 space-y-2">
                    <p><strong>Email:</strong> {user?.email}</p>
                    <p><strong>Phone:</strong> {user?.phone_number}</p>
                    <p><strong>Role:</strong> {user?.role}</p>
                </div>

                <h3 className="text-xl font-semibold text-accent mb-4 text-center">Purchased Products</h3>

                <PrimaryInput
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full mb-4"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-5 
               items-start grid-auto-rows-auto">
                    {filteredProducts.length > 0 ? (
                        filteredProducts.map((product) => (
                            <div key={product.id} className={`bg-secondary border rounded-lg border-primary shadow-lg p-2 px-5 overflow-hidden transition-all duration-300  ${product?.openProduct ?"h-auto":"h-10"}`}                            >   
                                <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleProductVisibility(product.id, !product.openProduct)}>
                                    <h4 className="text-accent font-semibold text-lg">{product.name}</h4>
                                    <button>{product.openProduct ? "▲" : "▼"}</button>
                                </div>

                                <div className="flex items-center justify-center w-full h-32 border border-gray-600 bg-gray-800 text-white rounded-lg mt-3">
                                    <span className="text-gray-400">Product Image</span>
                                </div>

                                <button
                                    className="mt-3 w-full bg-gray-700 text-white py-2 rounded-lg hover:bg-gray-600"
                                    onClick={() => toggleKeysSection(product.id)}
                                >
                                    {product.openKeys ? "Hide Keys" : "Show Keys"}
                                </button>

                                {product.openKeys && (
                                    <div className={`mt-3`}>
                                        {product.keys.map((key) => (
                                            <div key={key.id} className="bg-gray-800 text-white text-sm p-3 rounded-lg mb-3 flex justify-between items-center">
                                                <input
                                                    type={key.open ? "text" : "password"}
                                                    value={key.key}
                                                    className="font-mono bg-transparent text-white p-2 rounded-md w-full outline-none select-none cursor-auto"
                                                    readOnly
                                                    aria-label="Product key"
                                                />
                                                <button
                                                    className="bg-accent text-white px-3 py-1 rounded-lg hover:bg-accent-dark transition-colors"
                                                    onClick={() => toggleKeyVisibility(product.id, key.id, !key.open)}
                                                    aria-label="Toggle key visibility"
                                                >
                                                    {key.open ? "Hide" : "Show"}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-400 text-center w-full">No keys purchased.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;
