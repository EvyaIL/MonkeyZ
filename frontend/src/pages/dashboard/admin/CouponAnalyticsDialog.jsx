import React, { useEffect, useState } from "react";
import axios from "axios";
import { Dialog, DialogTitle, DialogContent, Button, Typography, Divider } from "@mui/material";

export default function CouponAnalyticsDialog({ open, onClose, couponCode }) {
  const [coupon, setCoupon] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        {analytics && (
          <div style={{ marginTop: 16 }}>
            <Typography variant="subtitle1" style={{ fontWeight: "bold" }}>Usage Analytics</Typography>
            <Typography>Total: {analytics.total}</Typography>
            <Typography>Completed: {analytics.completed}</Typography>
            <Typography>Cancelled: {analytics.cancelled}</Typography>
            <Typography>Pending: {analytics.pending}</Typography>
            <Typography>Processing: {analytics.processing}</Typography>
            <Typography>Awaiting Stock: {analytics.awaiting_stock}</Typography>
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
        )}
        {!loading && !coupon && !analytics && <Typography>No analytics available.</Typography>}
        <Button onClick={onClose} style={{ marginTop: 16 }}>Close</Button>
      </DialogContent>
    </Dialog>
  );
}
