import { BrowserRouter as Router, Routes, Route, Switch } from "react-router-dom";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import NotFound from "./pages/NotFound";
import Navbar from "./components/Navbar";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import AllProducts from "./pages/AllProducts";
import ProductPage from "./pages/ProductPage";
import ManagerDashboard from "./pages/dashboard/ManagerDashboard";
import ProductsDashboard from "./pages/dashboard/ProductsDashboard";
import ProductForm from "./pages/dashboard/ProductForm";
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
                <Route path="/checkout" element={<Checkout />} />


                <Route path="/dashboard" element={<ManagerDashboard />} />
                <Route path="/dashboard/products"  element={<ProductsDashboard/>}/>
                <Route path="/dashboard/product/:name"  element={<ProductForm/>}/>
                <Route path="/dashboard/product/"  element={<ProductForm/>}/>

                <Route path="*" element={<NotFound />} /> 
            </Routes>
        </Router>
    );
};

export default AppRouter;
