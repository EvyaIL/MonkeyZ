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
<<<<<<< Updated upstream

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
=======
import FAQ from "./pages/FAQ";
import AboutUs from "./pages/AboutUs";
import Contact from "./pages/Contact";
import ResetPassword from "./pages/ResetPassword";
import ForgotPassword from "./pages/ForgotPassword";
import BlogPage from "./pages/BlogPage";
import BlogPostPage from "./pages/BlogPostPage";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import AdminPanel from "./pages/AdminPanel";

const AppRouter = () => {
  return (
    <>
      {/* Navbar is rendered here, Footer is likely in App.jsx or similar parent component */}
      <Navbar />
      <Routes>
        {/* Main pages */}
        <Route path="/" element={<Home />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/account" element={<Profile />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/products" element={<AllProducts />} />
        <Route path="/product/:name" element={<ProductPage />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<Contact />} />
        
        {/* Admin Panel */}
        <Route path="/admin" element={<AdminPanel />} />
>>>>>>> Stashed changes


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
