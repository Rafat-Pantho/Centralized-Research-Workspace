import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../services/api";

function Manuscript() {
  const [manuscripts, setManuscripts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadManuscripts() {
      const { data: workspaces } = await api.get("/workspaces");
      const ws = workspaces[0];
      if (ws) {
        const { data } = await api.get(`/manuscripts/workspace/${ws.id}`);
        setManuscripts(data);
      }
      setLoading(false);
    }
    loadManuscripts();
  }, []);

  if (loading) {
    return <div className="page-loading">Loading manuscripts...</div>;
  }

  return (
    <>
      <Navbar />
      <main className="page">
        <h1>Manuscript Development</h1>
        <p className="muted">Draft, version, and track academic manuscripts in progress.</p>

        <div className="manuscript-list">
          {manuscripts.map((manuscript) => (
            <article key={manuscript.id} className="panel">
              <div className="manuscript-header">
                <div>
                  <h2>{manuscript.title}</h2>
                  <p className="muted small">Target: {manuscript.targetJournal}</p>
                </div>
                <span className={`badge badge-${manuscript.status.toLowerCase()}`}>
                  {manuscript.status}
                </span>
              </div>

              <h4>Version History</h4>
              <ul className="list">
                {manuscript.versions.map((version) => (
                  <li key={version.id} className="list-row">
                    <div>
                      <div className="list-title">
                        {version.versionTag} &mdash; {version.commitMessage}
                      </div>
                      <div className="muted small">
                        {version.authorUsername} &middot;{" "}
                        {new Date(version.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </main>
    </>
  );
}

export default Manuscript;
