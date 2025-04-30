import React, { useState, useEffect, useCallback } from 'react'
import { signInWithEmail } from '@/features/auth/authThunks';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const auth = useAppSelector(state => state.auth);
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Memoize the navigation check to prevent unnecessary re-renders
    const checkAndNavigate = useCallback(() => {
        if (auth.user && auth.role && !auth.loading && !auth.error) {
            console.log('Navigation check - Role:', auth.role);
            navigate(`/${auth.role}/dashboard`);
        }
    }, [auth.user, auth.role, auth.loading, auth.error, navigate]);

    // Only run navigation effect after form submission
    useEffect(() => {
        if (isSubmitting) {
            checkAndNavigate();
        }
    }, [isSubmitting, checkAndNavigate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        console.log('Submitting login form...');
        const result = await dispatch(signInWithEmail({ email, password }));
        
        if (signInWithEmail.rejected.match(result)) {
            console.error('Login failed:', result.payload);
            setIsSubmitting(false);
        }
    }

    return (
        <div>
            <h2>Login</h2>
            {auth.error && <div style={{ color: 'red' }}>{auth.error}</div>}
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
                <button type="submit" disabled={auth.loading}>
                    {auth.loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
            <p>
                Don't have an account? <Link to="/sign-up">Sign up</Link>
            </p>
        </div>
    )
}
