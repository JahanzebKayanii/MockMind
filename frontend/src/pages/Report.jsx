import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/client";

function ScoreRing({ score }) {
  const color = score >= 7 ? "var(--success)" : score >= 5 ? "var(--warning)" : "var(--danger)";
  return (
    <div style={{ textAlign: "center", margin: "16px 0 28px" }}>
      <div style={{ fontSize: 64, fontWeight: 800, color }}>{score?.toFixed(1)}</div>
      <div style={{ color: "var(--text-muted)", fontSize: 14 }}>out of 10</div>
    </div>
  );
}

function QuestionReview({ q, index }) {
  const [open, setOpen] = useState(false);
  const color = q.score >= 7 ? "var(--success)" : q.score >= 5 ? "var(--warning)" : "var(--danger)";

  return (
    <div className="q-review">
      <div className="q-review-header">
        <span style={{ color: "var(--text-muted)", fontSize: 13 }}>Q{index + 1}</span>
        <span style={{ color, fontWeight: 700 }}>{q.score}/10</span>
      </div>
      <div className="q-review-q">{q.question_text}</div>
      {q.answer_text && (
        <div className="q-review-a">
          <button
            type="button"
            style={{ background: "none", color: "var(--accent)", fontSize: 13, padding: 0, fontWeight: 500 }}
            onClick={() => setOpen(!open)}
          >
            {open ? "Hide answer" : "Show answer"}
          </button>
          {open && <p style={{ marginTop: 6 }}>{q.answer_text}</p>}
        </div>
      )}
      <div className="q-review-feedback">{q.feedback}</div>
    </div>
  );
}

export default function Report() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    api.get(`/sessions/${sessionId}`).then(({ data }) => {
      setSession(data);
      setLoading(false);
    });
  }, [sessionId]);

  async function handleRetry() {
    setRetrying(true);
    try {
      const { data } = await api.post(`/sessions/${sessionId}/retry`);
      navigate(`/interview/${data.session_id}`);
    } catch {
      setRetrying(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="spinner" />
      </div>
    );
  }

  if (retrying) {
    return (
      <div className="page">
        <div className="spinner" />
        <p style={{ color: "var(--text-muted)" }}>Generating new questions...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh" }} className="report-page">
      <nav className="nav no-print">
        <span className="nav-logo"><span className="nav-logo-icon">🧠</span> MockMind</span>
        <button
          className="btn-ghost"
          style={{ width: "auto" }}
          onClick={() => navigate("/dashboard")}
        >
          Dashboard
        </button>
      </nav>

      <div className="main" style={{ maxWidth: 760 }}>
        <h1 className="page-title">{session.role}</h1>
        <div style={{ display: "flex", gap: 10, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
          <span className={`badge badge-${session.interview_type}`}>{session.interview_type}</span>
          {session.company && <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{session.company}</span>}
          {session.seniority && <span style={{ color: "var(--text-muted)", fontSize: 13 }}>· {session.seniority}</span>}
          <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
            · {session.question_count} questions · {new Date(session.created_at).toLocaleDateString()}
          </span>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 28, marginBottom: 24, marginTop: 24 }}>
          <h2 style={{ marginBottom: 4, fontSize: 18 }}>Overall Score</h2>
          <ScoreRing score={session.overall_score} />
          <p style={{ color: "var(--text-muted)", lineHeight: 1.7 }}>{session.summary}</p>
        </div>

        <div className="two-col" style={{ marginBottom: 28 }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 24 }}>
            <h3 style={{ marginBottom: 14, color: "var(--success)" }}>Strengths</h3>
            <ul className="strengths-list">
              {(session.strengths || []).map((s, i) => <li key={i}>{s}</li>)}
            </ul>
          </div>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 24 }}>
            <h3 style={{ marginBottom: 14, color: "var(--warning)" }}>Areas to Improve</h3>
            <ul className="weaknesses-list">
              {(session.weaknesses || []).map((w, i) => <li key={i}>{w}</li>)}
            </ul>
          </div>
        </div>

        <h2 style={{ marginBottom: 16, fontSize: 18 }}>Question Breakdown</h2>
        {session.questions.map((q, i) => (
          <QuestionReview key={i} q={q} index={i} />
        ))}

        <div className="no-print" style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
          <button
            className="btn-primary"
            style={{ flex: 1, minWidth: 160 }}
            onClick={handleRetry}
          >
            Retry Same Interview
          </button>
          <button
            className="btn-ghost"
            style={{ flex: 1, minWidth: 160 }}
            onClick={() => navigate("/setup")}
          >
            New Interview
          </button>
          <button
            className="btn-ghost"
            style={{ flex: 1, minWidth: 160 }}
            onClick={() => window.print()}
          >
            Export as PDF
          </button>
        </div>
      </div>
    </div>
  );
}
