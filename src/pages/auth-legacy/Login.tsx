import React, { useState, useEffect, useCallback } from 'react'
import { signInWithEmail } from '@/features/auth/authThunks';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { useNavigate, Link } from 'react-router-dom';
import { clearAuth } from '@/features/auth/authSlice';

// Quick login presets for development
const DEV_ACCOUNTS = {
    teacher: { email: 'rami@gmail.com', password: '123456' },
    student: { email: 'vishal@gmail.com', password: '123456' }
};

export default function Login() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const auth = useAppSelector(state => state.auth);
    
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Clear error when component mounts or when typing
    useEffect(() => {
        dispatch(clearAuth());
    }, [dispatch]);

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

    // Quick login function for development
    const quickLogin = async (type: 'teacher' | 'student') => {
        const account = DEV_ACCOUNTS[type];
        setEmail(account.email);
        setPassword(account.password);
        const result = await dispatch(signInWithEmail(account));
        
        if (signInWithEmail.rejected.match(result)) {
            console.error('Quick login failed:', result.payload);
        }
    }

    return (
        <div style={{ 
            maxWidth: '400px', 
            margin: '40px auto', 
            padding: '30px',
            background: '#2a2a2a',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            color: '#fff'
        }}>
            <h2 style={{ 
                fontSize: '28px', 
                marginBottom: '24px',
                textAlign: 'center',
                fontWeight: '500'
            }}>Login</h2>
            
            {/* Dev Mode Quick Access */}
            <div style={{ 
                marginBottom: '24px',
                padding: '16px',
                background: '#363636',
                borderRadius: '8px',
            }}>
                <h3 style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    fontSize: '18px',
                    marginBottom: '16px'
                }}>
                    🛠️ Dev Mode Quick Access
                </h3>
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px'
                }}>
                    <button
                        onClick={() => quickLogin('teacher')}
                        style={{
                            background: '#4CAF50',
                            color: 'white',
                            padding: '12px',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: '500',
                            transition: 'opacity 0.2s',
                            opacity: auth.loading ? 0.7 : 1
                        }}
                    >
                        Login as Teacher
                    </button>
                    <button
                        onClick={() => quickLogin('student')}
                        style={{
                            background: '#2196F3',
                            color: 'white',
                            padding: '12px',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: '500',
                            transition: 'opacity 0.2s',
                            opacity: auth.loading ? 0.7 : 1
                        }}
                    >
                        Login as Student
                    </button>
                </div>
            </div>

            {auth.error && (
                <div style={{ 
                    color: '#ff4d4f',
                    background: '#2c1618',
                    padding: '12px',
                    borderRadius: '6px',
                    marginBottom: '20px',
                    fontSize: '14px'
                }}>
                    {auth.error}
                </div>
            )}
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '14px', color: '#ccc' }}>Email</label>
                    <input
                        type="email"
                        placeholder='Enter your email'
                        value={email}
                        onChange={e => {
                            setEmail(e.target.value);
                            dispatch(clearAuth());
                        }}
                        required
                        style={{ 
                            padding: '12px',
                            borderRadius: '6px',
                            border: '1px solid #404040',
                            background: '#363636',
                            color: '#fff',
                            fontSize: '16px'
                        }}
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '14px', color: '#ccc' }}>Password</label>
                    <input
                        type='password'
                        placeholder='Enter your password'
                        value={password}
                        onChange={e => {
                            setPassword(e.target.value);
                            dispatch(clearAuth());
                        }}
                        required
                        style={{ 
                            padding: '12px',
                            borderRadius: '6px',
                            border: '1px solid #404040',
                            background: '#363636',
                            color: '#fff',
                            fontSize: '16px'
                        }}
                    />
                </div>
                <button 
                    type="submit" 
                    disabled={auth.loading}
                    style={{
                        background: '#646cff',
                        color: 'white',
                        padding: '14px',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: auth.loading ? 'not-allowed' : 'pointer',
                        fontSize: '16px',
                        fontWeight: '500',
                        marginTop: '8px',
                        transition: 'opacity 0.2s',
                        opacity: auth.loading ? 0.7 : 1
                    }}
                >
                    {auth.loading ? 'Logging in...' : 'Login'}
                </button>
            </form>
            <p style={{ 
                marginTop: '24px', 
                textAlign: 'center',
                color: '#ccc',
                fontSize: '14px'
            }}>
                Don't have an account? <Link to="/sign-up" style={{ color: '#646cff', textDecoration: 'none' }}>Sign up</Link>
            </p>
        </div>
    )
}
