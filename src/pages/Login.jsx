import React, { useState } from 'react'
import './Login.css'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

export default function Login() {
    const navigate = useNavigate();
    const AUTH_URL = import.meta.env.VITE_AUTH_URL || 'http://localhost:3000';

    const [ form, setForm ] = useState({ email: '', password: '' })
    
    // 1. Error State
    const [error, setError] = useState(null);

    function handleChange(e) {
        const { name, value } = e.target
        setForm(f => ({ ...f, [ name ]: value }))
        // Clear error when user types
        if(error) setError(null);
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setError(null); // Clear previous errors

        try {
            const res = await axios.post(`${AUTH_URL}/api/auth/login`, {
                email: form.email,
                password: form.password
            }, {
                withCredentials: true
            });

           
            localStorage.setItem('user', JSON.stringify(res.data.user));

            navigate('/');

        } catch (err) {
            console.error("Login Error:", err);
            
            // 3. Display the Backend Message
            if (err.response && err.response.data && err.response.data.message) {
                setError(err.response.data.message); // e.g. "User not found, please register"
            } else {
                setError("Login failed. Check server connection.");
            }
        }
    }

    return (
        <div className="login-wrapper">
            <div className="login-card surface">
                <h2 className="login-title">Welcome back</h2>
                
                {error && (
                    <div style={{
                        background: 'rgba(255, 0, 0, 0.1)', 
                        border: '1px solid #ff4d4d', 
                        color: '#ff4d4d', 
                        padding: '10px', 
                        borderRadius: '8px',
                        marginBottom: '15px',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                {/* ... rest of your buttons and form ... */}
                <form className="login-form stack" onSubmit={handleSubmit} noValidate>
                    <div className="field-group">
                        <label htmlFor="login-email">Email</label>
                        <input id="login-email" name="email" type="email" value={form.email} onChange={handleChange} required />
                    </div>
                    <div className="field-group">
                        <label htmlFor="login-password">Password</label>
                        <input id="login-password" name="password" type="password" value={form.password} onChange={handleChange} required />
                    </div>
                    <button type="submit" className="btn btn-primary">Sign in</button>
                </form>
            </div>
        </div>
    )
}