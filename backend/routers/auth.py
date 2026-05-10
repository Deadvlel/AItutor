from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import ngDung
from schemas.user import DangKyRequest, DangNhapRequest, TokenResponse, UserResponse
from services.auth_service import hash_password, verify_password, create_access_token
from dependencies import get_current_user

router = APIRouter()


@router.post("/dang-ky", response_model=TokenResponse)
def dang_ky(req: DangKyRequest, db: Session = Depends(get_db)):
    if db.query(ngDung).filter(ngDung.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email đã được sử dụng")

    user = ngDung(
        email=req.email,
        mat_khau=hash_password(req.mat_khau),
        full_name=req.full_name,
        auth="local",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return TokenResponse(
        access_token=create_access_token(user.id_ngDung, user.email),
        token_type="bearer",
        full_name=user.full_name,
        email=user.email,
    )


@router.post("/dang-nhap", response_model=TokenResponse)
def dang_nhap(req: DangNhapRequest, db: Session = Depends(get_db)):
    user = db.query(ngDung).filter(ngDung.email == req.email).first()
    if not user or not verify_password(req.mat_khau, user.mat_khau):
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không đúng")

    return TokenResponse(
        access_token=create_access_token(user.id_ngDung, user.email),
        token_type="bearer",
        full_name=user.full_name,
        email=user.email,
    )


@router.get("/toi", response_model=UserResponse)
def lay_thong_tin(user=Depends(get_current_user)):
    return UserResponse(
        id=user.id_ngDung,
        full_name=user.full_name,
        email=user.email,
    )
