import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../services/api";

function Dashboard() {
  const [workspace, setWorkspace] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [literatureCount, setLiteratureCount] = useState(0);
  const [manuscriptCount, setManuscriptCount] = useState(0);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      const { data: workspaces } = await api.get("/workspaces");
      const ws = workspaces[0] ?? null;
      setWorkspace(ws);

      if (ws) {
        const [tasksRes, literatureRes, manuscriptsRes, meetingsRes] = await Promise.all([
          api.get(`/tasks/workspace/${ws.id}`),
          api.get(`/literature/workspace/${ws.id}`),
          api.get(`/manuscripts/workspace/${ws.id}`),
          api.get(`/meetings/workspace/${ws.id}`),
        ]);
        setTasks(tasksRes.data);
        setLiteratureCount(literatureRes.data.length);
        setManuscriptCount(manuscriptsRes.data.length);
        setMeetings(meetingsRes.data);
      }
      setLoading(false);
    }
    loadDashboard();
  }, []);

  if (loading) {
    return <div className="page-loading">Loading dashboard...</div>;
  }

  if (!workspace) {
    return (
      <>
        <Navbar />
        <main className="page">
          <p>No workspaces found.</p>
        </main>
      </>
    );
  }

  const statusCounts = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <>
      <Navbar />
      <main className="page">
        <section className="workspace-header">
          <div>
            <h1>{workspace.name}</h1>
            <p className="muted">{workspace.description}</p>
          </div>
          <div className="member-chips">
            {workspace.memberUsernames.map((username) => (
              <span key={username} className="chip">
                {username}
              </span>
            ))}
          </div>
        </section>

        <section className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{tasks.length}</span>
            <span className="stat-label">Total Tasks</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{statusCounts.IN_PROGRESS || 0}</span>
            <span className="stat-label">In Progress</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{literatureCount}</span>
            <span className="stat-label">Literature Entries</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{manuscriptCount}</span>
            <span className="stat-label">Manuscripts</span>
          </div>
        </section>

        <section className="panel">
          <h2>Tasks</h2>
          <ul className="list">
            {tasks.map((task) => (
              <li key={task.id} className="list-row">
                <div>
                  <div className="list-title">{task.title}</div>
                  <div className="muted small">
                    Due {new Date(task.dueDate).toLocaleDateString()}
                  </div>
                </div>
                <span className={`badge badge-${task.status.toLowerCase()}`}>
                  {task.status.replace("_", " ")}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <h2>Recent Meetings</h2>
          <ul className="list">
            {meetings.map((meeting) => (
              <li key={meeting.id} className="list-row">
                <div>
                  <div className="list-title">{meeting.title}</div>
                  <div className="muted small">
                    {new Date(meeting.meetingDate).toLocaleString()}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}

export default Dashboard;
