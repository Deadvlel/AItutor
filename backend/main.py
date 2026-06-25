from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models
from contextlib import asynccontextmanager

from routers import xacthuc, cuoctrochuyen, kiemtra, dobai, khoahoc, lotrinh, thongbao, thongke, chambai, lichsu, quantri

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[Startup] Đang load ChromaDB...")
    from services.ai_service import _get_collection
    _get_collection()
    print("[Startup] ChromaDB sẵn sàng!")
    yield


app = FastAPI(title="Tutor AI", version="1.0.0", lifespan=lifespan)

Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(xacthuc.router,          prefix="/api/auth",             tags=["Xác thực"])
app.include_router(cuoctrochuyen.router,    prefix="/api/cuoc-tro-chuyen",  tags=["Hội thoại"])
app.include_router(kiemtra.router,          prefix="/api/kiem-tra",         tags=["Kiểm tra"])
app.include_router(dobai.router,         prefix="/api/do-bai",           tags=["Dò bài"])
app.include_router(khoahoc.router,       prefix="/api/khoa-hoc",        tags=["Khóa học"])
app.include_router(lotrinh.router,       prefix="/api/lo-trinh",        tags=["Lộ trình"])
app.include_router(thongbao.router,      prefix="/api/thong-bao",       tags=["Thông báo"])
app.include_router(thongke.router,       prefix="/api/thong-ke",        tags=["Thống kê"])
app.include_router(chambai.router,       prefix="/api/cham-bai",        tags=["Chấm bài"])
app.include_router(lichsu.router,        prefix="/api/lich-su",         tags=["Lịch sử"])
app.include_router(quantri.router,         prefix="/api/admin",           tags=["Quản trị"])


@app.get("/", tags=["Health"])
def health_check():
    return {"status": "Hệ thống đang khởi động", "version": "1.0.0"}
