import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import WorkspaceManager from "../components/WorkspaceManager";
import api from "../services/api";
import { useWorkspace } from "../context/WorkspaceContext";

function Dashboard() {
  const { activeWorkspace, activeWorkspaceId, loading: workspaceLoading } = useWorkspace();
  const [tasks, setTasks] = useState([]);
  const [literatureCount, setLiteratureCount] = useState(0);
  const [manuscriptCount, setManuscriptCount] = useState(0);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      if (!activeWorkspaceId) {
        setTasks([]);
        setLiteratureCount(0);
        setManuscriptCount(0);
        setMeetings([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      const [tasksRes, literatureRes, manuscriptsRes, meetingsRes] = await Promise.all([
        api.get(`/tasks/workspace/${activeWorkspaceId}`),
        api.get(`/literature/workspace/${activeWorkspaceId}`),
        api.get(`/manuscripts/workspace/${activeWorkspaceId}`),
        api.get(`/meetings/workspace/${activeWorkspaceId}`),
      ]);
      setTasks(tasksRes.data);
      setLiteratureCount(literatureRes.data.length);
      setManuscriptCount(manuscriptsRes.data.length);
      setMeetings(meetingsRes.data);
      setLoading(false);
    }
    loadDashboard();
  }, [activeWorkspaceId]);

  if (workspaceLoading) {
    return <div className="page-loading">Loading dashboard...</div>;
  }

  if (!activeWorkspace) {
    return (
      <>
        <Navbar />
        <main className="page">
          <WorkspaceManager />
          <p className="muted">Create or select a workspace to get started.</p>
        </main>
      </>
    );
  }

  const statusCounts = tasks.reduce((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {});

  const now = new Date();
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const overdueTasks = tasks.filter((t) => {
    if (!t.dueDate || t.status === "COMPLETED") return false;
    return new Date(t.dueDate) < now;
  });

  const dueSoonTasks = tasks.filter((t) => {
    if (!t.dueDate || t.status === "COMPLETED") return false;
    const due = new Date(t.dueDate);
    return due >= now && due <= threeDaysFromNow;
  });

  return (
    <>
      <Navbar />
      <main className="page">
        <WorkspaceManager />

        <section className="workspace-header">
          <div>
            <h1>{activeWorkspace.name}</h1>
            <p className="muted">{activeWorkspace.description}</p>
          </div>
          <div className="member-chips">
            {activeWorkspace.members?.map((member) => (
              <span key={member.id} className="chip">
                {member.username}
              </span>
            ))}
          </div>
        </section>

        {loading ? (
          <p className="muted small">Loading workspace data...</p>
        ) : (
          <>
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
              <h2>Upcoming & Overdue</h2>
              {overdueTasks.length === 0 && dueSoonTasks.length === 0 ? (
                <p className="muted small">Nothing due in the next 3 days.</p>
              ) : (
                <ul className="list">
                  {overdueTasks.map((task) => (
                    <li key={task.id} className="list-row">
                      <div>
                        <div className="list-title">{task.title}</div>
                        <div className="muted small">
                          Due {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      </div>
                      <span className="badge badge-overdue">Overdue</span>
                    </li>
                  ))}
                  {dueSoonTasks.map((task) => (
                    <li key={task.id} className="list-row">
                      <div>
                        <div className="list-title">{task.title}</div>
                        <div className="muted small">
                          Due {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                      </div>
                      <span className="badge badge-due_soon">Due soon</span>
                    </li>
                  ))}
                </ul>
              )}
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
          </>
        )}
      </main>
    </>
  );
}

export default Dashboard;
