import { useEffect, useState } from "react";
import PrimaryInput from "../components/inputs/PrimaryInput";
import PrimaryButton from "../components/buttons/PrimaryButton";
import { apiService } from "../lib/apiService";
import SecondaryButton from "../components/buttons/SecondaryButton";
import { useNavigate } from "react-router-dom";
import { useGlobalProvider } from "../context/GlobalProvider";

const SignUp = () => {
    const navigate = useNavigate();

    const [form, setForm] = useState({ username: "", password: "", email: "", phone_number: "" });
    const [isSubmit, setIsSubmit] = useState(false);
    const [message, setMessage] = useState({ message: "", color: "" });
    const {token}=useGlobalProvider()


    if(token)
        navigate("/")

    const onClickSignUp = async () => {
        if (isSubmit) return;
        setIsSubmit(true);
        const { data, error } = await apiService.post("/user", form);
        setIsSubmit(false);

        if (error) {
            setMessage({ message: error, color: "#DC2626" });
            return;
        }
        setMessage({ message: "User created successfully", color: "#16A34A" });

        setForm({ username: "", password: "", email: "", phone_number: "" });
    };

    return (
        <div className="flex justify-center items-start min-h-screen bg-primary p-4">
            <div className="p-6 bg-secondary rounded-lg shadow-lg space-y-5 mt-5 w-full sm:w-[80%] md:w-[60%] lg:w-[40%] h-auto">
                <h2 className="text-center text-accent text-2xl font-bold">Create An Account</h2>
                <p className={`text-center font-bold transition-all ${message.message ? "scale-100" : "scale-0"} w-full h-5`}
                    style={{ color: message.color }}
                >
                    {message.message}
                </p>

                <div className="flex flex-col sm:flex-row sm:space-x-5 space-y-5 sm:space-y-0 justify-center py-5">
                    <div className="space-y-5 w-full">
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
                    </div>

                    <div className="space-y-5 w-full">
                        <PrimaryInput
                            type="email"
                            title="Email"
                            value={form.email}
                            placeholder="Enter your email"
                            otherStyle="w-full"
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                        />

                        <PrimaryInput
                            title="Phone Number"
                            type="number"
                            value={form.phone_number}
                            placeholder="Enter your phone number"
                            onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
                        />
                    </div>
                </div>

                <SecondaryButton title="Sign Up" onClick={onClickSignUp} otherStyle="w-full mt-5" />
                <PrimaryButton title="Already have an account?" onClick={() => navigate("/sign-in")} otherStyle="w-full" />
            </div>
        </div>
    );
};

export default SignUp;
