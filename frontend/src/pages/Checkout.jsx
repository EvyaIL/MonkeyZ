import { useEffect, useState } from "react";
import axios from "axios";
import { useGlobalProvider } from "../context/GlobalProvider";
import { useNavigate } from "react-router-dom";

const Checkout = () => {
    const navigate = useNavigate();
    const { token, user, cartItems } = useGlobalProvider();

    useEffect(() => {
        if (!token || !user) navigate("/");
    }, [token, user, navigate]);

    const [form, setForm] = useState({
        cardNumber: "",
        expDate: "",
        cvv: "",
        currency: "1", // 1 = NIS
        paymentMethod: "credit", // "credit", "bit", "paybox"
    });

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");

    const totalAmount = Object.values(cartItems)
        .reduce((acc, item) => acc + item.price * item.count, 0)
        .toFixed(2);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const validateForm = () => {
        if (form.paymentMethod === "credit") {
            const cardRegex = /^\d{16}$/;
            const expRegex = /^(0[1-9]|1[0-2])\d{2}$/; 
            const cvvRegex = /^\d{3}$/;

            if (!cardRegex.test(form.cardNumber)) return "Invalid card number.";
            if (!expRegex.test(form.expDate)) return "Invalid expiration date (MMYY).";
            if (!cvvRegex.test(form.cvv)) return "Invalid CVV.";
        }
        return "";
    };

    const handlePayment = async () => {
        setLoading(true);
        setMessage("");

        const validationError = validateForm();
        if (validationError) {
            setMessage(validationError);
            setLoading(false);
            return;
        }

        try {
            const { data } = await axios.post("https://your-secure-api.com/api/pay", {
                ...form,
            });

            if (data.success) {
                setMessage("Payment successful!");
            } else {
                setMessage("Payment failed. Try again.");
            }
        } catch (error) {
            setMessage("Error processing payment.");
        }

        setLoading(false);
    };

    return (
        <div className="p-6 bg-primary min-h-screen flex items-center justify-center">
            <div className="bg-secondary p-6 rounded shadow-lg w-full max-w-lg border border-border">
                <h2 className="text-xl font-bold mb-4 text-border">Checkout</h2>

                <div className="mb-4 p-4 border rounded bg-primary border-border">
                    <h3 className="font-semibold mb-2 text-border">Items in Cart</h3>
                    {Object.values(cartItems).map((item) => (
                        <div key={item.id} className="flex justify-between border-b border-border py-2">
                            <p className="text-border">{item.name} (x{item.count})</p>
                            <p className="text-border">${(item.price * item.count).toFixed(2)}</p>
                        </div>
                    ))}
                    <div className="font-bold text-right mt-2 text-border">Total: ${totalAmount}</div>
                </div>

                <label className="block mb-2 text-border">Payment Method</label>
                <select
                    name="paymentMethod"
                    value={form.paymentMethod}
                    onChange={handleChange}
                    className="w-full p-2 mb-3 border rounded border-border bg-primary text-border"
                >
                    <option value="credit">Credit Card</option>
                    <option value="bit">Bit</option>
                    <option value="paybox">PayBox</option>
                </select>

                {form.paymentMethod === "credit" && (
                    <>
                        <input
                            type="text"
                            name="cardNumber"
                            placeholder="Card Number"
                            value={form.cardNumber}
                            onChange={handleChange}
                            className="w-full p-2 mb-2 border rounded border-border bg-primary text-border"
                        />
                        <input
                            type="text"
                            name="expDate"
                            placeholder="MMYY (e.g., 1225)"
                            value={form.expDate}
                            onChange={handleChange}
                            className="w-full p-2 mb-2 border rounded border-border bg-primary text-border"
                        />
                        <input
                            type="text"
                            name="cvv"
                            placeholder="CVV"
                            value={form.cvv}
                            onChange={handleChange}
                            className="w-full p-2 mb-2 border rounded border-border bg-primary text-border"
                        />
                    </>
                )}

                <button
                    onClick={handlePayment}
                    className="w-full bg-accent text-white p-2 rounded hover:opacity-80 transition"
                    disabled={loading}
                >
                    {loading ? "Processing..." : `Pay $${totalAmount}`}
                </button>

                {message && (
                    <p className={`mt-2 text-center ${message.includes("successful") ? "text-success" : "text-danger"}`}>
                        {message}
                    </p>
                )}
            </div>
        </div>
    );
};

export default Checkout;
