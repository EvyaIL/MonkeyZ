import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Login = ({setIsAuthenticated  }) => {
  const [user, setUser] = useState({ username: "", password: "" });
  const [error, setError] = useState()
  const [loding ,setLoding] = useState(false)
  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prevUser) => ({
      ...prevUser,
      [name]: value,
    }));
  };

  const login = () => {
    setError("")
    setLoding(true)
    const formData = new URLSearchParams();
    formData.append('username', user.username);
    formData.append('password', user.password);
    const apiUrl = `http://${process.env.REACT_APP_BACKENDS_SERVER_HOST}:${process.env.REACT_APP_BACKENDS_SERVER_PORT}/auth/login`;

    axios.post(apiUrl, formData)
      .then(response => {
        const { access_token, token_type ,token_expiry } = response.data;
        const expiryTime = new Date(new Date().getTime() + token_expiry * 1000);
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('token_expiry', expiryTime);
        localStorage.setItem('is_authenticated',true);
        setLoding(false)
        setIsAuthenticated(true)
      })
      .catch(error => (setError('Error during login:'+ error?.response?.data?.error),setLoding(false)));
  };

  return (
    <div className="container mx-auto p-4">
      <div className="mb-4">
        <input
          type="text"
          name="username"
          value={user.username}
          onChange={handleChange}
          placeholder="Username"
          className="border p-2 mr-2"
        />
        <input
          type="password"
          name="password"
          value={user.password}
          onChange={handleChange}
          placeholder="Password"
          className="border p-2 mr-2"
        />
      </div>
      <div>
          <h3 className='text-red-700'> {error}</h3>
      </div>
      <div>
        <button onClick={login} className="bg-blue-500 text-white p-2">{loding?"login...":"login"}</button>
      </div>
    </div>
  );
};

export default Login;