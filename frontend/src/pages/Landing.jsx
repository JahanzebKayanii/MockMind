import { useNavigate } from "react-router-dom";

const features = [
  {
    icon: "🎯",
    title: "Tailored Questions",
    desc: "We generate questions specific to your role, company, seniority level, and interview type — not generic templates.",
  },
  {
    icon: "🧠",
    title: "AI-Powered Feedback",
    desc: "Every answer is scored 1–10 with detailed feedback on what you did well and how to improve.",
  },
  {
    icon: "📄",
    title: "Resume-Aware",
    desc: "Upload your resume and we'll reference your actual experience when crafting questions.",
  },
  {
    icon: "🎤",
    title: "Speech-to-Text",
    desc: "Answer questions by speaking naturally — just like a real interview.",
  },
  {
    icon: "⏱️",
    title: "Timed Practice",
    desc: "Set a per-question timer to simulate real interview pressure.",
  },
  {
    icon: "📊",
    title: "Full Report",
    desc: "Finish an interview and get an overall score, strengths, areas to improve, and per-question breakdown.",
  },
];

const steps = [
  { step: "1", title: "Set up your interview", desc: "Enter the role, company, and interview type. Upload your resume optionally." },
  { step: "2", title: "Answer the questions", desc: "Questions appear one by one. Type or speak your answer, then get instant feedback." },
  { step: "3", title: "Review your report", desc: "See your overall score, strengths, and areas to improve. Retry to track progress." },
];

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* Nav */}
      <nav className="nav">
        <span className="nav-logo"><span className="nav-logo-icon">🧠</span> MockMind</span>
        <div className="nav-right">
          <button className="btn-ghost" style={{ width: "auto" }} onClick={() => navigate("/login")}>
            Log in
          </button>
          <button className="btn-primary" style={{ width: "auto" }} onClick={() => navigate("/signup")}>
            Get started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ textAlign: "center", padding: "80px 24px 64px", maxWidth: 720, margin: "0 auto" }}>
        <div style={{
          display: "inline-block",
          background: "rgba(79,110,247,0.08)",
          border: "1px solid rgba(79,110,247,0.2)",
          borderRadius: 20,
          padding: "6px 16px",
          fontSize: 13,
          color: "var(--accent)",
          fontWeight: 600,
          marginBottom: 24,
          letterSpacing: 0.3,
        }}>
          AI-Powered Interview Coach
        </div>
        <h1 style={{
          fontSize: "clamp(36px, 6vw, 58px)",
          fontWeight: 800,
          lineHeight: 1.15,
          letterSpacing: -1,
          marginBottom: 20,
          background: "linear-gradient(135deg, var(--text) 0%, var(--accent) 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}>
          Ace your next interview with AI
        </h1>
        <p style={{ fontSize: 18, color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 36, maxWidth: 560, margin: "0 auto 36px" }}>
          Practice with questions tailored to your exact role and get instant feedback on every answer — so you walk in prepared.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            className="btn-primary"
            style={{ width: "auto", padding: "14px 32px", fontSize: 16 }}
            onClick={() => navigate("/signup")}
          >
            Start practicing free
          </button>
          <button
            className="btn-ghost"
            style={{ width: "auto", padding: "14px 32px", fontSize: 16 }}
            onClick={() => navigate("/login")}
          >
            Log in
          </button>
        </div>
      </div>

      {/* How it works */}
      <div style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "64px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <h2 style={{ textAlign: "center", fontSize: 28, fontWeight: 800, marginBottom: 48, letterSpacing: -0.3 }}>How it works</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 32 }}>
            {steps.map((s) => (
              <div key={s.step} style={{ textAlign: "center" }}>
                <div style={{
                  width: 48, height: 48,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--accent), var(--accent2))",
                  color: "#fff",
                  fontSize: 20,
                  fontWeight: 800,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 16px",
                  boxShadow: "0 4px 16px rgba(79,110,247,0.3)",
                }}>
                  {s.step}
                </div>
                <h3 style={{ fontWeight: 700, marginBottom: 8, fontSize: 17 }}>{s.title}</h3>
                <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ padding: "64px 24px", maxWidth: 960, margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", fontSize: 28, fontWeight: 800, marginBottom: 48, letterSpacing: -0.3 }}>Everything you need to prepare</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: 20 }}>
          {features.map((f) => (
            <div key={f.title} style={{
              background: "var(--surface)",
              border: "1.5px solid var(--border)",
              borderRadius: "var(--radius)",
              padding: "24px",
              transition: "all 0.2s",
            }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ fontWeight: 700, marginBottom: 8, fontSize: 16 }}>{f.title}</h3>
              <p style={{ color: "var(--text-muted)", fontSize: 14, lineHeight: 1.7 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div style={{
        textAlign: "center",
        padding: "64px 24px 80px",
        background: "var(--surface)",
        borderTop: "1px solid var(--border)",
      }}>
        <h2 style={{ fontSize: 32, fontWeight: 800, marginBottom: 12, letterSpacing: -0.3 }}>Ready to start practicing?</h2>
        <p style={{ color: "var(--text-muted)", marginBottom: 32, fontSize: 16 }}>It only takes a minute to set up your first interview.</p>
        <button
          className="btn-primary"
          style={{ width: "auto", padding: "14px 40px", fontSize: 16 }}
          onClick={() => navigate("/signup")}
        >
          Get started free
        </button>
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "20px", borderTop: "1px solid var(--border)", color: "var(--text-muted)", fontSize: 13 }}>
        MockMind — Built with Claude AI
      </div>
    </div>
  );
}
