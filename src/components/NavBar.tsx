import React from "react";
import { Link } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";

const NavBar: React.FC = () => {
  const { user, role } = useAppSelector(state => state.auth);
  
  return (
    <nav style={{
      background: "#eee",
      padding: "10px 20px",
      display: "flex",
      gap: "16px"
    }}>
      <Link to="/">Home</Link>
      {user ? (
        <>
          <Link to={`/${role}/dashboard`}>Dashboard</Link>
          <Link to="/logout">Logout</Link>
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
