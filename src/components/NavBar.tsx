import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { signOut } from "@/features/auth/authThunks";

const NavBar: React.FC = () => {
  const { user, role } = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    await signOut(dispatch);
    navigate('/login');
  };
  
  return (
    <nav style={{
      background: "#eee",
      padding: "10px 20px",
      display: "flex",
      gap: "16px"
    }}>
      {user ? (
        <>
          <Link to={`/${role}/dashboard`}>Home</Link>
          <Link to={`/${role}/dashboard`}>Dashboard</Link>
          <button 
            onClick={handleLogout}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: '#646cff',
              textDecoration: 'underline',
              cursor: 'pointer',
              font: 'inherit'
            }}
          >
            Logout
          </button>
        </>
      ) : (
        <>
          <Link to="/login">Login</Link>
          <Link to="/sign-up">Sign Up</Link>
        </>
      )}
    </nav>
  );
};

export default NavBar;
