import os
import json
import httpx
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from database import get_db
from models import kiemTra, cauHoi, dapAn, lichSuBaiLam, ngDung
from dotenv import load_dotenv

load_dotenv()
router = APIRouter()

SECRET_KEY   = os.getenv("SECRET_KEY")
ALGORITHM    = "HS256"
OLLAMA_URL   = os.getenv("OLLAMA_URL")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL")


def get_current_user(authorization: str = Header(...), db: Session = Depends(get_db)):
    try:
        scheme, token = authorization.split()
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except (JWTError, ValueError, AttributeError):
        raise HTTPException(status_code=401, detail="Token không hợp lệ")
    user = db.query(ngDung).filter(ngDung.id_ngDung == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Người dùng không tồn tại")
    return user


def call_ollama_json(prompt: str) -> str:
    """
    Dùng /api/generate (không phải /api/chat) vì cần output JSON thuần.
    Ollama sẽ trả về text, ta parse JSON từ đó.
    """
    try:
        response = httpx.post(
            OLLAMA_URL,
            json={
                "model":  OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "format": "json",  
            },
            timeout=180,  
        )
        response.raise_for_status()
        data = response.json()
        return data.get("response", "")
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Ollama phản hồi quá chậm, thử lại")
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="Không kết nối được Ollama. Chạy: ollama serve")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi Ollama: {str(e)}")

class TaoDeThiRequest(BaseModel):
    chu_de: str
    so_cau: int = 5
    do_kho: str = "trung binh"


class NopBaiRequest(BaseModel):
    id_kiem_tra: int
    cau_tra_loi: list[dict]

@router.post("/tao-de")
def tao_de_thi(req: TaoDeThiRequest, user=Depends(get_current_user), db: Session = Depends(get_db)):
    so_cau = max(3, min(10, req.so_cau))

    do_kho_desc = {
        "de":          "câu hỏi cơ bản, định nghĩa, nhận biết",
        "trung binh":  "câu hỏi vận dụng, tính toán, hiểu bản chất",
        "kho":         "câu hỏi phân tích, nâng cao, suy luận tổng hợp",
    }.get(req.do_kho, "câu hỏi vận dụng")

    prompt = f"""Tạo {so_cau} câu hỏi trắc nghiệm về "{req.chu_de}", độ khó: {do_kho_desc}.

Trả về JSON hợp lệ theo đúng cấu trúc sau (không thêm gì khác ngoài JSON):
{{
  "tieu_de": "Tên đề thi ngắn gọn",
  "cau_hoi": [
    {{
      "noi_dung": "Nội dung câu hỏi",
      "loi_giai_thich": "Giải thích tại sao đáp án đúng",
      "dap_an": [
        {{"noi_dung": "Đáp án A", "la_dap_an": true}},
        {{"noi_dung": "Đáp án B", "la_dap_an": false}},
        {{"noi_dung": "Đáp án C", "la_dap_an": false}},
        {{"noi_dung": "Đáp án D", "la_dap_an": false}}
      ]
    }}
  ]
}}

Quy tắc:
- Mỗi câu đúng 4 đáp án, đúng 1 la_dap_an: true
- Câu hỏi chính xác, rõ ràng, tiếng Việt"""

    raw = call_ollama_json(prompt)

    try:
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1]
            raw = raw.rsplit("```", 1)[0]
        data = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI trả về dữ liệu không hợp lệ, thử lại")

    kiem_tra = kiemTra(
        id_ngDung=user.id_ngDung,
        id_taiLieu=None,
        tieuDe=data["tieu_de"],
        diemSo=None,
        ngayTao=datetime.utcnow(),
    )
    db.add(kiem_tra)
    db.flush()

    result_cau_hoi = []
    for ch in data["cau_hoi"]:
        cau = cauHoi(
            id_kiemTra=kiem_tra.id_kiemTra,
            id_chuDe=None,
            noiDung=ch["noi_dung"],
            loiGiaiThich=ch.get("loi_giai_thich", ""),
        )
        db.add(cau)
        db.flush()

        dap_ans = []
        for da in ch["dap_an"]:
            d = dapAn(
                id_cauHoi=cau.id_cauHoi,
                noiDungDapAn=da["noi_dung"],
                laDapAn=da["la_dap_an"],
            )
            db.add(d)
            db.flush()
            dap_ans.append({
                "id":        d.id_dapAn,
                "noi_dung":  d.noiDungDapAn,
                "la_dap_an": d.laDapAn,
            })

        result_cau_hoi.append({
            "id":              cau.id_cauHoi,
            "noi_dung":        cau.noiDung,
            "loi_giai_thich":  cau.loiGiaiThich,
            "dap_an":          dap_ans,
        })

    db.commit()

    return {
        "id_kiem_tra": kiem_tra.id_kiemTra,
        "tieu_de":     kiem_tra.tieuDe,
        "chu_de":      req.chu_de,
        "do_kho":      req.do_kho,
        "cau_hoi":     result_cau_hoi,
    }


