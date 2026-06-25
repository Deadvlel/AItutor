from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import get_db
from dependencies import get_current_user
from models.khoahoc import lichSuLamKT, baiKiemTra, taiLieu, chuDe

router = APIRouter()


@router.get("")
def lay_lich_su(
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 50,
    offset: int = 0,
):
    query = (
        db.query(lichSuLamKT)
        .filter(lichSuLamKT.id_ngDung == user.id_ngDung)
        .order_by(desc(lichSuLamKT.tg_ketThuc))
    )

    tong = query.count()
    ds = query.offset(offset).limit(limit).all()

    ket_qua = []
    for item in ds:
        ten_bai = ""
        ten_mon = ""
        loai = "Dò bài"

        if item.id_baiKiemTra:
            loai = "Kiểm tra"
            bkt = db.query(baiKiemTra).filter(baiKiemTra.id_baiKiemTra == item.id_baiKiemTra).first()
            if bkt:
                ten_bai = bkt.tieuDe or ""
                if bkt.id_taiLieu:
                    tl = db.query(taiLieu).filter(taiLieu.id_taiLieu == bkt.id_taiLieu).first()
                    if tl and tl.id_chuDe:
                        cd = db.query(chuDe).filter(chuDe.id_chuDe == tl.id_chuDe).first()
                        if cd:
                            ten_mon = cd.ten_chuDe or ""

        xep_map = {1: "Giỏi", 2: "Khá", 3: "Trung bình", 4: "Yếu"}

        ket_qua.append({
            "id": item.id_lsIKT,
            "ngay": item.tg_ketThuc.isoformat() if item.tg_ketThuc else None,
            "diem": item.diem,
            "xep_loai": xep_map.get(item.xepLoai, ""),
            "ten_bai": ten_bai,
            "ten_mon": ten_mon,
            "loai": loai,
        })

    return {
        "tong": tong,
        "lich_su": ket_qua,
    }
