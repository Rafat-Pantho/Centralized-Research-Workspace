import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../services/api";
import { useWorkspace } from "../context/WorkspaceContext";

const STATUSES = ["TODO", "IN_PROGRESS", "COMPLETED"];

function TaskForm({ onCreate, members = [] }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("TODO");
  const [dueDate, setDueDate] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await onCreate({
        title,
        description,
        status,
        dueDate: dueDate ? `${dueDate}:00` : null,
        assigneeId: assigneeId ? Number(assigneeId) : null,
      });
      setTitle("");
      setDescription("");
      setStatus("TODO");
      setDueDate("");
      setAssigneeId("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create task.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="entry-form" onSubmit={handleSubmit}>
      {error && <div className="alert alert-error">{error}</div>}
      <div className="entry-form-grid">
        <label>
          Title
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
        </label>
        <label>
          Status
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label>
          Assignee
          <select value={assigneeId} onChange={(event) => setAssigneeId(event.target.value)}>
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.username}
              </option>
            ))}
          </select>
        </label>
        <label>
          Due Date
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </label>
      </div>
      <label>
        Description
        <textarea
          rows={2}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>
      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? "Adding..." : "Add Task"}
      </button>
    </form>
  );
}

function Tasks() {
  const { activeWorkspace, activeWorkspaceId, loading: workspaceLoading } = useWorkspace();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadTasks = async () => {
    if (!activeWorkspaceId) {
      setTasks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await api.get(`/tasks/workspace/${activeWorkspaceId}`);
    setTasks(data);
    setLoading(false);
  };

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeWorkspaceId]);

  const handleCreate = async (payload) => {
    const { data } = await api.post("/tasks", { ...payload, workspaceId: activeWorkspaceId });
    setTasks((prev) => [...prev, data]);
  };

  const handleStatusChange = async (taskId, status) => {
    const { data } = await api.patch(`/tasks/${taskId}/status`, { status });
    setTasks((prev) => prev.map((task) => (task.id === taskId ? data : task)));
  };

  const handleAssigneeChange = async (taskId, assigneeId) => {
    const { data } = await api.patch(`/tasks/${taskId}/assignee`, {
      assigneeId: assigneeId ? Number(assigneeId) : null,
    });
    setTasks((prev) => prev.map((task) => (task.id === taskId ? data : task)));
  };

  const handleDelete = async (taskId) => {
    await api.delete(`/tasks/${taskId}`);
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
  };

  if (workspaceLoading || loading) {
    return <div className="page-loading">Loading tasks...</div>;
  }

  return (
    <>
      <Navbar />
      <main className="page">
        <h1>Task Tracking</h1>
        <p className="muted">Plan, assign, and track progress on workspace tasks.</p>

        {!activeWorkspaceId ? (
          <p className="muted small">Select a workspace on the Dashboard to see its tasks.</p>
        ) : (
          <>
            <section className="panel">
              <h2>New Task</h2>
              <TaskForm onCreate={handleCreate} members={activeWorkspace?.members || []} />
            </section>

            <section className="panel">
              <h2>Tasks</h2>
              {tasks.length === 0 ? (
                <p className="muted small">No tasks yet.</p>
              ) : (
                <ul className="list">
                  {tasks.map((task) => (
                    <li key={task.id} className="list-row task-row">
                      <div>
                        <div className="list-title">{task.title}</div>
                        {task.description && (
                          <div className="muted small">{task.description}</div>
                        )}
                        {task.assigneeUsername && (
                          <div className="muted small">Assigned to {task.assigneeUsername}</div>
                        )}
                        {task.dueDate && (
                          <div className="muted small">
                            Due {new Date(task.dueDate).toLocaleString()}
                          </div>
                        )}
                      </div>
                      <div className="task-actions">
                        <select
                          value={task.assigneeId || ""}
                          onChange={(event) => handleAssigneeChange(task.id, event.target.value)}
                          className="badge-select"
                        >
                          <option value="">Unassigned</option>
                          {(activeWorkspace?.members || []).map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.username}
                            </option>
                          ))}
                        </select>
                        <select
                          value={task.status}
                          onChange={(event) => handleStatusChange(task.id, event.target.value)}
                          className={`badge-select badge-${task.status.toLowerCase()}`}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s.replace("_", " ")}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="btn btn-ghost btn-danger"
                          onClick={() => handleDelete(task.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </>
  );
}

export default Tasks;
