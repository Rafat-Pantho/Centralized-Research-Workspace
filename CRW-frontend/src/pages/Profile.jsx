import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../services/api";
import { useWorkspace } from "../context/WorkspaceContext";

function Profile() {
  const { workspaces, activeWorkspace } = useWorkspace();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        const { data } = await api.get("/users/me");
        setProfile(data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load user profile.");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  if (loading) {
    return <div className="page-loading">Loading profile...</div>;
  }

  const initials = profile?.username
    ? profile.username.substring(0, 2).toUpperCase()
    : "U";

  return (
    <>
      <Navbar />
      <main className="page">
        <h1>User Profile</h1>
        <p className="muted">Manage your identity and workspace contributions.</p>

        {error && <div className="alert alert-error">{error}</div>}

        {profile && (
          <div className="profile-container">
            <section className="panel profile-header-card">
              <div className="profile-avatar">{initials}</div>
              <div className="profile-info">
                <h2>{profile.username}</h2>
                <p className="muted">{profile.email}</p>
                <div className="profile-meta-tags">
                  <span className={`badge badge-role-${profile.role?.toLowerCase()}`}>
                    {profile.role}
                  </span>
                  <span className="muted small">User ID: #{profile.id}</span>
                </div>
              </div>
            </section>

            <section className="stats-grid">
              <div className="stat-card">
                <span className="stat-value">{workspaces.length}</span>
                <span className="stat-label">Joined Workspaces</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{activeWorkspace ? activeWorkspace.name : "None"}</span>
                <span className="stat-label">Active Workspace</span>
              </div>
            </section>

            <section className="panel">
              <h2>My Workspaces</h2>
              {workspaces.length === 0 ? (
                <p className="muted small">You are not a member of any workspace yet.</p>
              ) : (
                <ul className="list">
                  {workspaces.map((ws) => (
                    <li key={ws.id} className="list-row">
                      <div>
                        <div className="list-title">{ws.name}</div>
                        {ws.description && (
                          <div className="muted small">{ws.description}</div>
                        )}
                      </div>
                      <span className="chip">
                        {ws.members ? ws.members.length : 0} Members
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </main>
    </>
  );
}

export default Profile;