@router.post("/nop-bai")
def nop_bai(req: NopBaiRequest, user=Depends(get_current_user), db: Session = Depends(get_db)):
    kiem_tra_obj = db.query(kiemTra).filter(
        kiemTra.id_kiemTra == req.id_kiem_tra,
        kiemTra.id_ngDung == user.id_ngDung,
    ).first()
    if not kiem_tra_obj:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài kiểm tra")

    tong_cau = len(req.cau_tra_loi)
    dung = 0
    chi_tiet = []

    for tra_loi in req.cau_tra_loi:
        id_cau     = tra_loi.get("id_cau_hoi")
        id_da_chon = tra_loi.get("id_dap_an")

        cau      = db.query(cauHoi).filter(cauHoi.id_cauHoi == id_cau).first()
        dap_ans  = db.query(dapAn).filter(dapAn.id_cauHoi == id_cau).all()
        da_dung  = next((d for d in dap_ans if d.laDapAn), None)
        la_dung  = bool(da_dung and da_dung.id_dapAn == id_da_chon)

        if la_dung:
            dung += 1

        chi_tiet.append({
            "id_cau_hoi":    id_cau,
            "noi_dung_cau":  cau.noiDung if cau else "",
            "id_da_chon":    id_da_chon,
            "id_dap_an_dung": da_dung.id_dapAn if da_dung else None,
            "noi_dung_dung": da_dung.noiDungDapAn if da_dung else "",
            "la_dung":       la_dung,
            "loi_giai_thich": cau.loiGiaiThich if cau else "",
        })

    diem = round((dung / tong_cau) * 10, 1) if tong_cau > 0 else 0

    kiem_tra_obj.diemSo = diem
    db.commit()

    xep_loai = "Giỏi" if diem >= 8 else "Khá" if diem >= 6.5 else "Trung bình" if diem >= 5 else "Yếu"

    ls = lichSuBaiLam(
        id_lsl=None,
        id_kiemTra=req.id_kiem_tra,
        id_ngDung=user.id_ngDung,
        diem=diem,
        xepLoai=xep_loai,
        tg_batDau=datetime.utcnow(),
        tg_ketThuc=datetime.utcnow(),
    )
    db.add(ls)
    db.commit()

    return {
        "diem":     diem,
        "dung":     dung,
        "tong":     tong_cau,
        "xep_loai": xep_loai,
        "chi_tiet": chi_tiet,
    }


@router.get("/lich-su")
def lay_lich_su_thi(user=Depends(get_current_user), db: Session = Depends(get_db)):
    bai_lams = (
        db.query(lichSuBaiLam)
        .filter(lichSuBaiLam.id_ngDung == user.id_ngDung)
        .order_by(lichSuBaiLam.tg_batDau.desc())
        .limit(20)
        .all()
    )
    result = []
    for bl in bai_lams:
        kt = db.query(kiemTra).filter(kiemTra.id_kiemTra == bl.id_kiemTra).first()
        result.append({
            "id":       bl.id_lsl,
            "tieu_de":  kt.tieuDe if kt else "Bài thi",
            "diem":     bl.diem,
            "xep_loai": bl.xepLoai,
            "ngay":     bl.tg_batDau.strftime("%d/%m/%Y") if bl.tg_batDau else "",
        })
    return result