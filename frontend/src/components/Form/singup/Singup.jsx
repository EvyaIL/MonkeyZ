import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Singup = ({ setIsAuthenticated }) => {
  const [user, setUser] = useState({ username: "",email:"", password: "",phone_number:"" });
  const [error, setError] = useState()
  const [response, setRespons] = useState()

  const [loding ,setLoding] = useState(false)
  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prevUser) => ({
      ...prevUser,
      [name]: value,
    }));
  };

  const singup = () => {
    setError("")
    setRespons("")
    setLoding(true)

    const apiUrl = `http://${process.env.REACT_APP_BACKENDS_SERVER_HOST}:${process.env.REACT_APP_BACKENDS_SERVER_PORT}/user/create`;

    axios.post(apiUrl, user)
      .then(response => {
        setLoding(false)
        setRespons("you create user successful!")
        console.log(response)
      })
      .catch(error => (setError('Error during singup:'+ error?.response?.data?.error),setLoding(false)));
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
          required
        />
        <input
          type="email"
          name="email"
          value={user.email}
          onChange={handleChange}
          placeholder="email"
          className="border p-2 mr-2"
          required
        />
        <input
          type="password"
          name="password"
          value={user.password}
          onChange={handleChange}
          placeholder="Password"
          className="border p-2 mr-2"
          required
        />
        <input
          type="phone"
          name="phone_number"
          value={user.phone_number}
          onChange={handleChange}
          placeholder="phone number"
          className="border p-2 mr-2"
          required
        />
      </div>
      <div>
          <h3 className='text-red-700'> {error}</h3>
          <h3 className='text-green-700'> {response}</h3>

      </div>
      <div>
        <button onClick={singup} className="bg-blue-500 text-white p-2">{loding?"singup...":"singup"}</button>
      </div>
    </div>
  );
};

export default Singup;