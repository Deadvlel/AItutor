from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models   # import để Base biết tất cả bảng trước khi create_all

from routers import auth, conversations, exam

app = FastAPI(title="Tutor AI", version="1.0.0")

# Tạo bảng nếu chưa có
Base.metadata.create_all(bind=engine)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # production: đổi thành domain thật
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Đăng ký router
app.include_router(auth.router,          prefix="/api/auth",             tags=["Auth"])
app.include_router(conversations.router, prefix="/api/cuoc-tro-chuyen",  tags=["Conversations"])
app.include_router(exam.router,          prefix="/api/kiem-tra",         tags=["Exam"])


@app.get("/", tags=["Health"])
def health_check():
    return {"status": "Hệ thống đang khởi động", "version": "1.0.0"}
