import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function CouponManager() {
  const [coupons, setCoupons] = useState([]);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const { isAdmin } = useAuth();
  if (!isAdmin) {
    return <Navigate to="/dashboard/user" replace />;
  }

  const handleAddCoupon = () => {
    setEditingCoupon({
      id: '',
      code: '',
      discountPercentage: 0,
      maxUses: 0,
      currentUses: 0,
      expiryDate: new Date().toISOString().split('T')[0],
      isActive: true
    });
  };

  const handleEditCoupon = (coupon) => {
    setEditingCoupon({ ...coupon });
  };

  const handleSaveCoupon = async (coupon) => {
    try {
      if (coupon.id) {
        // Update existing coupon
        const response = await fetch(`/api/coupons/${coupon.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(coupon)
        });
        
        if (response.ok) {
          setCoupons(coupons.map(c => c.id === coupon.id ? coupon : c));
        }
      } else {
        // Create new coupon
        const response = await fetch('/api/coupons', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(coupon)
        });
        
        if (response.ok) {
          const newCoupon = await response.json();
          setCoupons([...coupons, newCoupon]);
        }
      }
      setEditingCoupon(null);
    } catch (error) {
      console.error('Error saving coupon:', error);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Coupon Management</h2>
        <button
          onClick={handleAddCoupon}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Add New Coupon
        </button>
      </div>

      {/* Coupon Editor Modal */}
      {editingCoupon && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              {editingCoupon.id ? 'Edit Coupon' : 'Add New Coupon'}
            </h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              handleSaveCoupon(editingCoupon);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Coupon Code</label>
                  <input
                    type="text"
                    value={editingCoupon.code}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, code: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Discount Percentage</label>
                  <input
                    type="number"
                    value={editingCoupon.discountPercentage}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, discountPercentage: parseInt(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Maximum Uses</label>
                  <input
                    type="number"
                    value={editingCoupon.maxUses}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, maxUses: parseInt(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                  <input
                    type="date"
                    value={editingCoupon.expiryDate}
                    onChange={(e) => setEditingCoupon({ ...editingCoupon, expiryDate: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingCoupon.isActive}
                      onChange={(e) => setEditingCoupon({ ...editingCoupon, isActive: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <span className="ml-2">Active</span>
                  </label>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingCoupon(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coupons Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Discount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uses</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {coupons.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  No coupons available
                </td>
              </tr>
            ) : (
              coupons.map((coupon) => (
                <tr key={coupon.id}>
                  <td className="px-6 py-4">{coupon.code}</td>
                  <td className="px-6 py-4">{coupon.discountPercentage}%</td>
                  <td className="px-6 py-4">{coupon.currentUses} / {coupon.maxUses}</td>
                  <td className="px-6 py-4">{new Date(coupon.expiryDate).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      coupon.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleEditCoupon(coupon)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
