import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/client";

export default function Setup() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [role, setRole] = useState("");
  const [company, setCompany] = useState("");
  const [seniority, setSeniority] = useState("mid");
  const [timerMinutes, setTimerMinutes] = useState(0);
  const [interviewType, setInterviewType] = useState("behavioral");
  const [specs, setSpecs] = useState("");
  const [questionCount, setQuestionCount] = useState(5);
  const [resume, setResume] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!role.trim()) { setError("Please enter a job role"); return; }
    setError("");
    setLoading(true);

    const formData = new FormData();
    formData.append("role", role.trim());
    formData.append("interview_type", interviewType);
    formData.append("question_count", questionCount);
    if (company.trim()) formData.append("company", company.trim());
    formData.append("seniority", seniority);
    if (timerMinutes > 0) formData.append("timer_minutes", timerMinutes);
    if (specs.trim()) formData.append("specs", specs.trim());
    if (resume) formData.append("resume", resume);

    try {
      const { data } = await api.post("/sessions/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      navigate(`/interview/${data.session_id}`);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create session");
      setLoading(false);
    }
  }

  return (
    <div className="page" style={{ justifyContent: "flex-start", paddingTop: 48 }}>
      <div className="card card-wide">
        <button
          className="btn-ghost"
          style={{ width: "auto", marginBottom: 20, fontSize: 13 }}
          onClick={() => navigate("/dashboard")}
        >
          ← Back
        </button>

        <div className="logo" style={{ justifyContent: "flex-start" }}><span className="logo-icon">🧠</span> MockMind</div>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 6 }}>Set up your interview</div>
        <div className="subtitle" style={{ textAlign: "left", marginBottom: 28 }}>
          Tell us about the role and we'll generate tailored questions for you.
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div className="spinner" />
            <p style={{ color: "var(--text-muted)" }}>Generating your questions with AI...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Job Role / Title</label>
              <input
                type="text"
                placeholder="e.g. ML Engineer — AI Edge Computing"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Company Name (optional)</label>
              <input
                type="text"
                placeholder="e.g. Google, OpenAI, Tesla..."
                value={company}
                onChange={(e) => setCompany(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Experience Level</label>
              <div className="select-group">
                {[
                  { value: "entry", label: "Entry Level" },
                  { value: "mid", label: "Mid-Level" },
                  { value: "senior", label: "Senior" },
                  { value: "lead", label: "Lead / Principal" },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className={`select-pill ${seniority === value ? "selected" : ""}`}
                    onClick={() => setSeniority(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Interview Type</label>
              <div className="select-group">
                {["behavioral", "technical", "general", "mix"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`select-pill ${interviewType === type ? "selected" : ""}`}
                    onClick={() => setInterviewType(type)}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Number of Questions</label>
              <div className="select-group">
                {[5, 7, 10].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={`select-pill ${questionCount === n ? "selected" : ""}`}
                    onClick={() => setQuestionCount(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Time Per Question (optional)</label>
              <div className="select-group">
                {[
                  { value: 0, label: "No Timer" },
                  { value: 1, label: "1 min" },
                  { value: 2, label: "2 min" },
                  { value: 3, label: "3 min" },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    className={`select-pill ${timerMinutes === value ? "selected" : ""}`}
                    onClick={() => setTimerMinutes(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Role Specifications (optional)</label>
              <textarea
                placeholder="Describe the role, company, tech stack, or anything else that's relevant..."
                value={specs}
                onChange={(e) => setSpecs(e.target.value)}
                style={{ minHeight: 90 }}
              />
            </div>

            <div className="form-group">
              <label>Resume (optional)</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                style={{ display: "none" }}
                onChange={(e) => setResume(e.target.files[0] || null)}
              />
              <div
                className={`upload-area ${resume ? "has-file" : ""}`}
                onClick={() => fileInputRef.current.click()}
              >
                {resume
                  ? `✓ ${resume.name}`
                  : "Click to upload your resume (PDF) — we'll reference it when generating questions"}
              </div>
              {resume && (
                <button
                  type="button"
                  style={{ marginTop: 6, width: "auto", fontSize: 12, background: "none", color: "var(--text-muted)", padding: "2px 0" }}
                  onClick={() => { setResume(null); fileInputRef.current.value = ""; }}
                >
                  Remove
                </button>
              )}
            </div>

            {error && <div className="error-msg">{error}</div>}

            <button className="btn-primary" style={{ marginTop: 8 }} type="submit">
              Generate Questions & Start
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
