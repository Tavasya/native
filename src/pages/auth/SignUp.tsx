import React, { useState, useEffect } from 'react'
import { signUpWithEmail } from '@/features/auth/authThunks';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { useNavigate, Link } from 'react-router-dom';
import { UserRole } from '@/features/auth/types';
import { clearAuth } from '@/features/auth/authSlice';

// Quick signup presets for development
const DEV_ACCOUNTS = {
    teacher: { 
        email: 'teacher@test.com', 
        password: '123456',
        name: 'Test Teacher',
        role: 'teacher' as UserRole
    },
    student: { 
        email: 'student@test.com', 
        password: '123456',
        name: 'Test Student',
        role: 'student' as UserRole
    }
};

export default function SignUp() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { loading, error } = useAppSelector(state => state.auth);
    
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>('student');

    // Clear error when component mounts
    useEffect(() => {
        dispatch(clearAuth());
    }, [dispatch]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Attempting signup with:', { email, password, name, role });

        const result = await dispatch(signUpWithEmail({ 
            email, 
            password, 
            name,
            role 
        }));

        if (signUpWithEmail.rejected.match(result)) {
            console.error('Signup error:', result.payload);
        }

        if (signUpWithEmail.fulfilled.match(result)) {
            navigate(`/${role}/dashboard`);
        }
    }

    // Quick signup function for development
    const quickSignup = async (type: 'teacher' | 'student') => {
        const account = DEV_ACCOUNTS[type];
        setEmail(account.email);
        setPassword(account.password);
        setName(account.name);
        setRole(account.role);
        
        const result = await dispatch(signUpWithEmail(account));
        
        if (signUpWithEmail.rejected.match(result)) {
            console.error('Quick signup failed:', result.payload);
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
            }}>Sign up</h2>
            
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
                        onClick={() => quickSignup('teacher')}
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
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        Sign up as Teacher
                    </button>
                    <button
                        onClick={() => quickSignup('student')}
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
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        Sign up as Student
                    </button>
                </div>
            </div>

            {error && (
                <div style={{ 
                    color: '#ff4d4f',
                    background: '#2c1618',
                    padding: '12px',
                    borderRadius: '6px',
                    marginBottom: '20px',
                    fontSize: '14px'
                }}>
                    {error}
                </div>
            )}
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '14px', color: '#ccc' }}>Name</label>
                    <input
                        type='text'
                        placeholder='Enter your name'
                        value={name}
                        onChange={e => {
                            setName(e.target.value);
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontSize: '14px', color: '#ccc' }}>Role</label>
                    <select 
                        value={role} 
                        onChange={e => {
                            setRole(e.target.value as UserRole);
                            dispatch(clearAuth());
                        }}
                        required
                        style={{ 
                            padding: '12px',
                            borderRadius: '6px',
                            border: '1px solid #404040',
                            background: '#363636',
                            color: '#fff',
                            fontSize: '16px',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                    </select>
                </div>
                <button 
                    type="submit" 
                    disabled={loading}
                    style={{
                        background: '#646cff',
                        color: 'white',
                        padding: '14px',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontSize: '16px',
                        fontWeight: '500',
                        marginTop: '8px',
                        transition: 'opacity 0.2s',
                        opacity: loading ? 0.7 : 1
                    }}
                >
                    {loading ? 'Signing up...' : 'Sign Up'}
                </button>
            </form>
            <p style={{ 
                marginTop: '24px', 
                textAlign: 'center',
                color: '#ccc',
                fontSize: '14px'
            }}>
                Already have an account? <Link to="/login" style={{ color: '#646cff', textDecoration: 'none' }}>Login</Link>
            </p>
        </div>
    )
}
