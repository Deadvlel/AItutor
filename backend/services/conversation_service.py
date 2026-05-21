from datetime import datetime
from sqlalchemy.orm import Session
from models.conversation import cuocTroChuyen, tinNhan
from services.ai_service import hoi_gia_su_ollama


def lay_lich_su(db: Session, user_id: int) -> list[dict]:
    cuocs = (
        db.query(cuocTroChuyen)
        .filter(cuocTroChuyen.id_ngDung == user_id)
        .order_by(cuocTroChuyen.ngayTao.desc())
        .all()
    )
    return [
        {
            "id":       c.id_cuocTroChuyen,
            "tieu_de":  c.tieuDe,
            "ngay_tao": c.ngayTao.strftime("%d/%m/%Y %H:%M") if c.ngayTao else "",
        }
        for c in cuocs
    ]


def tao_cuoc_moi(db: Session, user_id: int, tieu_de: str | None) -> dict:
    cuoc = cuocTroChuyen(
        id_ngDung=user_id,
        tieuDe=tieu_de or "Cuộc trò chuyện mới",
        ngayTao=datetime.utcnow(),
    )
    db.add(cuoc)
    db.commit()
    db.refresh(cuoc)
    return {"id": cuoc.id_cuocTroChuyen, "tieu_de": cuoc.tieuDe}


def lay_tin_nhan(db: Session, id_cuoc: int) -> list[dict]:
    msgs = (
        db.query(tinNhan)
        .filter(tinNhan.id_cuocTroChuyen == id_cuoc)
        .order_by(tinNhan.ngayTao.asc())
        .all()
    )
    return [
        {
            "id":       m.id_tinNhan,
            "role":     m.anh if m.anh in ["user", "assistant"] else "user",
            "noi_dung": m.noiDung,
            "ngay_tao": m.ngayTao.strftime("%H:%M") if m.ngayTao else "",
        }
        for m in msgs
    ]


def gui_tin(db: Session, user_id: int, id_cuoc: int, noi_dung: str) -> dict | None:
    cuoc = db.query(cuocTroChuyen).filter(
        cuocTroChuyen.id_cuocTroChuyen == id_cuoc,
        cuocTroChuyen.id_ngDung == user_id,
    ).first()
    if not cuoc:
        return None

    # Lấy lịch sử để AI nhớ ngữ cảnh (tối đa 20 tin)
    msgs_cu = (
        db.query(tinNhan)
        .filter(tinNhan.id_cuocTroChuyen == id_cuoc)
        .order_by(tinNhan.ngayTao.asc())
        .limit(20)
        .all()
    )
    lich_su = [
        {"role": m.anh or "user", "content": m.noiDung}
        for m in msgs_cu
    ]

    # Lưu tin nhắn user
    db.add(tinNhan(
        id_cuocTroChuyen=id_cuoc,
        noiDung=noi_dung,
        anh="user",
        ngayTao=datetime.utcnow(),
    ))

    # Tự động đặt tiêu đề từ tin nhắn đầu tiên
    if cuoc.tieuDe in ("Cuộc trò chuyện mới", None) or cuoc.tieuDe.startswith("Bài:"):
        # Chỉ đổi tên nếu còn là tên mặc định và chưa có tin nào
        if not msgs_cu:
            cuoc.tieuDe = noi_dung[:60] + ("..." if len(noi_dung) > 60 else "")
            db.add(cuoc)

    db.commit()

    reply_text = hoi_gia_su_ollama(noi_dung, lich_su, ten_mon=None)


    db.add(tinNhan(
        id_cuocTroChuyen=id_cuoc,
        noiDung=reply_text,
        anh="assistant",
        ngayTao=datetime.utcnow(),
    ))
    db.commit()

    return {"reply": reply_text, "tieu_de": cuoc.tieuDe}


def xoa_cuoc(db: Session, user_id: int, id_cuoc: int) -> bool:
    cuoc = db.query(cuocTroChuyen).filter(
        cuocTroChuyen.id_cuocTroChuyen == id_cuoc,
        cuocTroChuyen.id_ngDung == user_id,
    ).first()
    if not cuoc:
        return False
    db.query(tinNhan).filter(tinNhan.id_cuocTroChuyen == id_cuoc).delete()
    db.delete(cuoc)
    db.commit()
    return True