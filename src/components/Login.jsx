import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Login = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'buyer',
    company: ''
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isRegister ? '/api/register' : '/api/login';
      const response = await axios.post(endpoint, formData);
      
      if (isRegister) {
        setError('');
        alert('Registration successful! Please login.');
        setIsRegister(false);
      } else {
        localStorage.setItem('token', response.data.token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
        onLogin(response.data.user);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'An error occurred');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>{isRegister ? 'Register' : 'Login'}</h2>
        {error && <div className="error">{error}</div>}
        <form onSubmit={handleSubmit}>
          {isRegister && (
            <input
              type="text"
              placeholder="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />
          {isRegister && (
            <>
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
              >
                <option value="buyer">Buyer</option>
                <option value="vendor">Vendor</option>
                <option value="approver">Approver</option>
              </select>
              <input
                type="text"
                placeholder="Company Name"
                value={formData.company}
                onChange={(e) => setFormData({...formData, company: e.target.value})}
                required
              />
            </>
          )}
          <button type="submit" className="btn btn-primary">
            {isRegister ? 'Register' : 'Login'}
          </button>
        </form>
        <p>
          {isRegister ? 'Already have an account?' : "Don't have an account?"}
          <button
            type="button"
            className="link-btn"
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister ? 'Login' : 'Register'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;