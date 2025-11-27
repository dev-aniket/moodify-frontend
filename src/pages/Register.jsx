import React, { useState } from 'react'
import './Register.css'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

export default function Register() {
    const navigate = useNavigate();
    const AUTH_URL = import.meta.env.VITE_AUTH_URL || 'http://localhost:3000';

    const [ form, setForm ] = useState({
        email: '',
        firstName: '',
        lastName: '',
        password: '',
        userType: 'user',
    })

    // New State for Errors
    const [error, setError] = useState(null);

    function handleChange(e) {
        const { name, value } = e.target
        setForm(f => ({ ...f, [ name ]: value }))
        // Clear error when user starts typing again
        if(error) setError(null);
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setError(null); // Clear previous errors

        try {
            const res = await axios.post(`${AUTH_URL}/api/auth/register`, {
                email: form.email,
                fullname: {
                    firstName: form.firstName,
                    lastName: form.lastName
                },
                password: form.password,
                role: form.userType
            }, {
                withCredentials: true
            });

            // FIX: Save user to localStorage so Home.jsx knows we are logged in
            localStorage.setItem('user', JSON.stringify(res.data.user));

            navigate('/');

        } catch (err) {
            console.error("Error during registration:", err);
            
            // Handle different error formats
            if (err.response && err.response.data) {
                const data = err.response.data;
                
                // Case 1: Validation Array (from express-validator)
                if (data.errors && Array.isArray(data.errors)) {
                    setError(data.errors[0].msg); // Show the first validation error
                } 
                // Case 2: Simple Message (from controller)
                else if (data.message) {
                    setError(data.message);
                } 
                else {
                    setError("Registration failed. Please try again.");
                }
            } else {
                setError("Server unreachable. Check your connection.");
            }
        }
    }

    return (
        <div className="register-wrapper">
            <div className="register-card surface">
                <h2 className="register-title">Create your account</h2>
                <p className="text-muted" style={{ marginTop: 'var(--space-1)' }}>
                    Join us to get started
                </p>
                
                {/* --- ERROR ALERT BOX --- */}
                {error && (
                    <div style={{
                        background: 'rgba(255, 0, 0, 0.1)', 
                        border: '1px solid red', 
                        color: '#ff4d4d', 
                        padding: '10px', 
                        borderRadius: '8px',
                        marginTop: '15px',
                        fontSize: '0.9rem',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <button
                    onClick={() => {
                        window.location.href = `${AUTH_URL}/api/auth/google`;
                    }}
                    type="button" className="btn btn-google" aria-label="Continue with Google" style={{marginTop: '20px'}}>
                    <span className="btn-google-icon" aria-hidden>G</span>
                    Continue with Google
                </button>

                <div className="divider" role="separator" aria-label="or continue with email">
                    <span className="divider-line" />
                    <span className="divider-text">or</span>
                    <span className="divider-line" />
                </div>

                <form className="register-form stack" onSubmit={handleSubmit} noValidate>
                    
                    <div className="field-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            placeholder="you@example.com"
                        />
                    </div>

                    <div className="field-row">
                        <div className="field-group">
                            <label htmlFor="firstName">First name</label>
                            <input
                                id="firstName"
                                name="firstName"
                                type="text"
                                autoComplete="given-name"
                                value={form.firstName}
                                onChange={handleChange}
                                required
                                placeholder="Jane"
                            />
                        </div>
                        <div className="field-group">
                            <label htmlFor="lastName">Last name</label>
                            <input
                                id="lastName"
                                name="lastName"
                                type="text"
                                autoComplete="family-name"
                                value={form.lastName}
                                onChange={handleChange}
                                required
                                placeholder="Doe"
                            />
                        </div>
                    </div>

                    <fieldset className="field-group fieldset-radio">
                        <legend className="legend">Account type</legend>
                        <div className="radio-row">
                            <label className="radio-option">
                                <input
                                    type="radio"
                                    name="userType"
                                    value="user"
                                    checked={form.userType === 'user'}
                                    onChange={handleChange}
                                />
                                <span>User</span>
                            </label>
                            <label className="radio-option">
                                <input
                                    type="radio"
                                    name="userType"
                                    value="artist"
                                    checked={form.userType === 'artist'}
                                    onChange={handleChange}
                                />
                                <span>Artist</span>
                            </label>
                        </div>
                    </fieldset>

                    <div className="field-group">
                        <label htmlFor="password">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            value={form.password}
                            onChange={handleChange}
                            required
                            placeholder="••••••••"
                            minLength={5}
                        />
                        <p className="hint text-muted">Minimum 5 characters.</p>
                    </div>

                    <button type="submit" className="btn btn-primary" aria-label="Create account">
                        Create account
                    </button>
                </form>
            </div>
        </div>
    )
}