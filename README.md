# MockMind

An AI-powered job interview coach that generates tailored interview questions, evaluates your answers, and gives detailed feedback.

## Features

- Personalized questions based on role, company, seniority, and interview type
- Behavioral, technical, general, and mixed interview modes
- LeetCode-style coding questions for technical interviews
- Resume upload — AI references your experience when generating questions
- Speech-to-text answer input
- Per-answer scoring (1–10) with feedback
- Optional per-question countdown timer
- Resume sessions from where you left off
- Final report with overall score, strengths, and areas to improve
- Retry the same interview with fresh questions
- Export report as PDF

## Tech Stack

**Frontend:** React, Vite, React Router, Axios  
**Backend:** FastAPI, SQLAlchemy, PostgreSQL  
**AI:** Anthropic Claude API (claude-sonnet-4-6)

## Local Development

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in `/backend`:

```
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/mockmind
ANTHROPIC_API_KEY=your_anthropic_key
SECRET_KEY=your_secret_key
ALLOWED_ORIGINS=http://localhost:5174
```

```bash
uvicorn main:app --port 8001
```

### Frontend

```bash
cd frontend
npm install
```

Create a `.env.local` file in `/frontend`:

```
VITE_API_URL=http://localhost:8001
```

```bash
npm run dev
```

## Deployment

- **Frontend:** Vercel
- **Backend + Database:** Render
