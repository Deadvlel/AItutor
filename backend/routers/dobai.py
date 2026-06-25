import json
import os
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from models import ngDung

from database import get_db
from dependencies import get_current_user
from models.khoahoc import chuDe, taiLieu, cauHoi, lichSuLamKT, cauTraLoi, aiLog, kyNang, tienDoKyNang, thongBao
from services.ai_service import hoi_gia_su, tim_sgk, _xay_dung_ngu_canh, tao_de_thi_json, _goi_gemini
from services.upload_service import xu_ly_excel, xu_ly_pdf, xu_ly_word

router = APIRouter()
ID_DO_BAI = 2

class ChamDoBaiRequest(BaseModel):
    id_cau_hoi:  int | None = None
    cau_hoi:     str | None = None
    dap_an_mau:  str | None = None
    cau_tra_loi: str


class SinhCauHoiRequest(BaseModel):
    id_tai_lieu: int
    so_cau:      int = 5


class CauTraLoiItem(BaseModel):
    cau_hoi:     str
    cau_tra_loi: str
    dung:        bool

class LuuKetQuaRequest(BaseModel):
    id_tai_lieu:  int
    tong_cau:     int
    so_cau_dung:  int
    chi_tiet:     list[CauTraLoiItem] = []
    # --- FIX: nhận id_buoc_hoc từ lộ trình để unlock bước tiếp ---
    id_buoc_hoc:  int | None = None


