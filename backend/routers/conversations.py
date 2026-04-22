import os
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from database import get_db
from models import cuocTroChuyen, tinNhan, ngDung
from google import genai
from google.genai import types
from dotenv import load_dotenv

router = APIRouter()

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY", "tutor_secret_key_change_this_in_production")
ALGORITHM = "HS256"

api_key =os.getenv("ai_key")
client = genai.Client(api_key=api_key)

TUTOR_PROMPT = (
    "bạn là một gia sư ai thông minh "
) 

def get_current_user(authorization: str = Header(...), db: Session = Depends(get_db)):
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Token không hợp lệ")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except (JWTError, ValueError, AttributeError):
        raise HTTPException(status_code=401, detail="Token không hợp lệ hoặc đã hết hạn")

    user = db.query(ngDung).filter(ngDung.id_ngDung == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Người dùng không tồn tại")
    return user


class TaoMoiRequest(BaseModel):
    tieu_de: str | None = None  


class GuiTinRequest(BaseModel):
    id_cuoc_tro_chuyen: int
    noi_dung: str


@router.get("/lich-su")
def lay_lich_su(
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cuoc_tro_chuyens = (
        db.query(cuocTroChuyen)
        .filter(cuocTroChuyen.id_ngDung == user.id_ngDung)
        .order_by(cuocTroChuyen.ngayTao.desc())
        .all()
    )
    return [
        {
            "id": c.id_cuocTroChuyen,
            "tieu_de": c.tieuDe,
            "ngay_tao": c.ngayTao.strftime("%d/%m/%Y %H:%M") if c.ngayTao else "",
        }
        for c in cuoc_tro_chuyens
    ]


@router.post("/tao-moi")
def tao_cuoc_moi(
    req: TaoMoiRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Tạo cuộc trò chuyện mới"""
    cuoc = cuocTroChuyen(
        id_ngDung=user.id_ngDung,
        tieuDe=req.tieu_de or "Cuộc trò chuyện mới",
        ngayTao=datetime.utcnow(),
    )
    db.add(cuoc)
    db.commit()
    db.refresh(cuoc)
    return {"id": cuoc.id_cuocTroChuyen, "tieu_de": cuoc.tieuDe}


@router.get("/{id_cuoc}/tin-nhan")
def lay_tin_nhan(
    id_cuoc: int,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lấy toàn bộ tin nhắn của một cuộc trò chuyện"""
    cuoc = db.query(cuocTroChuyen).filter(
        cuocTroChuyen.id_cuocTroChuyen == id_cuoc,
        cuocTroChuyen.id_ngDung == user.id_ngDung,
    ).first()
    if not cuoc:
        raise HTTPException(status_code=404, detail="Không tìm thấy cuộc trò chuyện")

    msgs = (
        db.query(tinNhan)
        .filter(tinNhan.id_cuocTroChuyen == id_cuoc)
        .order_by(tinNhan.ngayTao.asc())
        .all()
    )
    return [
        {
            "id": m.id_tinNhan,
            "role": m.anh if m.anh in ["user", "assistant"] else "user",
            "noi_dung": m.noiDung,
            "ngay_tao": m.ngayTao.strftime("%H:%M") if m.ngayTao else "",
        }
        for m in msgs
    ]


@router.post("/gui")
def gui_tin_nhan(
    req: GuiTinRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lưu tin nhắn user + gọi Gemini + lưu reply + trả về"""
    cuoc = db.query(cuocTroChuyen).filter(
        cuocTroChuyen.id_cuocTroChuyen == req.id_cuoc_tro_chuyen,
        cuocTroChuyen.id_ngDung == user.id_ngDung,
    ).first()
    if not cuoc:
        raise HTTPException(status_code=404, detail="Không tìm thấy cuộc trò chuyện")

    tin_user = tinNhan(
        id_cuocTroChuyen=req.id_cuoc_tro_chuyen,
        noiDung=req.noi_dung,
        anh="user", 
        ngayTao=datetime.utcnow(),
    )
    db.add(tin_user)

    if cuoc.tieuDe == "Cuộc trò chuyện mới":
        cuoc.tieuDe = req.noi_dung[:60] + ("..." if len(req.noi_dung) > 60 else "")
        db.add(cuoc)

    db.commit()

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=req.noi_dung,
            config=types.GenerateContentConfig(system_instruction=TUTOR_PROMPT),
        )
        reply_text = response.text
    except Exception as e:
        reply_text = f"Lỗi AI: {str(e)}"

    tin_ai = tinNhan(
        id_cuocTroChuyen=req.id_cuoc_tro_chuyen,
        noiDung=reply_text,
        anh="assistant", 
        ngayTao=datetime.utcnow(),
    )
    db.add(tin_ai)
    db.commit()

    return {
        "reply": reply_text,
        "tieu_de": cuoc.tieuDe,
    }


@router.delete("/{id_cuoc}")
def xoa_cuoc(
    id_cuoc: int,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Xoá một cuộc trò chuyện và toàn bộ tin nhắn bên trong"""
    cuoc = db.query(cuocTroChuyen).filter(
        cuocTroChuyen.id_cuocTroChuyen == id_cuoc,
        cuocTroChuyen.id_ngDung == user.id_ngDung,
    ).first()
    if not cuoc:
        raise HTTPException(status_code=404, detail="Không tìm thấy cuộc trò chuyện")

    db.query(tinNhan).filter(tinNhan.id_cuocTroChuyen == id_cuoc).delete()
    db.delete(cuoc)
    db.commit()
    return {"ok": True}