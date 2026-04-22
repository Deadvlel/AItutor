from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, conversations, exam
from database import engine, Base
import models

app=FastAPI()

models.Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials =True,
    allow_methods=["*"],
    allow_headers=["*"],

)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(conversations.router, prefix="/api/cuoc-tro-chuyen", tags=["conversations"])
app.include_router(exam.router, prefix="/api/kiem-tra", tags=["exam"])

@app.get("/", tags=["check"])
def read_root():
    return {"status":"He thong dang khoi dong"}