import json
import os
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from models.course import chuDe, taiLieu, cauHoi, lichSuLamKT, cauTraLoi, aiLog
from services.ai_service import hoi_gia_su
from services.upload_service import xu_ly_excel, xu_ly_pdf, xu_ly_word

router = APIRouter()
ID_DO_BAI = 2

class ChamDoBaiRequest(BaseModel):
    id_cau_hoi:  int
    cau_tra_loi: str


class LuuKetQuaRequest(BaseModel):
    id_tai_lieu: int
    ket_qua: list[dict] 


@router.get("/tai-file-mau")
def tai_file_mau():
    """Tạo và trả về file Excel mẫu để giáo viên điền câu hỏi"""
    path = "/tmp/cau_hoi_do_bai_mau.xlsx"
    _tao_excel_mau(path)
    return FileResponse(
        path,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename="cau_hoi_do_bai_mau.xlsx",
    )


def _tao_excel_mau(path: str):
    try:
        import openpyxl
        from openpyxl.styles import PatternFill, Font, Alignment, Border, Side
    except ImportError:
        raise RuntimeError("pip install openpyxl")

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Câu hỏi dò bài"

    headers = ["chu_de", "tieu_de", "cau_hoi", "dap_an_mau", "goi_y", "do_kho", "thu_tu"]
    labels  = ["Chủ đề *", "Tên bài *", "Câu hỏi *", "Đáp án mẫu *",
               "Gợi ý (tuỳ chọn)", "Độ khó 1/2/3", "Thứ tự"]

    hfill  = PatternFill("solid", fgColor="5B21B6")
    hfont  = Font(bold=True, color="FFFFFF", size=11)
    rfill  = PatternFill("solid", fgColor="EDE9FE")
    border = Border(**{s: openpyxl.styles.Side(style="thin")
                       for s in ["left","right","top","bottom"]})

    for col, (h, label) in enumerate(zip(headers, labels), 1):
        c = ws.cell(row=1, column=col, value=label)
        c.fill = hfill; c.font = hfont; c.border = border
        c.alignment = Alignment(horizontal="center", vertical="center")

    mau = [
        ["Toán 10", "Mệnh đề và tập hợp",
         "Mệnh đề là gì? Cho ví dụ.",
         "Mệnh đề là câu khẳng định đúng hoặc sai. VD: 2+2=4 (đúng), 2+2=5 (sai).",
         "Mệnh đề phải xác định được đúng/sai.", 1, 1],
        ["Toán 10", "Mệnh đề và tập hợp",
         "Khi nào A là tập hợp con của B?",
         "A ⊂ B khi mọi phần tử của A đều thuộc B.",
         "Tập rỗng là tập con của mọi tập hợp.", 1, 2],
        ["Ngữ văn 10", "Tổng quan văn học Việt Nam",
         "Văn học Việt Nam gồm mấy bộ phận?",
         "Gồm 2 bộ phận: văn học dân gian và văn học viết.",
         "Dân gian = truyền miệng, Viết = của tầng lớp trí thức.", 1, 1],
    ]
    for ri, row in enumerate(mau, 2):
        for ci, val in enumerate(row, 1):
            c = ws.cell(row=ri, column=ci, value=val)
            c.border = border
            c.alignment = Alignment(wrap_text=True, vertical="top")
            if ci <= 4: c.fill = rfill

    for col, w in enumerate([15, 25, 45, 45, 35, 12, 10], 1):
        ws.column_dimensions[openpyxl.utils.get_column_letter(col)].width = w
    ws.row_dimensions[1].height = 35

    ws2 = wb.create_sheet("Hướng dẫn")
    for r, text in enumerate([
        "HƯỚNG DẪN SỬ DỤNG", "",
        "Cột bắt buộc (*):",
        "  chu_de      : vd 'Toán 10', 'Ngữ văn 12'",
        "  tieu_de     : tên bài học cụ thể",
        "  cau_hoi     : câu AI sẽ đọc cho học sinh",
        "  dap_an_mau  : đáp án đủ để AI so sánh", "",
        "Cột tuỳ chọn:",
        "  goi_y       : gợi ý khi học sinh sai",
        "  do_kho      : 1=Dễ  2=Trung bình  3=Khó",
        "  thu_tu      : thứ tự câu trong bài", "",
        "Lưu file dạng .xlsx hoặc .csv (UTF-8).",
    ], 1):
        ws2.cell(row=r, column=1, value=text).font = Font(
            bold=(r == 1), size=11 if r == 1 else 10)
    ws2.column_dimensions["A"].width = 70

    wb.save(path)

