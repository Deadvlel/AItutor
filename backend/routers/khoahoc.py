from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from dependencies import get_current_user
from models.course import chuDe, taiLieu, cauHoi
from schemas.khoahoc import HuongDanRequest, TraViTriRequest
from services.ai_service import tim_vi_tri_tu_khoa

router = APIRouter()

@router.get("/mon-hoc")
def lay_mon_hoc(db: Session = Depends(get_db)):
    mons = db.query(chuDe).order_by(chuDe.id_chuDe).all()
    style = {
        "toán":      {"color": "from-violet-600 to-violet-800", "emoji": "📐"},
        "văn":       {"color": "from-amber-600 to-amber-800",   "emoji": "📖"},
        "lý":        {"color": "from-blue-600 to-blue-800",     "emoji": "⚛️"},
        "hóa":       {"color": "from-emerald-600 to-emerald-800","emoji": "🧪"},
        "sinh":      {"color": "from-green-600 to-green-800",   "emoji": "🌿"},
        "sử":        {"color": "from-orange-600 to-orange-800", "emoji": "📜"},
        "giải tích": {"color": "from-violet-600 to-violet-800", "emoji": "📐"},
        "ngữ văn":   {"color": "from-amber-600 to-amber-800",   "emoji": "📖"},
    }
    def get_style(ten):
        t = ten.lower()
        for k, v in style.items():
            if k in t:
                return v
        return {"color": "from-gray-600 to-gray-800", "emoji": "📚"}

    return [
        {
            "id":   m.id_chuDe,
            "ten":  m.ten_chuDe,
            **get_style(m.ten_chuDe),
            "so_bai": db.query(taiLieu)
                       .filter(taiLieu.id_chuDe == m.id_chuDe)
                       .count(),
        }
        for m in mons
    ]


