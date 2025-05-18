import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Navbar from "./components/Navbar";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import AllProducts from "./pages/AllProducts";
import ProductPage from "./pages/ProductPage";
import Checkout from "./pages/Checkout";

const AppRouter = () => {
    return (
        <Router>
            <Navbar />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/sign-up" element={<SignUp />} />
                <Route path="/sign-in" element={<SignIn />} />
                <Route path="/products" element={<AllProducts />} />
                <Route path="/product/:name" element={<ProductPage />} />

                {/* Grow payment routes */}
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/success" element={<div className="p-4 text-green-600 text-center text-xl">Payment Successful!</div>} />
                <Route path="/fail" element={<div className="p-4 text-red-600 text-center text-xl">Payment Failed. Please try again.</div>} />

                <Route path="*" element={<NotFound />} />
            </Routes>
        </Router>
    );
};

export default AppRouter;