@router.post("/upload/excel")
async def upload_excel(
    file: UploadFile = File(...),
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ten = (file.filename or "").lower()
    if not any(ten.endswith(e) for e in [".xlsx", ".xls", ".csv"]):
        raise HTTPException(400, "Chỉ chấp nhận .xlsx, .xls, .csv")

    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(400, "File quá lớn (tối đa 5MB)")

    try:
        kq = xu_ly_excel(content, file.filename, db)
    except ValueError as e:
        raise HTTPException(422, str(e))
    except RuntimeError as e:
        raise HTTPException(500, str(e))

    return {"message": f"Đã thêm {kq['da_them']} câu hỏi",
            "da_them": kq["da_them"], "bai_hocs": kq["bai_hocs"]}


@router.post("/upload/pdf")
async def upload_pdf(
    file:       UploadFile = File(...),
    ten_chu_de: str        = Form(...),
    tieu_de:    str        = Form(...),
    so_cau:     int        = Form(5),
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not (file.filename or "").lower().endswith(".pdf"):
        raise HTTPException(400, "Chỉ chấp nhận .pdf")

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(400, "File quá lớn (tối đa 10MB)")

    try:
        kq = xu_ly_pdf(content, ten_chu_de, tieu_de, max(3, min(10, so_cau)), db)
    except ValueError as e:
        raise HTTPException(422, str(e))
    except (json.JSONDecodeError, KeyError):
        raise HTTPException(500, "AI không sinh được câu hỏi. Giảm số câu hoặc kiểm tra PDF.")
    except RuntimeError as e:
        raise HTTPException(503, str(e))

    return {"message": f"AI sinh {kq['da_them']} câu hỏi từ PDF",
            **kq}


@router.post("/upload/word")
async def upload_word(
    file:       UploadFile = File(...),
    ten_chu_de: str        = Form(...),
    tieu_de:    str        = Form(...),
    so_cau:     int        = Form(5),
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Upload file Word (.docx) → AI tự sinh câu hỏi dò bài"""
    ten = (file.filename or "").lower()
    if not (ten.endswith(".docx") or ten.endswith(".doc")):
        raise HTTPException(400, "Chỉ chấp nhận .docx, .doc")

    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(400, "File quá lớn (tối đa 10MB)")

    try:
        kq = xu_ly_word(content, ten_chu_de, tieu_de, max(3, min(10, so_cau)), db)
    except ValueError as e:
        raise HTTPException(422, str(e))
    except (json.JSONDecodeError, KeyError):
        raise HTTPException(500, "AI không sinh được câu hỏi. Giảm số câu hoặc kiểm tra nội dung Word.")
    except RuntimeError as e:
        raise HTTPException(503, str(e))

    return {"message": f"AI sinh {kq['da_them']} câu hỏi từ Word",
            **kq}


@router.get("/chu-de")
def lay_chu_de(db: Session = Depends(get_db)):
    return [{"id": c.id_chuDe, "ten": c.ten_chuDe}
            for c in db.query(chuDe).order_by(chuDe.id_chuDe).all()]


@router.get("/bai-hoc/{id_chu_de}")
def lay_bai_hoc(id_chu_de: int, db: Session = Depends(get_db)):
    bais = (db.query(taiLieu)
            .filter(taiLieu.id_chuDe == id_chu_de)
            .order_by(taiLieu.mucDoKho).all())
    return [{"id": b.id_taiLieu, "tieu_de": b.tieuDe,
             "loai": b.loai, "do_kho": b.mucDoKho} for b in bais]


@router.get("/cau-hoi/{id_tai_lieu}")
def lay_cau_hoi(id_tai_lieu: int, db: Session = Depends(get_db)):
    caus = (db.query(cauHoi)
            .filter(cauHoi.id_taiLieu == id_tai_lieu,
                    cauHoi.id_loaiCauHoi == ID_DO_BAI)
            .order_by(cauHoi.thuTu).all())
    if not caus:
        raise HTTPException(404, "Chưa có câu hỏi cho bài này")
    return [{"id": c.id_cauHoi, "cau_hoi": c.noiDung, "thu_tu": c.thuTu}
            for c in caus]


@router.post("/cham-diem")
def cham_diem(
    req: ChamDoBaiRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    cau = db.query(cauHoi).filter(cauHoi.id_cauHoi == req.id_cau_hoi).first()
    if not cau:
        raise HTTPException(404, "Không tìm thấy câu hỏi")

    prompt = f"""Em là gia sư đang chấm bài dò bài.

Câu hỏi: {cau.noiDung}
Đáp án chuẩn: {cau.dapAnMau}
Câu trả lời học sinh: {req.cau_tra_loi}

Hãy:
1. Đánh giá: Đúng / Đúng một phần / Sai
2. Chỉ ra điểm thiếu (nếu có)
3. Nhắc lại kiến thức trọng tâm (2 câu)
Dùng tiếng Việt, xưng Thầy gọi Em."""

    nhan_xet = hoi_gia_su(prompt)
    la_dung  = any(kw in nhan_xet.lower() for kw in
                   ["đúng rồi", "chính xác", "đúng!", "tốt lắm", "đúng một phần"])

    db.add(aiLog(id_ngDung=user.id_ngDung, loaiHanhDong="do_bai",
                 noiDungInput=req.cau_tra_loi, noiDungOutput=nhan_xet))
    db.commit()

    return {"nhan_xet": nhan_xet, "la_dung": la_dung,
            "dap_an_mau": cau.dapAnMau, "goi_y": cau.goiY}


@router.post("/luu-ket-qua")
def luu_ket_qua(
    req: LuuKetQuaRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tong    = len(req.ket_qua)
    so_dung = sum(1 for r in req.ket_qua if r.get("dung"))
    diem    = round((so_dung / tong) * 10, 1) if tong > 0 else 0
    xep     = 1 if diem >= 8 else 2 if diem >= 6.5 else 3 if diem >= 5 else 4

    ls = lichSuLamKT(id_baiKiemTra=None, id_ngDung=user.id_ngDung,
                     diem=diem, xepLoai=xep,
                     tg_batDau=datetime.utcnow(), tg_ketThuc=datetime.utcnow())
    db.add(ls); db.flush()

    for r in req.ket_qua:
        db.add(cauTraLoi(id_lsIKT=ls.id_lsIKT, id_dapAn=None,
                         noiDungTuLuan=r.get("cau_tra_loi", ""),
                         ketQua=bool(r.get("dung"))))
    db.commit()

    return {"diem": diem, "so_dung": so_dung, "tong": tong,
            "xep_loai": ["","Giỏi","Khá","Trung bình","Yếu"][xep]}
