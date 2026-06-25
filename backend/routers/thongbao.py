from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from dependencies import get_current_user
from models.khoahoc import thongBao

router = APIRouter()


@router.get("")
def lay_thong_bao(user=Depends(get_current_user), db: Session = Depends(get_db)):
    ds = db.query(thongBao).filter(
        thongBao.id_ngDung == user.id_ngDung
    ).order_by(thongBao.ngayTao.desc()).limit(20).all()

    return {
        "thong_baos": [
            {
                "id": tb.id_thongBao,
                "tieu_de": tb.tieuDe,
                "noi_dung": tb.noiDung,
                "da_doc": tb.daDoc,
                "ngay_tao": tb.ngayTao.isoformat() if tb.ngayTao else None,
            }
            for tb in ds
        ],
        "chua_doc": sum(1 for tb in ds if not tb.daDoc),
    }


@router.put("/{id_thong_bao}/doc")
def danh_dau_da_doc(id_thong_bao: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    tb = db.query(thongBao).filter(
        thongBao.id_thongBao == id_thong_bao,
        thongBao.id_ngDung == user.id_ngDung,
    ).first()
    if tb:
        tb.daDoc = True
        db.commit()
    return {"thong_bao": "Da doc"}


@router.put("/doc-het")
def doc_het(user=Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(thongBao).filter(
        thongBao.id_ngDung == user.id_ngDung,
        thongBao.daDoc == False,
    ).update({"daDoc": True})
    db.commit()
    return {"thong_bao": "Da doc het"}


def tao_thong_bao(db: Session, id_ngDung: int, tieu_de: str, noi_dung: str):
    tb = thongBao(
        id_ngDung=id_ngDung,
        tieuDe=tieu_de,
        noiDung=noi_dung,
        daDoc=False,
        ngayTao=datetime.utcnow(),
    )
    db.add(tb)
    db.commit()
    return tb


@router.get("/goi-y")
def lay_goi_y(user=Depends(get_current_user), db: Session = Depends(get_db)):
    from models.khoahoc import aiGoiY
    ds = (
        db.query(aiGoiY)
        .filter(aiGoiY.id_ngDung == user.id_ngDung)
        .order_by(aiGoiY.diemTinCay.desc(), aiGoiY.ngayTao.desc())
        .limit(10)
        .all()
    )
    return {
        "goi_ys": [
            {
                "id": g.id_goiY,
                "noi_dung": g.noiDungGoiY,
                "diem_tin_cay": g.diemTinCay,
                "da_xem": g.trangThai,
                "ngay_tao": g.ngayTao.isoformat() if g.ngayTao else None,
            }
            for g in ds
        ]
    }
