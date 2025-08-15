import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const CouponList = () => {
    const [coupons, setCoupons] = useState([]);

    const fetchCoupons = useCallback(async () => {
        try {
            const response = await axios.get('/api/admin/coupons');
            setCoupons(response.data);
        } catch (error) {
            console.error('Error fetching coupons:', error);
        }
    }, []);

    useEffect(() => {
        fetchCoupons();
        const interval = setInterval(fetchCoupons, 5000); // Refresh every 5 seconds
        return () => clearInterval(interval);
    }, [fetchCoupons]);

    return (
        <div>
            <h2>Coupons</h2>
            <table>
                <thead>
                    <tr>
                        <th>Code</th>
                        <th>Active</th>
                        <th>Discount Type</th>
                        <th>Discount Value</th>
                        <th>Usage Count</th>
                        <th>Max Uses</th>
                        <th>Max Per User</th>
                        <th>User Usages</th>
                    </tr>
                </thead>
                <tbody>
                    {coupons.map((coupon) => (
                        <tr key={coupon._id || coupon.id}>
                            <td>{coupon.code}</td>
                            <td>{coupon.active ? 'Yes' : 'No'}</td>
                            <td>{coupon.discountType}</td>
                            <td>{coupon.discountValue}</td>
                            <td>{coupon.usageCount || 0}</td>
                            <td>{coupon.maxUses || 'Unlimited'}</td>
                            <td>{coupon.maxUsagePerUser || 'Unlimited'}</td>
                            <td>
                                {coupon.userUsages && Object.keys(coupon.userUsages).length > 0 ? (
                                    <div style={{fontSize: '12px'}}>
                                        {Object.entries(coupon.userUsages).map(([email, count]) => (
                                            <div key={email}>{email}: {count}</div>
                                        ))}
                                    </div>
                                ) : (
                                    'None'
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default CouponList;
