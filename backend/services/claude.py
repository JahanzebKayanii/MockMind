import json
import os
import re
import anthropic

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
MODEL = "claude-sonnet-4-6"


def _parse_json(text: str):
    text = text.strip()
    print(f"[Claude raw response]: {repr(text)}")
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    return json.loads(text.strip())


def generate_questions(role: str, interview_type: str, specs: str, resume_text: str, question_count: int, company: str = "", seniority: str = "") -> list[str]:
    resume_section = f"\n\nCandidate resume:\n{resume_text}" if resume_text else ""
    specs_section = f"\n\nRole specifications:\n{specs}" if specs else ""
    company_section = f"\nCompany: {company}" if company else ""
    seniority_section = f"\nSeniority level: {seniority}" if seniority else ""

    prompt = f"""You are an expert interviewer. Generate exactly {question_count} interview questions for a {interview_type} interview.

Role: {role}{company_section}{seniority_section}{specs_section}{resume_section}

Rules:
- Questions must be specific to the role, interview type, and seniority level if provided
- For technical interviews: include at least 1-2 coding/algorithm questions (LeetCode-style), system design questions, and role-specific technical knowledge questions
- For behavioral interviews: use STAR-method style questions relevant to the role
- For general interviews: mix of motivation, experience, and situational questions
- For mix interviews: spread questions evenly across behavioral, technical, and general types
- If a resume is provided, reference specific experience or skills from it in 1-2 questions
- Return ONLY a JSON array of question strings, no other text

Example format: ["Question 1?", "Question 2?", "Question 3?"]"""

    message = client.messages.create(
        model=MODEL,
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )

    content = message.content[0].text.strip()
    return _parse_json(content)


def evaluate_answer(question: str, answer: str, role: str, interview_type: str) -> dict:
    prompt = f"""You are an expert interview coach evaluating a candidate's answer.

Role: {role}
Interview type: {interview_type}
Question: {question}
Candidate's answer: {answer}

Evaluate the answer and respond with ONLY a JSON object in this exact format:
{{
  "score": <integer 1-10>,
  "feedback": "<2-4 sentences of specific, constructive feedback covering what was good, what was missing, and how to improve>"
}}

Scoring guide:
1-3: Poor - missing key points, vague, or irrelevant
4-6: Average - covers basics but lacks depth or structure
7-8: Good - solid answer with clear structure and relevant content
9-10: Excellent - comprehensive, specific, well-structured"""

    message = client.messages.create(
        model=MODEL,
        max_tokens=512,
        messages=[{"role": "user", "content": prompt}],
    )

    content = message.content[0].text.strip()
    return _parse_json(content)


def generate_final_report(role: str, interview_type: str, questions_data: list[dict]) -> dict:
    qa_text = "\n\n".join(
        f"Q{i+1}: {q['question_text']}\nAnswer: {q['answer_text']}\nScore: {q['score']}/10\nFeedback: {q['feedback']}"
        for i, q in enumerate(questions_data)
    )

    prompt = f"""You are an expert interview coach. Based on the completed interview session below, generate a final performance report.

Role: {role}
Interview type: {interview_type}

Interview transcript:
{qa_text}

Respond with ONLY a JSON object in this exact format:
{{
  "overall_score": <float, average of all scores rounded to 1 decimal>,
  "summary": "<3-5 sentence overall performance summary>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "weaknesses": ["<area to improve 1>", "<area to improve 2>", "<area to improve 3>"]
}}"""

    message = client.messages.create(
        model=MODEL,
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )

    content = message.content[0].text.strip()
    return _parse_json(content)
