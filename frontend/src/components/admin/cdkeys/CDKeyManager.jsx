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

    const handleEdit = (key) => {
        setEditingKey(key);
    };

    const handleSaveEdit = async (updatedKeyData) => {
        if (!editingKey) return;

        // Find the index of the key being edited.
        // The backend expects the index of the key in the product's cd_keys array.
        const keyIndex = cdKeys.findIndex(k => k._id === editingKey._id); // Assuming _id is unique and present
        if (keyIndex === -1) {
            alert("Could not find the key index. Please refresh and try again.");
            return;
        }

        try {
            // Construct the payload for the backend.
            // Only send fields that can be updated. The 'key' string itself should not be updatable here.
            const payload = {
                isUsed: updatedKeyData.isUsed,
                // usedAt and orderId will be conditionally added
            };
            
            // Logic for setting usedAt and orderId based on isUsed status
            if (updatedKeyData.isUsed) {
                payload.usedAt = updatedKeyData.usedAt || new Date().toISOString(); // Set to provided time or now
                if (updatedKeyData.orderId) { // Only add orderId if provided
                    payload.orderId = updatedKeyData.orderId;
                }
            } else {
                payload.usedAt = null; // Clear usedAt if marked as not used
                payload.orderId = null; // Clear orderId if marked as not used
            }
            
            await updateProductCDKey(productId, keyIndex, payload);
            setEditingKey(null); // Close the form
            fetchCDKeys(); // Refresh the list
            alert("CD Key updated successfully.");
        } catch (err) {
            console.error("Error updating CD key:", err);
            alert(err.response?.data?.detail || "Failed to update CD key.");
        }
    };

    const handleCancelEdit = () => {
        setEditingKey(null);
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
                            <tr key={keyItem._id || index}>
                                <td>{keyItem.key}</td>
                                <td>{keyItem.isUsed ? 'Yes' : 'No'}</td>
                                <td>{keyItem.usedAt ? new Date(keyItem.usedAt).toLocaleString() : 'N/A'}</td>
                                <td>{keyItem.orderId || 'N/A'}</td>
                                <td className="cd-key-actions">
                                    <button onClick={() => handleEdit(keyItem)} className="edit-btn">Edit</button>
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