@router.get("/muc-luc/{id_chu_de}")
def lay_muc_luc(id_chu_de: int, db: Session = Depends(get_db)):
    chuongs = db.query(taiLieu).filter(
        taiLieu.id_chuDe == id_chu_de,
        taiLieu.loai == "chuong"
    ).order_by(taiLieu.id_taiLieu).all()

    bais = db.query(taiLieu).filter(
        taiLieu.id_chuDe == id_chu_de,
        taiLieu.loai == "bai"
    ).order_by(taiLieu.id_taiLieu).all()

    if chuongs:
        chunk = max(1, len(bais) // len(chuongs))
        result = []
        for idx, c in enumerate(chuongs):
            start = idx * chunk
            end   = start + chunk if idx < len(chuongs)-1 else len(bais)
            result.append({
                "id":       c.id_taiLieu,
                "tieu_de":  c.tieuDe,
                "bai_hocs": [
                    {
                        "id":         b.id_taiLieu,
                        "tieu_de":    b.tieuDe,
                        "do_kho":     b.mucDoKho,
                        "so_cau_hoi": db.query(cauHoi)
                                       .filter(cauHoi.id_taiLieu == b.id_taiLieu)
                                       .count(),
                    }
                    for b in bais[start:end]
                ],
            })
        return {"co_chuong": True, "muc_luc": result}

    return {
        "co_chuong": False,
        "muc_luc": [{"id": None, "tieu_de": "Bài học", "bai_hocs": [
            {"id": b.id_taiLieu, "tieu_de": b.tieuDe,
             "do_kho": b.mucDoKho, "so_cau_hoi": 0}
            for b in bais
        ]}]
    }


@router.post("/huong-dan")
def ai_huong_dan(
    req: HuongDanRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Endpoint hướng dẫn bài học.
    - Nếu `dung_ollama=True` (và có `cau_hoi_hoc_sinh`): dùng Ollama cho hội thoại.
    - Còn lại: dùng Gemini cho hướng dẫn theo bước.
    """
    from services.ai_service import hoi_gia_su, hoi_gia_su_ollama

    tai_lieu_obj = db.query(taiLieu).filter(taiLieu.id_taiLieu == req.id_tai_lieu).first()
    if not tai_lieu_obj:
        raise HTTPException(404, "Không tìm thấy bài học")

    chu_de_obj = db.query(chuDe).filter(chuDe.id_chuDe == tai_lieu_obj.id_chuDe).first()
    ten_mon = chu_de_obj.ten_chuDe if chu_de_obj else "môn học"
    ten_bai = tai_lieu_obj.tieuDe

    cau_hois = db.query(cauHoi).filter(cauHoi.id_taiLieu == req.id_tai_lieu).order_by(cauHoi.thuTu).all()
    noi_dung_bai = "\n".join(f"- {c.noiDung}: {c.dapAnMau}" for c in cau_hois) \
                   if cau_hois else (tai_lieu_obj.tieuDe or "(Chưa có nội dung)")

    do_kho_text = {1: "cơ bản", 2: "trung bình", 3: "nâng cao"}.get(tai_lieu_obj.mucDoKho, "trung bình")
    tong_buoc   = max(len(cau_hois) + 1, 3)

    # ── Phân nhánh: Chat hội thoại (Ollama) vs Hướng dẫn theo bước (Gemini) ──
    if req.cau_hoi_hoc_sinh.strip():
        prompt = (
            f'Em đang học bài "{ten_bai}" ({ten_mon}, độ khó {do_kho_text}).\n'
            f"Nội dung bài:\n{noi_dung_bai[:800]}\n\n"
            f"Câu hỏi: {req.cau_hoi_hoc_sinh}\n\n"
            f"Trả lời ngắn gọn theo phong cách gia sư, gợi ý trước không đưa đáp án thẳng. "
            f"Xưng Thầy gọi Em, tiếng Việt, tối đa 5 dòng."
        )

        # Chuyển lịch sử chat từ frontend sang định dạng Ollama
        lich_su_ollama = [
            {"role": m["role"], "content": m["content"]}
            for m in (req.lich_su_chat or [])
        ]

        if req.dung_ollama:
            # Hội thoại → Ollama (model local đã train)
            noi_dung = hoi_gia_su_ollama(
                noi_dung = prompt,
                lich_su  = lich_su_ollama,
                ten_mon  = ten_mon,
            )
        else:
            # Fallback → Gemini nếu client không set dung_ollama
            noi_dung = hoi_gia_su(prompt, ten_mon=ten_mon)

    elif req.buoc_hien_tai == 1:
        # Bước 1 — Giới thiệu bài (Gemini)
        prompt = (
            f'Em sắp học bài "{ten_bai}" ({ten_mon}, mức {do_kho_text}).\n'
            f"Nội dung:\n{noi_dung_bai[:800]}\n\n"
            f"Hãy: 1. Chào và nêu mục tiêu bài (2-3 điểm)\n"
            f"2. Giải thích tại sao bài này quan trọng\n"
            f'3. Nói "Bài này Thầy sẽ hướng dẫn Em qua {tong_buoc} bước"\n'
            f"4. Đặt 1 câu hỏi khơi gợi tò mò\n"
            f"Ngắn gọn, xưng Thầy gọi Em, tiếng Việt."
        )
        noi_dung = hoi_gia_su(prompt, ten_mon=ten_mon)

    else:
        # Bước tiếp theo — Dạy từng phần (Gemini)
        phan_idx = min(req.buoc_hien_tai - 2, len(cau_hois) - 1)
        phan_hoc = cau_hois[phan_idx] if 0 <= phan_idx < len(cau_hois) else None
        la_buoc_cuoi = req.buoc_hien_tai >= tong_buoc

        if phan_hoc:
            prompt = (
                f'Em học bài "{ten_bai}" ({ten_mon}), bước {req.buoc_hien_tai}/{tong_buoc}.\n'
                f"Phần cần dạy: {phan_hoc.noiDung}\n"
                f"Kiến thức: {phan_hoc.dapAnMau}\n\n"
                f"Hãy: 1. Giải thích đơn giản (3-4 câu)\n"
                f"2. Ví dụ minh họa\n"
                f"3. Đặt 1 câu hỏi nhỏ tự kiểm tra\n"
                f'{"4. Tổng kết, báo Em học xong bài!" if la_buoc_cuoi else ""}\n'
                f"Xưng Thầy gọi Em, tiếng Việt."
            )
        else:
            prompt = (
                f'Em đã xong bài "{ten_bai}"! Tóm tắt 3 điểm quan trọng, '
                f"gợi ý ôn lại và khuyến khích học bài tiếp. Xưng Thầy gọi Em, tiếng Việt."
            )
        noi_dung = hoi_gia_su(prompt, ten_mon=ten_mon)

    return {
        "noi_dung"    : noi_dung,
        "buoc"        : req.buoc_hien_tai,
        "tong_buoc"   : tong_buoc,
        "la_buoc_cuoi": req.buoc_hien_tai >= tong_buoc,
        "ten_bai"     : ten_bai,
        "ten_mon"     : ten_mon,
    }


@router.post("/tra-vi-tri")
def tra_vi_tri(req: TraViTriRequest, user=Depends(get_current_user)):
    vi_tri = tim_vi_tri_tu_khoa(tu_khoa=req.tu_khoa, ten_mon=req.ten_mon or None)
    if not vi_tri:
        return {"tim_thay": False, "thong_bao": f'Không tìm thấy "{req.tu_khoa}" trong SGK.'}
    return {
        "tim_thay"     : True,
        "tu_khoa"      : req.tu_khoa,
        "ten_mon"      : vi_tri["ten_mon"],
        "trang"        : vi_tri["trang"],
        "dong_bat_dau" : vi_tri["dong_bat_dau"],
        "dong_ket_thuc": vi_tri["dong_ket_thuc"],
        "doan_van"     : vi_tri["doan_van"],
    }


@router.get("/kiem-tra-ollama")
def kiem_tra_ollama_endpoint(user=Depends(get_current_user)):
    """Debug endpoint — kiểm tra Ollama có online và đúng model không."""
    from services.ai_service import kiem_tra_ollama
    return kiem_tra_ollama()


@router.get("/goi-y-on-bai/{id_nguoi_dung}")
def goi_y_on_bai(id_nguoi_dung: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    return {"co_goi_y": False, "bai_goi_y": []}
