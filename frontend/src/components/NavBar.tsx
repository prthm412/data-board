import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function NavBar() {
  const { logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) return null;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="nav">
      <span className="nav-logo">xVectorLabs</span>
      <div className="nav-links">
        <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
          Home
        </NavLink>
        <NavLink to="/data" className={({ isActive }) => (isActive ? "active" : "")}>
          Data
        </NavLink>
        <NavLink to="/analytics" className={({ isActive }) => (isActive ? "active" : "")}>
          Plot
        </NavLink>
      </div>
      <button className="btn btn-secondary" onClick={handleLogout}>
        Logout
      </button>
    </nav>
  );
}