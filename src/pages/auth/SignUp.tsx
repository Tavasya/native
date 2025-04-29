import React, { useState } from 'react'
import { signUpWithEmail } from '@/features/auth/authThunks';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { useNavigate } from 'react-router-dom';
import { UserRole } from '@/features/auth/types';

export default function SignUp() {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { loading, error } = useAppSelector(state => state.auth);
    
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<UserRole>('student');

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

    return (
        <div>
            <h2>Sign up</h2>
            {error && <div style={{ color: 'red' }}>{error}</div>}
            <form onSubmit={handleSubmit}>
                <input
                    type='text'
                    placeholder='Name'
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                /><br/>
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
                <select 
                    value={role} 
                    onChange={e => setRole(e.target.value as UserRole)}
                    required
                >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                </select><br/>
                <button type="submit" disabled={loading}>
                    {loading ? 'Signing up...' : 'Sign Up'}
                </button>
            </form>
        </div>
    )
}
