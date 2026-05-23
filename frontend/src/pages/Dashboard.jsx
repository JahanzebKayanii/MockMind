import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const { email, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <nav className="nav">
      <span className="nav-logo"><span className="nav-logo-icon">🧠</span> MockMind</span>
      <div className="nav-right">
        <span className="nav-email">{email}</span>
        <button className="btn-ghost" style={{ width: "auto" }} onClick={handleLogout}>
          Sign out
        </button>
      </div>
    </nav>
  );
}

function ScoreBadge({ score }) {
  if (score == null) return null;
  const color = score >= 7 ? "var(--success)" : score >= 5 ? "var(--warning)" : "var(--danger)";
  return (
    <span style={{ color, fontWeight: 700, fontSize: 15 }}>{score.toFixed(1)}/10</span>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    api.get("/sessions/").then(({ data }) => {
      setSessions(data);
      setLoading(false);
    });
  }, []);

  function handleCardClick(session) {
    if (session.status === "completed") {
      navigate(`/report/${session.id}`);
    } else {
      navigate(`/interview/${session.id}`);
    }
  }

  async function handleDelete(e, sessionId) {
    e.stopPropagation();
    if (!window.confirm("Delete this interview session?")) return;
    setDeletingId(sessionId);
    try {
      await api.delete(`/sessions/${sessionId}`);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <Navbar />
      <div className="main">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
          <div>
            <h1 className="page-title">Your Interviews</h1>
            <p className="page-desc">Track your progress and start a new practice session.</p>
          </div>
          <button
            className="btn-primary"
            style={{ width: "auto", whiteSpace: "nowrap" }}
            onClick={() => navigate("/setup")}
          >
            + New Interview
          </button>
        </div>

        {loading && <div className="spinner" />}

        {!loading && sessions.length === 0 && (
          <div className="empty-state">
            <p>No interviews yet. Start your first practice session!</p>
            <button className="btn-primary" style={{ width: "auto", margin: "0 auto" }} onClick={() => navigate("/setup")}>
              Start practicing
            </button>
          </div>
        )}

        {!loading && sessions.length > 0 && (
          <div className="session-grid">
            {sessions.map((s) => (
              <div key={s.id} className="session-card" onClick={() => handleCardClick(s)}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div className="session-role">{s.role}</div>
                    {s.company && <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{s.company}</div>}
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, s.id)}
                    disabled={deletingId === s.id}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-muted)",
                      fontSize: 16,
                      padding: "0 0 0 8px",
                      lineHeight: 1,
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                    title="Delete session"
                  >
                    {deletingId === s.id ? "…" : "✕"}
                  </button>
                </div>
                <div className="session-meta" style={{ marginBottom: 12 }}>
                  <span className={`badge badge-${s.interview_type}`}>{s.interview_type}</span>
                  <span className={`badge badge-${s.status}`}>{s.status.replace("_", " ")}</span>
                </div>
                <div className="session-meta">
                  <span>{s.question_count} questions</span>
                  {s.overall_score != null && <ScoreBadge score={s.overall_score} />}
                  <span>{new Date(s.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
