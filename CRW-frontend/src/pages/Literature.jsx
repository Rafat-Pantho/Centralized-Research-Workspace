import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../services/api";

function Literature() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLiterature() {
      const { data: workspaces } = await api.get("/workspaces");
      const ws = workspaces[0];
      if (ws) {
        const { data } = await api.get(`/literature/workspace/${ws.id}`);
        setEntries(data);
      }
      setLoading(false);
    }
    loadLiterature();
  }, []);

  if (loading) {
    return <div className="page-loading">Loading literature...</div>;
  }

  return (
    <>
      <Navbar />
      <main className="page">
        <h1>Literature Repository</h1>
        <p className="muted">
          Collaborative annotations on papers relevant to this research workspace.
        </p>

        <div className="lit-grid">
          {entries.map((paper) => (
            <article key={paper.id} className="lit-card">
              <h3>{paper.title}</h3>
              <p className="muted small">
                {paper.authors} &middot; {paper.publicationYear}
              </p>
              <p>{paper.summary}</p>
              <a className="link" href={paper.url} target="_blank" rel="noreferrer">
                {paper.doi}
              </a>

              <div className="annotations">
                <h4>Annotations ({paper.annotations.length})</h4>
                <ul className="list">
                  {paper.annotations.map((annotation) => (
                    <li key={annotation.id} className="annotation">
                      <span className="annotation-author">{annotation.authorUsername}</span>
                      <p>{annotation.content}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </main>
    </>
  );
}

export default Literature;
