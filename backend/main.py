from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models

from routers import auth, conversations, exam, dobai, khoahoc

app = FastAPI(title="Tutor AI", version="1.0.0")

Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,          prefix="/api/auth",             tags=["Auth"])
app.include_router(conversations.router, prefix="/api/cuoc-tro-chuyen",  tags=["Conversations"])
app.include_router(exam.router,          prefix="/api/kiem-tra",         tags=["Exam"])
app.include_router(dobai.router,         prefix="/api/do-bai",           tags=["Dò bài"])
app.include_router(khoahoc.router,       prefix="/api/khoa-hoc",        tags=["Khoa hoc"])


@app.get("/", tags=["Health"])
def health_check():
    return {"status": "Hệ thống đang khởi động", "version": "1.0.0"}
