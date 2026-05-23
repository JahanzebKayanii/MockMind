import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/client";

const speechSupported = "webkitSpeechRecognition" in window || "SpeechRecognition" in window;

function formatTime(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function Interview() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [currentQ, setCurrentQ] = useState(1);
  const [totalQ, setTotalQ] = useState(0);
  const [questionText, setQuestionText] = useState("");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [timerSecs, setTimerSecs] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const isListeningRef = useRef(false);

  useEffect(() => {
    resumeSession();
    return () => clearInterval(timerRef.current);
  }, []);

  function startTimer(secs) {
    clearInterval(timerRef.current);
    if (secs <= 0) return;
    setTimeLeft(secs);
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  async function resumeSession() {
    setLoading(true);
    try {
      const { data: session } = await api.get(`/sessions/${sessionId}`);
      if (session.status === "completed") {
        navigate(`/report/${sessionId}`);
        return;
      }
      const secs = (session.timer_minutes || 0) * 60;
      setTimerSecs(secs);
      const firstUnanswered = session.questions.find((q) => q.answer_text === null);
      const startAt = firstUnanswered ? firstUnanswered.question_number : 1;
      setTotalQ(session.question_count);
      await loadQuestion(startAt, secs);
    } catch {
      setLoading(false);
    }
  }

  async function loadQuestion(num, secs) {
    setLoading(true);
    setAnswer("");
    setFeedback(null);
    clearInterval(timerRef.current);
    try {
      const { data } = await api.get(`/interviews/${sessionId}/question/${num}`);
      setQuestionText(data.question_text);
      setTotalQ(data.total_questions);
      setCurrentQ(data.question_number);
      const timerVal = secs !== undefined ? secs : timerSecs;
      startTimer(timerVal);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!answer.trim()) return;
    isListeningRef.current = false;
    recognitionRef.current?.stop();
    setIsListening(false);
    clearInterval(timerRef.current);
    setSubmitting(true);
    try {
      const { data } = await api.post(`/interviews/${sessionId}/answer`, {
        question_number: currentQ,
        answer_text: answer.trim(),
      });
      setFeedback(data);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleNext() {
    if (feedback?.is_last_question) {
      setCompleting(true);
      await api.post(`/interviews/${sessionId}/complete`);
      navigate(`/report/${sessionId}`);
    } else {
      loadQuestion(currentQ + 1);
    }
  }

  function toggleSpeech() {
    if (!speechSupported) return;
    if (isListening) {
      isListeningRef.current = false;
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    let finalTranscript = answer;
    recognition.onresult = (event) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += (finalTranscript ? " " : "") + t;
        } else {
          interim = t;
        }
      }
      setAnswer(finalTranscript + (interim ? " " + interim : ""));
    };
    recognition.onend = () => {
      if (isListeningRef.current) {
        recognition.start();
      } else {
        setIsListening(false);
      }
    };
    recognition.onerror = () => {
      isListeningRef.current = false;
      setIsListening(false);
    };
    recognitionRef.current = recognition;
    isListeningRef.current = true;
    recognition.start();
    setIsListening(true);
  }

  const progress = totalQ ? ((currentQ - 1) / totalQ) * 100 : 0;
  const timerWarning = timeLeft > 0 && timeLeft <= 30;
  const timerExpired = timerSecs > 0 && timeLeft === 0 && !feedback;

  if (loading) {
    return (
      <div className="page">
        <div className="spinner" />
        <p style={{ color: "var(--text-muted)" }}>Loading question...</p>
      </div>
    );
  }

  if (completing) {
    return (
      <div className="page">
        <div className="spinner" />
        <p style={{ color: "var(--text-muted)" }}>Generating your final report...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <nav className="nav">
        <span className="nav-logo"><span className="nav-logo-icon">🧠</span> MockMind</span>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {timerSecs > 0 && !feedback && (
            <span style={{
              fontWeight: 700,
              fontSize: 15,
              color: timerWarning ? "var(--danger)" : timerExpired ? "var(--danger)" : "var(--text-dim)",
              minWidth: 48,
              textAlign: "center",
            }}>
              {timerExpired ? "Time's up" : formatTime(timeLeft)}
            </span>
          )}
          <span style={{ color: "var(--text-muted)", fontSize: 14 }}>
            Question {currentQ} of {totalQ}
          </span>
        </div>
        <button
          className="btn-ghost"
          style={{ width: "auto", fontSize: 13 }}
          onClick={() => navigate("/dashboard")}
        >
          ✕ Exit
        </button>
      </nav>

      <div className="main" style={{ maxWidth: 680 }}>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>

        {!speechSupported && (
          <div className="browser-warning">
            Speech-to-text requires Chrome or Edge. Use text input instead.
          </div>
        )}

        {timerExpired && (
          <div className="browser-warning" style={{ background: "#fff0f0", borderColor: "#fca5a5", color: "var(--danger)" }}>
            Time's up! Submit your answer when ready.
          </div>
        )}

        <div className="question-box">{questionText}</div>

        {!feedback && (
          <>
            <div className="answer-row">
              <textarea
                placeholder="Type your answer here..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                style={{ minHeight: 140 }}
                disabled={submitting}
              />
              {speechSupported && (
                <button
                  type="button"
                  className={`mic-btn ${isListening ? "active" : ""}`}
                  onClick={toggleSpeech}
                  title={isListening ? "Stop recording" : "Start voice input"}
                >
                  {isListening ? "⏹" : "🎤"}
                </button>
              )}
            </div>
            {isListening && (
              <p style={{ color: "var(--danger)", fontSize: 13, marginTop: 6 }}>
                Recording... speak your answer
              </p>
            )}
            <button
              className="btn-primary"
              style={{ marginTop: 16 }}
              onClick={handleSubmit}
              disabled={submitting || !answer.trim()}
            >
              {submitting ? "Evaluating..." : "Submit Answer"}
            </button>
          </>
        )}

        {feedback && (
          <div className="feedback-box">
            <div className="feedback-score">{feedback.score}/10</div>
            <p style={{ marginBottom: 16 }}>{feedback.feedback}</p>
            <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 16 }}>
              Your answer: <em style={{ color: "var(--text)" }}>{answer}</em>
            </p>
            <button className="btn-primary" onClick={handleNext}>
              {feedback.is_last_question ? "See Final Report →" : "Next Question →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
