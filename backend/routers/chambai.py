import json
import base64
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from database import get_db
from dependencies import get_current_user
from models.khoahoc import aiLog, thongBao
from services.ai_service import _goi_gemini

router = APIRouter()

ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"]
MAX_SIZE = 10 * 1024 * 1024


@router.post("/upload-anh")
async def cham_bai_tu_anh(
    file: UploadFile = File(...),
    de_bai: str = Form(""),
    dap_an: str = Form(""),
    mon_hoc: str = Form(""),
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(400, "Chi chap nhan anh .jpg, .png, .webp, .heic")

    image_bytes = await file.read()
    if len(image_bytes) > MAX_SIZE:
        raise HTTPException(400, "Anh qua lon (toi da 10MB)")

    prompt_parts = []

    if de_bai.strip():
        prompt_parts.append(f"DE BAI:\n{de_bai}")
    if dap_an.strip():
        prompt_parts.append(f"DAP AN CHUAN:\n{dap_an}")

    prompt_parts.append(
        "Day la anh chup bai lam cua hoc sinh. "
        "Hay doc noi dung bai lam trong anh, sau do cham diem va nhan xet.\n\n"
        "Tra ve JSON thuan (khong markdown, khong giai thich them):\n"
        "{\n"
        '  "noi_dung_doc_duoc": "Noi dung doc duoc tu anh",\n'
        '  "diem": 8.5,\n'
        '  "nhan_xet": "Nhan xet tong quat",\n'
        '  "chi_tiet": [\n'
        '    {"phan": "Cau 1", "dung_sai": "dung", "ghi_chu": "Dung"}\n'
        "  ],\n"
        '  "goi_y": "Goi y de cai thien"\n'
        "}\n\n"
        "Quy tac:\n"
        "- Diem thang 10\n"
        "- Nhan xet bang tieng Viet, xung Thay goi Em\n"
        "- Neu khong doc duoc anh hoac anh khong phai bai lam, ghi diem = -1\n"
        "- dung_sai: 'dung', 'mot_phan', 'sai'"
    )

    prompt_text = "\n\n".join(prompt_parts)
    anh_b64 = base64.b64encode(image_bytes).decode("utf-8")

    noi_dung = [
        {
            "inline_data": {
                "mime_type": file.content_type,
                "data": anh_b64,
            }
        },
        prompt_text,
    ]

    raw = ""
    try:
        raw = _goi_gemini(noi_dung)
        raw = raw.strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        data = json.loads(raw)
    except json.JSONDecodeError:
        data = {
            "noi_dung_doc_duoc": raw,
            "diem": -1,
            "nhan_xet": "Không thể phân tích kết quả từ AI. Thử lại.",
            "chi_tiet": [],
            "goi_y": "",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Lỗi AI: {str(e)}")

    db.add(aiLog(
        id_ngDung=user.id_ngDung,
        loaiHanhDong="cham_bai_anh",
        noiDungInput=f"de_bai={de_bai[:200]}, mon={mon_hoc}",
        noiDungOutput=json.dumps(data, ensure_ascii=False)[:500],
    ))

    if data.get("diem", -1) >= 0:
        db.add(thongBao(
            id_ngDung=user.id_ngDung,
            tieuDe="Ket qua cham bai",
            noiDung=f"Diem: {data['diem']}/10. {data.get('nhan_xet', '')}",
            daDoc=False,
            ngayTao=datetime.utcnow(),
        ))

    db.commit()

    return data