import React, { useState } from 'react'
import './Register.css'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

export default function Register() {


    const navigate = useNavigate();

    // Local UI state only (no API calls as requested)
    const [ form, setForm ] = useState({
        email: '',
        firstName: '',
        lastName: '',
        password: '',
        userType: 'user',
    })

    function handleChange(e) {
        const { name, value } = e.target
        setForm(f => ({ ...f, [ name ]: value }))
    }

    async function handleSubmit(e) {
        e.preventDefault()
        try {

            await axios.post("http://localhost:3000/api/auth/register", {
                email: form.email,
                fullname: {
                    firstName: form.firstName,
                    lastName: form.lastName
                },
                password: form.password,
                role: form.userType
            }, {
                withCredentials: true
            })

            navigate('/');

        } catch (err) {
            console.error("Error during registration:", err);
        }
    }

    return (
        <div className="register-wrapper">
            <div className="register-card surface">
                <h2 className="register-title">Create your account</h2>
                <p className="text-muted" style={{ marginTop: 'var(--space-1)' }}>
                    Join us to get started
                </p>
                
                <button
                    onClick={() => {
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