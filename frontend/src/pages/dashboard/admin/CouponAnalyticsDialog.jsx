import React, { useEffect, useState } from "react";
import axios from "axios";
import { Dialog, DialogTitle, DialogContent, Button, Typography, Divider } from "@mui/material";
import { useStateContext } from '../../context/StateContext';

export default function CouponAnalyticsDialog({ open, onClose, couponCode }) {
  const [coupon, setCoupon] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { lastUpdated } = useStateContext();

  useEffect(() => {
    if (open && couponCode) {
      setLoading(true);
      setError("");
      axios.get(`/admin/coupons/${couponCode}/analytics`)
        .then((analyticsRes) => {
          setAnalytics(analyticsRes.data);
          return axios.get(`/admin/coupons/info?code=${encodeURIComponent(couponCode)}`);
        })
        .then((couponRes) => {
          setCoupon(couponRes.data || null);
        })
        .catch((err) => {
          setError("Failed to load analytics");
          setCoupon(null);
          setAnalytics(null);
        })
        .finally(() => setLoading(false));
    } else {
      setCoupon(null);
      setAnalytics(null);
    }
  }, [open, couponCode]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (coupon) {
        setLoading(true);
        try {
          const data = await axios.get(`/admin/coupons/${coupon.code}/analytics`);
          setAnalytics(data);
        } catch (error) {
          console.error("Failed to fetch coupon analytics:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchAnalytics();
  }, [coupon, lastUpdated]); // Re-fetch when lastUpdated changes

  const renderAnalytics = () => {
    if (!analytics || !analytics.usageAnalytics) return <p>No analytics data available.</p>;

    const { usageAnalytics } = analytics;
    
    // Use the total_orders field directly from the backend analytics object.
    // Calculate total as the sum of all statuses (completed, cancelled, pending, processing, awaiting_stock)
    const total =
      (usageAnalytics.completed || 0) +
      (usageAnalytics.cancelled || 0) +
      (usageAnalytics.pending || 0) +
      (usageAnalytics.processing || 0) +
      (usageAnalytics.awaiting_stock || 0);

    return (
      <div>
        <Typography variant="subtitle1" style={{ fontWeight: "bold" }}>Usage Analytics</Typography>
        <Typography>Total: {total}</Typography>
        <Typography>Completed: {usageAnalytics.completed || 0}</Typography>
        <Typography>Cancelled: {usageAnalytics.cancelled || 0}</Typography>
        <Typography>Pending: {usageAnalytics.pending || 0}</Typography>
        <Typography>Processing: {usageAnalytics.processing || 0}</Typography>
        <Typography>Awaiting Stock: {usageAnalytics.awaiting_stock || 0}</Typography>
        <Typography>Unique Users: {analytics.unique_users}</Typography>
        <Divider style={{ margin: "12px 0" }} />
        <Typography variant="subtitle2" style={{ fontWeight: "bold" }}>Per-User Usage</Typography>
        {analytics.user_usages && Object.keys(analytics.user_usages).length > 0 ? (
          <div>
            {Object.entries(analytics.user_usages).map(([user, count]) => (
              <Typography key={user}>{user}: {count} uses</Typography>
            ))}
          </div>
        ) : (
          <Typography>No users have used this coupon yet.</Typography>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Coupon Analytics</DialogTitle>
      <DialogContent>
        {loading && <Typography>Loading...</Typography>}
        {error && <Typography color="error">{error}</Typography>}
        {coupon && (
          <div style={{ marginBottom: 16 }}>
            <Typography variant="subtitle1"><b>Code:</b> {coupon.code}</Typography>
            <Typography><b>Type:</b> {coupon.discountType}</Typography>
            <Typography><b>Value:</b> {coupon.discountValue}{coupon.discountType === "percentage" ? "%" : ""}</Typography>
            <Typography><b>Expires:</b> {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleString() : "Never expires"}</Typography>
            <Typography><b>Uses:</b> {coupon.usageCount ?? 0}</Typography>
            <Typography><b>Max Uses:</b> {coupon.maxUses ?? "∞"}</Typography>
            <Typography><b>Max Uses Per User:</b> {coupon.maxUsagePerUser ?? "∞"}</Typography>
            <Typography><b>Created:</b> {coupon.createdAt ? new Date(coupon.createdAt).toLocaleString() : "-"}</Typography>
          </div>
        )}
        <Divider />
        {renderAnalytics()}
        {!loading && !coupon && !analytics && <Typography>No analytics available.</Typography>}
        <Button onClick={onClose} style={{ marginTop: 16 }}>Close</Button>
      </DialogContent>
    </Dialog>
  );
}
