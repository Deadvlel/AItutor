import os
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from jose import JWTError, jwt
from database import get_db
from models import ngDung

router = APIRouter()

SECRET_KEY = os.getenv("SECRET_KEY", "tutor_secret_key_change_this_in_production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 ngày

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class DangKyRequest(BaseModel):
    full_name: str
    email: EmailStr
    mat_khau: str


class DangNhapRequest(BaseModel):
    email: EmailStr
    mat_khau: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    full_name: str
    email: str


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/dang-ky", response_model=TokenResponse)
def dang_ky(request: DangKyRequest, db: Session = Depends(get_db)):
    existing = db.query(ngDung).filter(ngDung.email == request.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email đã được sử dụng")

    user = ngDung(
        email=request.email,
        mat_khau=hash_password(request.mat_khau),
        full_name=request.full_name,
        auth="local",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id_ngDung), "email": user.email})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        full_name=user.full_name,
        email=user.email,
    )


@router.post("/dang-nhap", response_model=TokenResponse)
def dang_nhap(request: DangNhapRequest, db: Session = Depends(get_db)):
    user = db.query(ngDung).filter(ngDung.email == request.email).first()

    if not user or not verify_password(request.mat_khau, user.mat_khau):
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không đúng")

    token = create_access_token({"sub": str(user.id_ngDung), "email": user.email})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        full_name=user.full_name,
        email=user.email,
    )


@router.get("/toi")
def get_current_user_info(token: str, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except (JWTError, TypeError):
        raise HTTPException(status_code=401, detail="Token không hợp lệ")

    user = db.query(ngDung).filter(ngDung.id_ngDung == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Người dùng không tồn tại")

    return {"id": user.id_ngDung, "full_name": user.full_name, "email": user.email}
