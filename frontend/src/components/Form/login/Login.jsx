import React, { useState } from "react";
import axios from "axios";
import { apiService } from "../../../lib/apiService";

const Login = ({ setIsAuthenticated }) => {
  const [user, setUser] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prevUser) => ({
      ...prevUser,
      [name]: value,
    }));
  };

  const login = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const formData = new URLSearchParams();
    formData.append("username", user.username);
    formData.append("password", user.password);

    try {
      const { data, error } = await apiService.post("/user/login", formData, "application/x-www-form-urlencoded");
      if (error) {
        setError("Error during login: " + error);
        setLoading(false);
        return;
      }
      const { access_token, token_expiry } = data;
      const expiryTime = new Date(new Date().getTime() + token_expiry * 1000);
      localStorage.setItem("token", access_token); // Changed from "access_token" to "token" for consistency
      localStorage.setItem("token_expiry", expiryTime);
      localStorage.setItem("is_authenticated", true);
      apiService.setToken(access_token); // Explicitly set token in apiService
      setIsAuthenticated(true);
    } catch (error) {
      setError("Error during login: " + (error?.response?.data?.error || error.message));
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-4">
      <form onSubmit={login} className="mb-4 space-y-3" aria-label="Login form">
        <div>
          <label htmlFor="username" className="sr-only">
            Username
          </label>
          <input
            id="username"
            type="text"
            name="username"
            value={user.username}
            onChange={handleChange}
            placeholder="Username"
            className="border p-2 mr-2"
            autoComplete="username"
            required
          />
          <label htmlFor="password" className="sr-only">
            Password
          </label>
          <input
            id="password"
            type="password"
            name="password"
            value={user.password}
            onChange={handleChange}
            placeholder="Password"
            className="border p-2 mr-2"
            autoComplete="current-password"
            required
          />
        </div>
        {error && (
          <div aria-live="polite">
            <h3 className="text-red-700" role="alert">
              {error}
            </h3>
          </div>
        )}
        <div>
          <button
            type="submit"
            className="bg-blue-500 text-white p-2"
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Login;
