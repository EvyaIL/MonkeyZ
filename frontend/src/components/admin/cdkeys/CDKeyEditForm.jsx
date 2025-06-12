import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './CDKeyEditForm.css'; // We'll create this CSS file next

function CDKeyEditForm({ cdKey, onSave, onCancel }) {
    const [key, setKey] = useState('');
    const [isUsed, setIsUsed] = useState(false);
    // Add other fields if necessary, e.g., usedAt, orderId, though they might be display-only or handled differently

    useEffect(() => {
        if (cdKey) {
            setKey(cdKey.key || '');
            setIsUsed(cdKey.isUsed || false);
        }
    }, [cdKey]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ ...cdKey, key, isUsed });
    };

    if (!cdKey) return null;

    return (
        <div className="cd-key-edit-form-modal">
            <div className="cd-key-edit-form-container">
                <h3>Edit CD Key</h3>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="cd-key-input">CD Key:</label>
                        <input
                            id="cd-key-input"
                            type="text"
                            value={key}
                            onChange={(e) => setKey(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="cd-key-is-used-checkbox">Is Used:</label>
                        <input
                            id="cd-key-is-used-checkbox"
                            type="checkbox"
                            checked={isUsed}
                            onChange={(e) => setIsUsed(e.target.checked)}
                        />
                    </div>
                    {/* Display other fields like usedAt, orderId if they are part of cdKey and relevant */}
                    {cdKey.usedAt && (
                        <div className="form-group-readonly">
                            <label>Used At:</label>
                            <span>{new Date(cdKey.usedAt).toLocaleString()}</span>
                        </div>
                    )}
                    {cdKey.orderId && (
                        <div className="form-group-readonly">
                            <label>Order ID:</label>
                            <span>{cdKey.orderId}</span>
                        </div>
                    )}
                    <div className="form-actions">
                        <button type="submit" className="save-btn">Save</button>
                        <button type="button" onClick={onCancel} className="cancel-btn">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

CDKeyEditForm.propTypes = {
    cdKey: PropTypes.shape({
        _id: PropTypes.oneOfType([PropTypes.string, PropTypes.object]), // MongoDB ObjectId can be object initially
        key: PropTypes.string,
        isUsed: PropTypes.bool,
        usedAt: PropTypes.string, // Assuming ISO string date
        orderId: PropTypes.string,
    }),
    onSave: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
};

export default CDKeyEditForm;
