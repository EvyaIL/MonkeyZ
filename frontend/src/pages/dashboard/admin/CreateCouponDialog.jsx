import React, { useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, FormControlLabel, Checkbox, MenuItem
} from "@mui/material";

const discountTypes = [
  { value: "percentage", label: "Percentage (%)" },
  { value: "fixed", label: "Fixed Amount" }
];

export default function CreateCouponDialog({ open, onClose, onCreated }) {
  const [form, setForm] = useState({
    code: "",
    discountType: "percentage",
    discountValue: "",
    active: true,
    expiresAt: "",
    maxUses: "",
    maxUsagePerUser: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Validate fields
  const isPositiveInt = v => v === "" || (Number.isInteger(+v) && +v > 0);
  const isValid =
    form.code.trim() &&
    form.discountType &&
    form.discountValue !== "" &&
    isPositiveInt(form.maxUses) &&
    isPositiveInt(form.maxUsagePerUser);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({
      ...f,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      // Prepare payload
      const payload = {
        code: form.code.trim().toLowerCase(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        active: form.active,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        maxUses: form.maxUses === "" ? 0 : Number(form.maxUses),
        maxUsagePerUser: form.maxUsagePerUser === "" ? 0 : Number(form.maxUsagePerUser),
      };
      // Send to backend
      const res = await fetch("/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to create coupon");
      const data = await res.json();
      onCreated && onCreated(data);
      setForm({
        code: "",
        discountType: "percentage",
        discountValue: "",
        active: true,
        expiresAt: "",
        maxUses: "",
        maxUsagePerUser: "",
      });
      onClose();
    } catch (e) {
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Coupon</DialogTitle>
      <DialogContent>
        <TextField
          label="Coupon Code"
          name="code"
          value={form.code}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
        />
        <TextField
          select
          label="Discount Type"
          name="discountType"
          value={form.discountType}
          onChange={handleChange}
          fullWidth
          margin="normal"
        >
          {discountTypes.map(opt => (
            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
          ))}
        </TextField>
        <TextField
          label={form.discountType === "percentage" ? "Discount (%)" : "Discount Amount"}
          name="discountValue"
          type="number"
          value={form.discountValue}
          onChange={handleChange}
          fullWidth
          margin="normal"
          required
          inputProps={{ min: 0 }}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={form.active}
              onChange={handleChange}
              name="active"
            />
          }
          label="Active"
        />
        <TextField
          label="Expires At"
          name="expiresAt"
          type="datetime-local"
          value={form.expiresAt}
          onChange={handleChange}
          fullWidth
          margin="normal"
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Max Uses (Total)"
          name="maxUses"
          type="number"
          value={form.maxUses}
          onChange={handleChange}
          fullWidth
          margin="normal"
          inputProps={{ min: 0 }}
          helperText={form.maxUses === "" || form.maxUses === "0" ? "∞ (Unlimited)" : ""}
        />
        <TextField
          label="Max Uses Per User"
          name="maxUsagePerUser"
          type="number"
          value={form.maxUsagePerUser}
          onChange={handleChange}
          fullWidth
          margin="normal"
          inputProps={{ min: 0 }}
          helperText={form.maxUsagePerUser === "" || form.maxUsagePerUser === "0" ? "∞ (Unlimited)" : ""}
        />
        {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          disabled={!isValid || loading}
          variant="contained"
          color="primary"
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}
