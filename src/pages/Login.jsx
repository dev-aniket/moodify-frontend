import React, { useState } from 'react'
import './Login.css'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

export default function Login() {
    const navigate = useNavigate();

    const [ form, setForm ] = useState({
        email: '',
        password: '',
    })

    function handleChange(e) {
        const { name, value } = e.target
        setForm(f => ({ ...f, [ name ]: value }))
    }

    function handleSubmit(e) {
        e.preventDefault()

        try {
            axios.post("http://localhost:3000/api/auth/login", {
                email: form.email,
                password: form.password
            }, {
                withCredentials: true
            }).then(() => {
                navigate('/');
            })

        } catch (err) {
            console.error("Error during login:", err);
        }

    }

    return (
        <div className="login-wrapper">
            <div className="login-card surface">
                <h2 className="login-title">Welcome back</h2>
                <p className="text-muted" style={{ marginTop: 'var(--space-1)' }}>Sign in to continue</p>

                <button 
                onClick={()=>{
                    window.location.href = 'http://localhost:3000/api/auth/google';
                }}
                type="button" className="btn btn-google" aria-label="Continue with Google">
                    <span className="btn-google-icon" aria-hidden>G</span>
                    Continue with Google
                </button>

                <div className="divider" role="separator" aria-label="or continue with email">
                    <span className="divider-line" />
                    <span className="divider-text">or</span>
                    <span className="divider-line" />
                </div>

                <form className="login-form stack" onSubmit={handleSubmit} noValidate>
                    <div className="field-group">
                        <label htmlFor="login-email">Email</label>
                        <input
                            id="login-email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            value={form.email}
                            onChange={handleChange}
                            required
                            placeholder="you@example.com"
                        />
                    </div>
                    <div className="field-group">
                        <label htmlFor="login-password">Password</label>
                        <input
                            id="login-password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            value={form.password}
                            onChange={handleChange}
                            required
                            placeholder="••••••••"
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" aria-label="Sign in">Sign in</button>
                </form>
            </div>
        </div>
    )
}