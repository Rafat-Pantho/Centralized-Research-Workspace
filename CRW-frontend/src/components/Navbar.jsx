import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { logout } from "../services/authService";
import { useWorkspace } from "../context/WorkspaceContext";
import GlobalSearchModal from "./GlobalSearchModal";

function Navbar() {
  const navigate = useNavigate();
  const { activeWorkspace, refreshWorkspaces } = useWorkspace();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleLogout = () => {
    logout();
    refreshWorkspaces();
    navigate("/login");
  };

  return (
    <>
      <header className="navbar">
        <div className="navbar-brand">CRW</div>
        {activeWorkspace && (
          <div className="navbar-workspace" title={activeWorkspace.name}>
            {activeWorkspace.name}
          </div>
        )}
        <nav className="navbar-links">
          <Link to="/">Dashboard</Link>
          <Link to="/tasks">Tasks</Link>
          <Link to="/literature">Literature</Link>
          <Link to="/manuscripts">Manuscripts</Link>
          <Link to="/meetings">Meetings</Link>
          <Link to="/settings">Settings</Link>
          <Link to="/profile">Profile</Link>
        </nav>
        <button
          type="button"
          className="btn btn-ghost search-trigger-btn"
          onClick={() => setSearchOpen(true)}
          title="Global Search (Cmd/Ctrl+K)"
        >
          🔍 Search <kbd className="shortcut-kbd">⌘K</kbd>
        </button>
        <button type="button" className="btn btn-ghost" onClick={handleLogout}>
          Log out
        </button>
      </header>

      <GlobalSearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

export default Navbar;
