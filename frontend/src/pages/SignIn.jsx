import { useEffect, useState } from "react";
import PrimaryInput from "../components/inputs/PrimaryInput";
import PrimaryButton from "../components/buttons/PrimaryButton";
import { apiService } from "../lib/apiService";
import SecondaryButton from "../components/buttons/SecondaryButton";
import { useNavigate } from "react-router-dom";
import GlobalProvider, { useGlobalProvider } from "../context/GlobalProvider";

const SignIn = () => {
    const navigate = useNavigate();
    const {setUserAndToken, token}=useGlobalProvider()
    const [form, setForm] = useState({ username: "", password: "" });
    const [isSubmit, setIsSubmit] = useState(false);
    const [message, setMessage] = useState({ message: "", color: "" });

    if(token)
        navigate("/")

    const onClickSignIn = async () => {
        if (isSubmit) return;
        setIsSubmit(true);

        const formData = new URLSearchParams();
        formData.append("username", form.username);
        formData.append("password", form.password);

        const { data, error } = await apiService.post("/user/login", formData, `application/x-www-form-urlencoded`);
        setIsSubmit(false);

        if (error) {
            setMessage({ message: error, color: "#DC2626" });
            return;
        }
        console.log(data);
        
        setMessage({ message: "User Login Successfully", color: "#16A34A" });
        setUserAndToken(data)
        setForm({ username: "", password: "" });
    };
    return (
        <div className="flex justify-center items-start min-h-screen bg-primary p-4">
            <div className="p-6 md:p-14 bg-secondary rounded-lg shadow-lg space-y-7 w-full max-w-md">
                <h2 className="text-center text-accent text-2xl font-bold">Login</h2>
                <p 
                    className={`text-center font-bold transition-all w-full h-5 ${message.message ? "scale-100" : "scale-0"}`} 
                    style={{ color: message.color }}
                >
                    {message.message}
                </p>

                <PrimaryInput 
                    title="Username"
                    value={form.username} 
                    placeholder="Enter your username" 
                    onChange={(e) => setForm({ ...form, username: e.target.value })} 
                />

                <PrimaryInput 
                    type="password"
                    title="Password"
                    value={form.password} 
                    placeholder="Enter your password" 
                    onChange={(e) => setForm({ ...form, password: e.target.value })} 
                />

                <PrimaryButton title="Sign in" onClick={onClickSignIn} otherStyle="w-full" />
                <SecondaryButton title="Don't Have an Account?" onClick={() => navigate("/sign-up")} otherStyle="w-full" />
            </div>
        </div>
    );
};

export default SignIn;
