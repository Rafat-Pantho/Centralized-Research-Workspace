import { Link, useNavigate } from "react-router-dom";
import { logout } from "../services/authService";

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="navbar">
      <div className="navbar-brand">CRW</div>
      <nav className="navbar-links">
        <Link to="/">Dashboard</Link>
        <Link to="/literature">Literature</Link>
        <Link to="/manuscripts">Manuscripts</Link>
      </nav>
      <button type="button" className="btn btn-ghost" onClick={handleLogout}>
        Log out
      </button>
    </header>
  );
}

export default Navbar;