@router.post("/sinh-cau-hoi")
def sinh_cau_hoi(
    req: SinhCauHoiRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bai = db.query(taiLieu).filter(taiLieu.id_taiLieu == req.id_tai_lieu).first()
    if not bai:
        raise HTTPException(404, "Không tìm thấy bài học")

    ten_mon = None
    if bai.id_chuDe:
        cd = db.query(chuDe).filter(chuDe.id_chuDe == bai.id_chuDe).first()
        if cd:
            ten_mon = cd.ten_chuDe

    doan_list = tim_sgk(bai.tieuDe, ten_mon=ten_mon, top_k=5)
    ngu_canh  = _xay_dung_ngu_canh(doan_list)

    so_cau = max(3, min(10, req.so_cau))

    prompt = f"""Bạn là giáo viên Việt Nam. Dựa vào nội dung SGK sau, hãy tạo {so_cau} câu hỏi dò bài ngắn gọn.

NỘI DUNG SGK BÀI "{bai.tieuDe}":
{ngu_canh}

Trả về JSON thuần, không markdown, không giải thích:
{{
  "cau_hois": [
    {{
      "thu_tu": 1,
      "cau_hoi": "Câu hỏi ngắn gọn, rõ ràng bằng tiếng Việt?",
      "dap_an_mau": "Đáp án đầy đủ các ý chính."
    }}
  ]
}}

Yêu cầu:
- Câu hỏi ngắn, học sinh có thể trả lời bằng miệng trong 1-2 câu
- Bao phủ các khái niệm quan trọng của bài
- Không hỏi về số trang, không hỏi câu quá khó"""

    try:
        raw = _goi_gemini(prompt).strip()
        if raw.startswith("```"):
            raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()
        data = json.loads(raw)
        cau_hois = data.get("cau_hois", [])
        if not cau_hois:
            raise ValueError("Không có câu hỏi")
    except HTTPException:
        raise
    except Exception:
        cau_hois = [
            {
                "thu_tu": 1,
                "cau_hoi": f"Em hãy trình bày khái niệm chính của bài '{bai.tieuDe}'?",
                "dap_an_mau": "Học sinh trình bày được nội dung cơ bản của bài."
            }
        ]

    return {
        "tieu_de": bai.tieuDe,
        "ten_mon": ten_mon or "",
        "cau_hois": [
            {
                "id": None,
                "thu_tu": c.get("thu_tu", i + 1),
                "cau_hoi": c.get("cau_hoi", ""),
                "dap_an_mau": c.get("dap_an_mau", ""),
            }
            for i, c in enumerate(cau_hois)
        ]
    }


@router.post("/cham-diem")
def cham_diem(
    req: ChamDoBaiRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if req.id_cau_hoi:
        cau = db.query(cauHoi).filter(cauHoi.id_cauHoi == req.id_cau_hoi).first()
        if not cau:
            raise HTTPException(404, "Không tìm thấy câu hỏi")
        cau_hoi_text = cau.noiDung
        dap_an_text  = cau.dapAnMau
        goi_y_text   = cau.goiY
    elif req.cau_hoi:
        cau_hoi_text = req.cau_hoi
        dap_an_text  = req.dap_an_mau or ""
        goi_y_text   = None
    else:
        raise HTTPException(400, "Thiếu thông tin câu hỏi")

    ngu_canh_sgk = ""
    if not dap_an_text:
        doan_list = tim_sgk(cau_hoi_text)
        if doan_list:
            ngu_canh_sgk = _xay_dung_ngu_canh(doan_list)

    if dap_an_text:
        phan_dap_an = f"Đáp án chuẩn: {dap_an_text}"
    elif ngu_canh_sgk:
        phan_dap_an = f"Nội dung SGK liên quan:\n{ngu_canh_sgk}\nDựa vào SGK trên để đánh giá câu trả lời."
    else:
        phan_dap_an = "Không có đáp án mẫu, hãy tự đánh giá dựa trên kiến thức chung."

    prompt = f"""Em là gia sư đang chấm bài dò bài.

Câu hỏi: {cau_hoi_text}
{phan_dap_an}
Câu trả lời học sinh: {req.cau_tra_loi}

Hãy đánh giá và trả về JSON thuần (không markdown, không giải thích thêm):
{{
  "ket_qua": "dung",
  "nhan_xet": "Nhận xét ngắn gọn bằng tiếng Việt, xưng Thầy gọi Em",
  "dap_an_mau": "Đáp án đúng đầy đủ"
}}

Quy tắc ket_qua:
- "dung"     : trả lời đúng và đủ ý chính
- "mot_phan" : đúng nhưng thiếu ý hoặc chưa rõ
- "sai"      : sai hoặc không liên quan

Nhan_xet: chỉ ra điểm đúng/thiếu, nhắc lại kiến thức trọng tâm (2-3 câu)."""

    try:
        raw = _goi_gemini(prompt).strip()
    except Exception:
        raw = ""
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1].rsplit("```", 1)[0].strip()

    try:
        data = json.loads(raw)
        ket_qua  = data.get("ket_qua", "sai")
        nhan_xet = data.get("nhan_xet", raw)
        if not dap_an_text and data.get("dap_an_mau"):
            dap_an_text = data["dap_an_mau"]
    except (json.JSONDecodeError, ValueError):
        ket_qua  = "dung" if any(kw in raw.lower() for kw in
                    ["đúng rồi", "chính xác", "đúng!", "tốt lắm"]) else "sai"
        nhan_xet = raw if raw else "Không nhận được phản hồi từ AI."

    la_dung = ket_qua == "dung"

    db.add(aiLog(
        id_ngDung=user.id_ngDung,
        loaiHanhDong="do_bai",
        noiDungInput=req.cau_tra_loi,
        noiDungOutput=nhan_xet,
    ))
    db.commit()

    return {
        "nhan_xet":   nhan_xet,
        "la_dung":    la_dung,
        "ket_qua":    ket_qua,
        "dap_an_mau": dap_an_text,
        "goi_y":      goi_y_text,
    }


@router.post("/luu-ket-qua")
def luu_ket_qua(
    req: LuuKetQuaRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    tong    = req.tong_cau
    so_dung = req.so_cau_dung
    diem    = round((so_dung / tong) * 10, 1) if tong > 0 else 0
    xep     = 1 if diem >= 8 else 2 if diem >= 6.5 else 3 if diem >= 5 else 4

    ls = lichSuLamKT(
        id_baiKiemTra=None, id_ngDung=user.id_ngDung,
        diem=diem, xepLoai=xep,
        tg_batDau=datetime.utcnow(), tg_ketThuc=datetime.utcnow(),
    )
    db.add(ls)
    db.flush()

    for ct in req.chi_tiet:
        db.add(cauTraLoi(
            id_lsIKT=ls.id_lsIKT,
            id_dapAn=None,
            noiDungTuLuan=f"[Q] {ct.cau_hoi}\n[A] {ct.cau_tra_loi}",
            ketQua=ct.dung,
        ))
    db.commit()

    bai = db.query(taiLieu).filter(taiLieu.id_taiLieu == req.id_tai_lieu).first()
    if bai and bai.id_chuDe:
        _cap_nhat_tien_do(db, user.id_ngDung, bai.id_chuDe, diem)
        _tao_goi_y(db, user.id_ngDung, bai, diem)

    # --- FIX: nếu đến từ lộ trình và điểm >= 5 → hoàn thành bước hiện tại ---
    buoc_hoan_thanh = None
    if req.id_buoc_hoc and diem >= 5:
        from models.khoahoc import buocHoc, loTrinh
        buoc = db.query(buocHoc).filter(buocHoc.id_buocHoc == req.id_buoc_hoc).first()
        if buoc:
            lt = db.query(loTrinh).filter(
                loTrinh.id_loTrinh == buoc.id_loTrinh,
                loTrinh.id_ngDung  == user.id_ngDung,
            ).first()
            if lt:
                buoc.trangThai = 2  # hoan_thanh
                db.commit()
                buoc_hoan_thanh = req.id_buoc_hoc

    return {
        "diem":             diem,
        "so_dung":          so_dung,
        "tong":             tong,
        "xep_loai":         ["", "Gioi", "Kha", "Trung binh", "Yeu"][xep],
        "buoc_hoan_thanh":  buoc_hoan_thanh,  # frontend dùng để cập nhật UI lộ trình
        "dat_dieu_kien":    diem >= 5,
    }


@router.get("/tai-file-mau")
def tai_file_mau():
    import tempfile, os
    tmp_dir = tempfile.gettempdir()
    path = os.path.join(tmp_dir, "cau_hoi_do_bai_mau.xlsx")
    _tao_excel_mau(path)
    return FileResponse(
        path,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename="cau_hoi_do_bai_mau.xlsx",
    )


def _tao_excel_mau(path: str):
    try:
        import openpyxl
        from openpyxl.styles import PatternFill, Font, Alignment
    except ImportError:
        raise RuntimeError("pip install openpyxl")

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Câu hỏi dò bài"
    headers_row = ["chu_de", "tieu_de", "cau_hoi", "dap_an_mau", "goi_y", "do_kho", "thu_tu"]
    for col, h in enumerate(headers_row, 1):
        ws.cell(row=1, column=col, value=h)
    wb.save(path)


def _id_ngDung_theo_quyen(user) -> int | None:
    return None if getattr(user, "vaiTro", None) == "admin" else user.id_ngDung


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
        kq = xu_ly_excel(content, file.filename, db, id_ngDung=_id_ngDung_theo_quyen(user))
    except ValueError as e:
        raise HTTPException(422, str(e))
    except RuntimeError as e:
        raise HTTPException(500, str(e))

    if _id_ngDung_theo_quyen(user) is None:
        hoc_sinhs = db.query(ngDung).filter(
            (ngDung.vaiTro == "hoc_sinh") | (ngDung.vaiTro == None)
        ).all()
        for hs in hoc_sinhs:
            db.add(thongBao(
                id_ngDung=hs.id_ngDung,
                tieuDe="Bài học mới đã được thêm",
                noiDung=f"Có {kq['da_them']} câu hỏi mới được thêm vào hệ thống. Vào dò bài để ôn tập nhé!",
                daDoc=False,
            ))
        db.commit()

    return {"message": f"Đã thêm {kq['da_them']} câu hỏi", **kq}


@router.post("/upload/pdf")
async def upload_pdf(
    file: UploadFile = File(...),
    ten_chu_de: str = Form(...),
    tieu_de: str = Form(...),
    so_cau: int = Form(5),
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not (file.filename or "").lower().endswith(".pdf"):
        raise HTTPException(400, "Chỉ chấp nhận .pdf")
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(400, "File quá lớn (tối đa 10MB)")
    try:
        kq = xu_ly_pdf(content, ten_chu_de, tieu_de, max(3, min(10, so_cau)), db,
                       id_ngDung=_id_ngDung_theo_quyen(user))
    except ValueError as e:
        raise HTTPException(422, str(e))
    except Exception as e:
        raise HTTPException(500, str(e))
    return {"message": f"AI sinh {kq['da_them']} câu hỏi từ PDF", **kq}


@router.post("/upload/word")
async def upload_word(
    file: UploadFile = File(...),
    ten_chu_de: str = Form(...),
    tieu_de: str = Form(...),
    so_cau: int = Form(5),
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ten = (file.filename or "").lower()
    if not (ten.endswith(".docx") or ten.endswith(".doc")):
        raise HTTPException(400, "Chỉ chấp nhận .docx, .doc")
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(400, "File quá lớn (tối đa 10MB)")
    try:
        kq = xu_ly_word(content, ten_chu_de, tieu_de, max(3, min(10, so_cau)), db,
                        id_ngDung=_id_ngDung_theo_quyen(user))
    except ValueError as e:
        raise HTTPException(422, str(e))
    except Exception as e:
        raise HTTPException(500, str(e))
    return {"message": f"AI sinh {kq['da_them']} câu hỏi từ Word", **kq}


@router.get("/chu-de")
def lay_chu_de(user=Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.query(chuDe).filter(
        (chuDe.id_ngDung == None) | (chuDe.id_ngDung == user.id_ngDung)
    ).order_by(chuDe.id_chuDe).all()
    return [{"id": c.id_chuDe, "ten": c.ten_chuDe} for c in rows]


@router.get("/bai-hoc/{id_chu_de}")
def lay_bai_hoc(id_chu_de: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    cd = db.query(chuDe).filter(chuDe.id_chuDe == id_chu_de).first()
    if not cd or (cd.id_ngDung is not None and cd.id_ngDung != user.id_ngDung):
        raise HTTPException(404, "Không tìm thấy khóa học")
    bais = db.query(taiLieu).filter(taiLieu.id_chuDe == id_chu_de).order_by(taiLieu.mucDoKho).all()
    return [{"id": b.id_taiLieu, "tieu_de": b.tieuDe, "loai": b.loai, "do_kho": b.mucDoKho} for b in bais]


@router.get("/cau-hoi/{id_tai_lieu}")
def lay_cau_hoi(id_tai_lieu: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    bai = db.query(taiLieu).filter(taiLieu.id_taiLieu == id_tai_lieu).first()
    if not bai or (bai.id_ngDung is not None and bai.id_ngDung != user.id_ngDung):
        raise HTTPException(404, "Không tìm thấy bài học")

    caus = db.query(cauHoi).filter(
        cauHoi.id_taiLieu == id_tai_lieu,
        cauHoi.id_loaiCauHoi == ID_DO_BAI
    ).order_by(cauHoi.thuTu).all()
    if not caus:
        raise HTTPException(404, "Chưa có câu hỏi cho bài này")

    return [{"id": c.id_cauHoi, "cau_hoi": c.noiDung, "thu_tu": c.thuTu, "dap_an_mau": c.dapAnMau} for c in caus]


def _cap_nhat_tien_do(db: Session, id_ngDung: int, id_chuDe: int, diem: float):
    ky_nangs = db.query(kyNang).filter(kyNang.id_chuDe == id_chuDe).all()
    if not ky_nangs:
        kn = kyNang(id_chuDe=id_chuDe, tenKyNang="Kien thuc tong hop")
        db.add(kn)
        db.flush()
        ky_nangs = [kn]

    for kn in ky_nangs:
        td = db.query(tienDoKyNang).filter(
            tienDoKyNang.id_ngDung == id_ngDung,
            tienDoKyNang.id_kyNang == kn.id_kyNang,
        ).first()

        new_muc_do = min(100, diem * 10)

        if td:
            td.mucDoThanhThao = round((td.mucDoThanhThao + new_muc_do) / 2, 1) if td.mucDoThanhThao else new_muc_do
            td.diemDanhGia = diem
            td.ngayDanhGia = datetime.utcnow()
            td.trangThai = "thanh_thao" if td.mucDoThanhThao >= 80 else "dang_hoc"
        else:
            td = tienDoKyNang(
                id_ngDung=id_ngDung,
                id_kyNang=kn.id_kyNang,
                diemDanhGia=diem,
                mucDoThanhThao=new_muc_do,
                trangThai="dang_hoc",
            )
            db.add(td)

    db.commit()


def _tao_goi_y(db: Session, id_ngDung: int, bai, diem: float):
    from models.khoahoc import aiGoiY, chuDe as ChuDe
    from services.ai_service import tao_goi_y_gemini

    cd = db.query(ChuDe).filter(ChuDe.id_chuDe == bai.id_chuDe).first()
    ten_chu_de = cd.ten_chuDe if cd else bai.tieuDe

    if diem >= 8:
        tin_cay = min(100, int(diem * 12))
    elif diem >= 5:
        tin_cay = int(diem * 8)
    else:
        tin_cay = max(10, int(diem * 5))

    try:
        noi_dung = tao_goi_y_gemini(ten_chu_de, diem)
    except Exception:
        if diem >= 8:
            noi_dung = f"Tuyệt vời! Hãy thử bài nâng cao hơn về {ten_chu_de}."
        elif diem >= 5:
            noi_dung = f"Khá tốt! Ôn lại phần chưa vững về {ten_chu_de} nhé."
        else:
            noi_dung = f"Cố lên! Xem lại lý thuyết {ten_chu_de} trước khi làm bài."

    db.add(aiGoiY(
        id_ngDung=id_ngDung,
        id_chuDe=bai.id_chuDe,
        id_taiLieu=bai.id_taiLieu,
        noiDungGoiY=noi_dung,
        trangThai=False,
        diemTinCay=tin_cay,
    ))
    db.commit()