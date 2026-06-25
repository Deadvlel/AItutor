from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from database import get_db
from dependencies import get_current_user
from models import ngDung
from models.khoahoc import lichSuLamKT, chuDe, taiLieu, baiKiemTra, aiLog, thongBao

router = APIRouter()


def require_admin(user=Depends(get_current_user)):
    if (user.vaiTro or "hoc_sinh") != "admin":
        raise HTTPException(403, "Bạn không có quyền truy cập")
    return user


class DoiVaiTroRequest(BaseModel):
    vai_tro: str


@router.get("/nguoi-dung")
def ds_nguoi_dung(
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    users = db.query(ngDung).all()
    return [
        {
            "id": u.id_ngDung,
            "full_name": u.full_name,
            "email": u.email,
            "vai_tro": u.vaiTro or "hoc_sinh",
            "so_bai_lam": db.query(lichSuLamKT).filter(lichSuLamKT.id_ngDung == u.id_ngDung).count(),
        }
        for u in users
    ]


@router.put("/nguoi-dung/{user_id}/vai-tro")
def doi_vai_tro(
    user_id: int,
    req: DoiVaiTroRequest,
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    if req.vai_tro not in ("admin", "hoc_sinh"):
        raise HTTPException(400, "Vai trò không hợp lệ")

    user = db.query(ngDung).filter(ngDung.id_ngDung == user_id).first()
    if not user:
        raise HTTPException(404, "Không tìm thấy người dùng")

    if user.id_ngDung == admin.id_ngDung:
        raise HTTPException(400, "Không thể đổi vai trò chính mình")

    user.vaiTro = req.vai_tro
    ten_role = "Quản trị viên" if req.vai_tro == "admin" else "Học sinh"
    db.add(thongBao(
        id_ngDung=user_id,
        tieuDe="Vai trò đã thay đổi",
        noiDung=f"Vai trò của bạn đã được cập nhật thành: {ten_role}",
        daDoc=False,
    ))
    db.commit()
    return {"message": f"Đã đổi vai trò thành {req.vai_tro}"}


@router.delete("/nguoi-dung/{user_id}")
def xoa_nguoi_dung(
    user_id: int,
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    user = db.query(ngDung).filter(ngDung.id_ngDung == user_id).first()
    if not user:
        raise HTTPException(404, "Không tìm thấy người dùng")

    if user.id_ngDung == admin.id_ngDung:
        raise HTTPException(400, "Không thể xóa chính mình")

    db.delete(user)
    db.commit()
    return {"message": "Đã xóa người dùng"}


@router.get("/thong-ke")
def thong_ke_he_thong(
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    tong_user = db.query(ngDung).count()
    tong_bai_lam = db.query(lichSuLamKT).count()
    tong_mon = db.query(chuDe).count()
    tong_tai_lieu = db.query(taiLieu).count()

    diem_tb = db.query(func.avg(lichSuLamKT.diem)).scalar()
    diem_cao = db.query(func.max(lichSuLamKT.diem)).scalar()

    top_hoc_sinh = (
        db.query(
            ngDung.full_name,
            func.count(lichSuLamKT.id_lsIKT).label("so_bai"),
            func.avg(lichSuLamKT.diem).label("diem_tb"),
        )
        .join(lichSuLamKT, ngDung.id_ngDung == lichSuLamKT.id_ngDung)
        .group_by(ngDung.id_ngDung)
        .order_by(func.avg(lichSuLamKT.diem).desc())
        .limit(5)
        .all()
    )

    return {
        "tong_user": tong_user,
        "tong_bai_lam": tong_bai_lam,
        "tong_mon": tong_mon,
        "tong_tai_lieu": tong_tai_lieu,
        "diem_trung_binh": round(diem_tb, 1) if diem_tb else 0,
        "diem_cao_nhat": diem_cao or 0,
        "top_hoc_sinh": [
            {
                "ten": row.full_name,
                "so_bai": row.so_bai,
                "diem_tb": round(row.diem_tb, 1),
            }
            for row in top_hoc_sinh
        ],
    }


@router.get("/ai-log")
def xem_ai_log(
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
    limit: int = 50,
    offset: int = 0,
):
    tong = db.query(aiLog).count()
    logs = (
        db.query(aiLog)
        .order_by(aiLog.thoiGian.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    ket_qua = []
    for log in logs:
        user = db.query(ngDung).filter(ngDung.id_ngDung == log.id_ngDung).first()
        ket_qua.append({
            "id": log.id_log,
            "ten_user": user.full_name if user else "Ẩn danh",
            "loai": log.loaiHanhDong,
            "input": log.noiDungInput[:200] if log.noiDungInput else "",
            "output": log.noiDungOutput[:200] if log.noiDungOutput else "",
            "thoi_gian": log.thoiGian.isoformat() if log.thoiGian else None,
        })

    return {"tong": tong, "logs": ket_qua}


class GuiThongBaoRequest(BaseModel):
    tieu_de: str
    noi_dung: str
    id_nguoi_nhan: int | None = None


@router.post("/gui-thong-bao")
def gui_thong_bao(
    req: GuiThongBaoRequest,
    admin=Depends(require_admin),
    db: Session = Depends(get_db),
):
    if req.id_nguoi_nhan:
        users = [db.query(ngDung).filter(ngDung.id_ngDung == req.id_nguoi_nhan).first()]
        if not users[0]:
            raise HTTPException(404, "Không tìm thấy người dùng")
    else:
        users = db.query(ngDung).filter(ngDung.vaiTro != "admin").all()

    for u in users:
        db.add(thongBao(
            id_ngDung=u.id_ngDung,
            tieuDe=req.tieu_de,
            noiDung=req.noi_dung,
            daDoc=False,
        ))
    db.commit()
    return {"message": f"Đã gửi thông báo đến {len(users)} người dùng"}
