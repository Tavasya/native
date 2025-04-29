import React, { useState } from 'react'
import { signInWithEmail } from '@/features/auth/authThunks';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { useNavigate } from 'react-router-dom';

export default function Login() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { loading, error, role } = useAppSelector(state => state.auth);
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const result = await dispatch(signInWithEmail({ 
            email, 
            password 
        }));

        if (signInWithEmail.fulfilled.match(result)) {
            // Redirect to the appropriate dashboard based on role
            navigate(`/${role}/dashboard`);
        }
    }

    return (
        <div>
            <h2>Login</h2>
            {error && <div style={{ color: 'red' }}>{error}</div>}
            <form onSubmit={handleSubmit}>
                <input
                    type="email"
                    placeholder='Email'
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                /><br/>
                <input
                    type='password'
                    placeholder='Password'
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                /><br/>
                <button type="submit" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
            <p>
                Don't have an account? <a href="/sign-up">Sign up</a>
            </p>
        </div>
    )
}
