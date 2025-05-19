import { useEffect, useState } from "react";
import { apiService } from "../../lib/apiService";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import PrimaryButton from "../../components/buttons/PrimaryButton";
import { useGlobalProvider } from "../../context/GlobalProvider";
import SecondaryInput from "../inputs/SecondaryInput";
import PrimaryInput from "../inputs/PrimaryInput";
import SecondaryButton from "../buttons/SecondaryButton";

const KeyList = ({ productId }) => {
    const { token } = useGlobalProvider();
    
    const [keys, setKeys] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ message: "", color: "" });
    const [newKey, setNewKey] = useState("");

    useEffect(() => {
        fetchKeys();
    }, [productId]);

    const fetchKeys = async () => {
        setLoading(true);
        apiService.setToken(token);
        const params = { product_id: productId, start_index: 0, max_keys: -1 };
        const { data, error } = await apiService.get("/key/by_product", params);
        if (error)  setMessage({ message: error, color: "#DC2626" });
        setKeys(data || []);
        setLoading(false);
    };

    const createKey = async () => {
        if (!newKey) return;
        
        setMessage({ message: "", color: "#" });
        apiService.setToken(token);
        const key = { key: newKey, is_active: true, product: productId };
        const { data, error } = await apiService.post("/key", key);
        if (error) { 
            setMessage({ message: error, color: "#DC2626" });
            return
        }
        setKeys([...keys, { ...key, id: data }]);
        setNewKey("");
        setMessage({ message: `key - ${data} create successfully`, color: "#16A34A" });
    };

    const deleteKey = async (keyId) => {
        setMessage({ message: "", color: "#" });
        apiService.setToken(token);
        const { data, error } = await apiService.delete("/key", { key_id: keyId });
        if (error) { 
            setMessage({ message: error, color: "#DC2626" });
            return
        }
        setKeys(keys.filter(k => k.id !== keyId));
        setMessage({ message: `key - ${keyId} delete successfully`, color: "#16A34A" });

    };


    const updateKey = (e, key, name, value) => {
        if (key.owner) return;
        setKeys(keys.map(k => (k.id === key.id ? { ...k, [name]: value } : k)));
    };

    const saveKey = async (key) => {

        setMessage({ message: "", color: "#" });
        apiService.setToken(token);
        const { data, error } = await apiService.put("/key", key, { key_id: key.id });
        if (error) { 
            setMessage({ message: error, color: "#DC2626" });
            return
        }
        updateKey(null, key, "edit", false);
        setMessage({ message: `key - ${key.id} update successfully`, color: "#16A34A" });

    };

    return (
        <div className="bg-secondary border border-gray-700 rounded-lg shadow-lg p-6 mt-6 text-white">
            <h3 className="text-xl font-bold text-accent mb-4">Product Keys</h3>
            {loading && <AiOutlineLoading3Quarters className="text-accent animate-spin text-2xl mx-auto" />}
            <p className={`text-center font-bold transition-all mb-10 ${message.message ? "scale-100" : "scale-0"} w-full h-5`}
                    style={{ color: message.color }}
                    >
                        {message.message}
            </p>
            <div className="flex gap-2 mb-4">
                <input 
                    type="text" 
                    value={newKey} 
                    onChange={(e) => setNewKey(e.target.value)} 
                    placeholder="Enter new key"
                    className="p-2 border border-gray-600 bg-gray-800 text-white rounded"
                />
                <PrimaryButton title="Create Key" onClick={createKey} />
            </div>
            {keys.length === 0 && !loading && <p>No keys available for this product.</p>}
            {keys.length > 0 && (
                <table className="w-full text-left border-collapse border border-gray-700">
                    <thead>
                        <tr className="bg-gray-800">
                            <th className="p-2 border border-gray-600">Value</th>
                            <th className="p-2 border border-gray-600">Active</th>
                            <th className="p-2 border border-gray-600">Owner</th>
                            <th className="p-2 border border-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {keys.map((key) => (
                            <tr key={key.id} className="bg-gray-900 border-t border-gray-700">
                                <td className="p-2 border border-gray-600">
                                    {!key.edit ? key.key : 
                                        <PrimaryInput value={key.key} onChange={(e) => updateKey(e, key, "key", e.target.value)} />}
                                </td>
                                <td className="p-2 border border-gray-600 text-center">
                                     <SecondaryInput type="checkbox" value={key.is_active} disabled={key.owner||!key?.edit} checked={key.is_active} onChange={() =>  updateKey(null, key, "is_active", !key.is_active)} />
                                </td>
                                <td className="p-2 border border-gray-600">{key.owner || "N/A"}</td>
                                <td className="p-2 border border-gray-600 flex gap-2">
                                    {!key.edit ? (
                                        <>
                                            <SecondaryButton otherStyle={`text-orange-500 ${key.owner &&"opacity-40"}`} onClick={() => updateKey(null, key, "edit", true)} disabled={key.owner} 
                                               title={ <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                                                </svg>}
                                                /> 
                                            <SecondaryButton otherStyle={`text-red-500 ${key.owner &&"opacity-40"}`} onClick={() => deleteKey(key.id)} disabled={key.owner}  
                                                title={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                                </svg>}
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <SecondaryButton otherStyle="text-green-500" onClick={() => saveKey(key)} title={"Save"} />
                                            <SecondaryButton otherStyle="text-red-500" onClick={() => updateKey(null, key, "edit", false)} title={"Cancel"} />
                                        </>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default KeyList;
