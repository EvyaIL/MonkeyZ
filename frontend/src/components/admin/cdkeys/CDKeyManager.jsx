import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { getProductCDKeys, deleteProductCDKey, updateProductCDKey } from '../../../services/adminProductService';
import CDKeyEditForm from './CDKeyEditForm'; // Import the new form
import './CDKeyManager.css';

function CDKeyManager({ productId, productName }) {
    const [cdKeys, setCdKeys] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [editingKey, setEditingKey] = useState(null); // State to hold the key being edited
    const [editingKeyIndex, setEditingKeyIndex] = useState(null); // State to hold the index of the key being edited

    const fetchCDKeys = useCallback(async () => {
        if (!productId) return;
        setIsLoading(true);
        setError(null);
        try {
            const data = await getProductCDKeys(productId);
            setCdKeys(data || []);
        } catch (err) {
            console.error("Error fetching CD keys:", err);
            setError(err.response?.data?.detail || err.message || "Failed to fetch CD keys.");
        } finally {
            setIsLoading(false);
        }
    }, [productId]);

    useEffect(() => {
        fetchCDKeys();
    }, [fetchCDKeys]);

    const handleDelete = async (keyId, keyIndex) => {
        if (window.confirm(`Are you sure you want to delete this CD key?`)) {
            try {
                await deleteProductCDKey(productId, keyIndex);
                // Refresh CD keys list
                fetchCDKeys();
                alert("CD Key deleted successfully.");
            } catch (err) {
                console.error("Error deleting CD key:", err);
                alert(err.response?.data?.detail || "Failed to delete CD key.");
            }
        }
    };

    const handleEdit = (key, index) => { // Accept index here
        setEditingKey(key);
        setEditingKeyIndex(index); // Store the index
    };

    const handleSaveEdit = async (updatedKeyData) => {
        if (!editingKey || editingKeyIndex === null) { // Check editingKeyIndex as well
            alert("No key selected for editing or index is missing.");
            return;
        }

        // const keyIndex = cdKeys.findIndex(k => k._id === editingKey._id); // OLD LOGIC - REMOVED
        // Use the stored editingKeyIndex directly
        const keyIndex = editingKeyIndex;

        // if (keyIndex === -1) { // This check might still be relevant if index could become invalid
        //     alert("Could not find the key index. Please refresh and try again.");
        //     return;
        // }

        try {
            const payload = {
                isUsed: updatedKeyData.isUsed,
            };
            
            if (updatedKeyData.isUsed) {
                payload.usedAt = updatedKeyData.usedAt || new Date().toISOString();
                if (updatedKeyData.orderId) { 
                    payload.orderId = updatedKeyData.orderId;
                }
            } else {
                payload.usedAt = null; 
                payload.orderId = null; 
            }
            
            await updateProductCDKey(productId, keyIndex, payload);
            setEditingKey(null); 
            setEditingKeyIndex(null); // Clear the index
            fetchCDKeys(); 
            alert("CD Key updated successfully.");
        } catch (err) {
            console.error("Error updating CD key:", err);
            alert(err.response?.data?.detail || "Failed to update CD key.");
        }
    };

    const handleCancelEdit = () => {
        setEditingKey(null);
        setEditingKeyIndex(null); // Clear the index on cancel
    };

    if (!productId) {
        return <div className="cd-key-manager-container"><p>No product selected.</p></div>;
    }

    if (isLoading) {
        return <div className="cd-key-manager-container loading-message"><p>Loading CD keys for {productName}...</p></div>;
    }

    if (error) {
        return <div className="cd-key-manager-container error-message"><p>Error: {error}</p></div>;
    }

    return (
        <div className="cd-key-manager-container">
            <h2>Manage CD Keys for: {productName}</h2>
            {cdKeys.length === 0 ? (
                <p>No CD keys found for this product.</p>
            ) : (
                <table className="cd-keys-table">
                    <thead>
                        <tr>
                            <th>Key</th>
                            <th>Is Used?</th>
                            <th>Used At</th>
                            <th>Order ID</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cdKeys.map((keyItem, index) => (
                            <tr key={keyItem.key + '-' + index}> {/* Use a more robust key if possible, e.g., key string + index */}
                                <td>{keyItem.key}</td>
                                <td>{keyItem.isUsed ? 'Yes' : 'No'}</td>
                                <td>{keyItem.usedAt ? new Date(keyItem.usedAt).toLocaleString() : 'N/A'}</td>
                                <td>{keyItem.orderId || 'N/A'}</td>
                                <td className="cd-key-actions">
                                    {/* Pass index to handleEdit */}
                                    <button onClick={() => handleEdit(keyItem, index)} className="edit-btn">Edit</button>
                                    {/* handleDelete already correctly receives the index */}
                                    <button onClick={() => handleDelete(keyItem._id, index)} className="delete-btn">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
            {editingKey && (
                <CDKeyEditForm
                    cdKey={editingKey}
                    onSave={handleSaveEdit}
                    onCancel={handleCancelEdit}
                />
            )}
        </div>
    );
}

CDKeyManager.propTypes = {
    productId: PropTypes.string.isRequired,
    productName: PropTypes.string.isRequired,
};

export default CDKeyManager;
