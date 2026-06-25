from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import ngDung
from schemas.nguoidung import DangKyRequest, DangNhapRequest, CapNhatRequest, TokenResponse, UserResponse
from services.xacthuc_service import hash_password, verify_password, create_access_token
from dependencies import get_current_user

router = APIRouter()


@router.post("/dang-ky", response_model=TokenResponse)
def dang_ky(req: DangKyRequest, db: Session = Depends(get_db)):
    if db.query(ngDung).filter(ngDung.email == req.email).first():
        raise HTTPException(status_code=400, detail="Email đã được sử dụng")

    is_first_user = db.query(ngDung).count() == 0

    user = ngDung(
        email=req.email,
        mat_khau=hash_password(req.mat_khau),
        full_name=req.full_name,
        auth="local",
        vaiTro="admin" if is_first_user else "hoc_sinh",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return TokenResponse(
        access_token=create_access_token(user.id_ngDung, user.email),
        token_type="bearer",
        full_name=user.full_name,
        email=user.email,
        vai_tro=user.vaiTro or "hoc_sinh",
    )


@router.post("/dang-nhap", response_model=TokenResponse)
def dang_nhap(req: DangNhapRequest, db: Session = Depends(get_db)):
    user = db.query(ngDung).filter(ngDung.email == req.email).first()
    if not user or not verify_password(req.mat_khau, user.mat_khau):
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không đúng")

    if (user.vaiTro or "hoc_sinh") != "admin":
        _kiem_tra_nhac_nho(db, user.id_ngDung)

    return TokenResponse(
        access_token=create_access_token(user.id_ngDung, user.email),
        token_type="bearer",
        full_name=user.full_name,
        email=user.email,
        vai_tro=user.vaiTro or "hoc_sinh",
    )


@router.get("/toi", response_model=UserResponse)
def lay_thong_tin(user=Depends(get_current_user)):
    return UserResponse(
        id=user.id_ngDung,
        full_name=user.full_name,
        email=user.email,
        vai_tro=user.vaiTro or "hoc_sinh",
    )


@router.put("/cap-nhat")
def cap_nhat_thong_tin(
    req: CapNhatRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if req.full_name:
        user.full_name = req.full_name

    if req.email and req.email != user.email:
        existing = db.query(ngDung).filter(ngDung.email == req.email, ngDung.id_ngDung != user.id_ngDung).first()
        if existing:
            raise HTTPException(400, "Email đã được sử dụng")
        user.email = req.email

    if req.mat_khau_moi:
        if not req.mat_khau_cu:
            raise HTTPException(400, "Vui lòng nhập mật khẩu cũ")
        if not verify_password(req.mat_khau_cu, user.mat_khau):
            raise HTTPException(400, "Mật khẩu cũ không đúng")
        user.mat_khau = hash_password(req.mat_khau_moi)

    db.commit()
    db.refresh(user)

    return {
        "message": "Cập nhật thành công",
        "full_name": user.full_name,
        "email": user.email,
        "vai_tro": user.vaiTro or "hoc_sinh",
    }


def _kiem_tra_nhac_nho(db: Session, id_ngDung: int):
    from datetime import datetime, timedelta
    from models.khoahoc import lichSuLamKT, thongBao

    ba_ngay_truoc = datetime.utcnow() - timedelta(days=3)

    bai_gan_nhat = (
        db.query(lichSuLamKT)
        .filter(lichSuLamKT.id_ngDung == id_ngDung)
        .order_by(lichSuLamKT.tg_batDau.desc())
        .first()
    )

    can_nhac = False
    if not bai_gan_nhat:
        can_nhac = True
        noi_dung = "Bạn chưa làm bài nào. Hãy bắt đầu học và dò bài ngay nhé!"
    elif bai_gan_nhat.tg_batDau and bai_gan_nhat.tg_batDau < ba_ngay_truoc:
        so_ngay = (datetime.utcnow() - bai_gan_nhat.tg_batDau).days
        can_nhac = True
        noi_dung = f"Đã {so_ngay} ngày bạn chưa ôn tập. Quay lại dò bài để không quên kiến thức nhé!"

    if not can_nhac:
        return

    da_nhac = (
        db.query(thongBao)
        .filter(
            thongBao.id_ngDung == id_ngDung,
            thongBao.tieuDe == "Nhắc nhở học tập",
            thongBao.ngayTao >= ba_ngay_truoc,
        )
        .first()
    )
    if da_nhac:
        return

    db.add(thongBao(
        id_ngDung=id_ngDung,
        tieuDe="Nhắc nhở học tập",
        noiDung=noi_dung,
        daDoc=False,
    ))
    db.commit()
