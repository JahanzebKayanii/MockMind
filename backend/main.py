from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

load_dotenv()

from db.database import engine, Base
from db import models  # noqa: F401 - ensures models are registered
from routers import auth, sessions, interviews

Base.metadata.create_all(bind=engine)

app = FastAPI(title="MockMind API")

allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5174")
origins = [o.strip() for o in allowed_origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(sessions.router)
app.include_router(interviews.router)


@app.get("/health")
def health():
    return {"status": "ok"}
