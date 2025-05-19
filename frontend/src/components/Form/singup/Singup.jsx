import React, { useState } from "react";
import axios from "axios";
import { apiService } from "../../../lib/apiService";

const Signup = ({ setIsAuthenticated }) => {
  const [user, setUser] = useState({
    username: "",
    email: "",
    password: "",
    phone_number: "",
  });
  const [error, setError] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prevUser) => ({
      ...prevUser,
      [name]: value,
    }));
  };

  const signup = async (e) => {
    e.preventDefault();
    setError("");
    setResponse("");
    setLoading(true);

    try {
      const { data, error } = await apiService.post("/user", user);
      setLoading(false);
      if (error) {
        setError("Error during signup: " + error);
        return;
      }
      setResponse("You created a user successfully!");
      setUser({ username: "", email: "", password: "", phone_number: "" });
      // Optionally, setIsAuthenticated(true);
    } catch (error) {
      setError("Error during signup: " + (error?.response?.data?.error || error.message));
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <form
        onSubmit={signup}
        className="mb-4 space-y-3"
        aria-label="Signup form"
      >
        <div>
          <label htmlFor="username" className="sr-only">
            Username
          </label>
          <input
            type="text"
            name="username"
            id="username"
            value={user.username}
            onChange={handleChange}
            placeholder="Username"
            className="border p-2 mr-2"
            required
          />
          <label htmlFor="email" className="sr-only">
            Email
          </label>
          <input
            type="email"
            name="email"
            id="email"
            value={user.email}
            onChange={handleChange}
            placeholder="Email"
            className="border p-2 mr-2"
            required
          />
          <label htmlFor="password" className="sr-only">
            Password
          </label>
          <input
            type="password"
            name="password"
            id="password"
            value={user.password}
            onChange={handleChange}
            placeholder="Password"
            className="border p-2 mr-2"
            required
          />
          <label htmlFor="phone_number" className="sr-only">
            Phone Number
          </label>
          <input
            type="tel"
            name="phone_number"
            id="phone_number"
            value={user.phone_number}
            onChange={handleChange}
            placeholder="Phone number"
            className="border p-2 mr-2"
            required
          />
        </div>
        <div>
          {error && (
            <h3 className="text-red-700" role="alert" aria-live="polite">
              {error}
            </h3>
          )}
          {response && <h3 className="text-green-700">{response}</h3>}
        </div>
        <div>
          <button
            type="submit"
            className="bg-blue-500 text-white p-2"
            disabled={loading}
          >
            {loading ? "Signing up..." : "Sign up"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Signup;
