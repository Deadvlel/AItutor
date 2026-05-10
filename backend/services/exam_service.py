import json
from datetime import datetime
from sqlalchemy.orm import Session
from models import kiemTra, cauHoi, dapAn, lichSuBaiLam
from services.ai_service import tao_de_thi_json


def tao_de(db: Session, user_id: int, chu_de: str, so_cau: int, do_kho: str) -> dict:
    so_cau = max(3, min(10, so_cau))

    do_kho_desc = {
        "de":         "câu hỏi cơ bản, định nghĩa, nhận biết",
        "trung binh": "câu hỏi vận dụng, tính toán, hiểu bản chất",
        "kho":        "câu hỏi phân tích, nâng cao, suy luận tổng hợp",
    }.get(do_kho, "câu hỏi vận dụng")

    prompt = f"""Tạo {so_cau} câu hỏi trắc nghiệm về "{chu_de}", độ khó: {do_kho_desc}.

Trả về JSON hợp lệ theo đúng cấu trúc (không thêm gì khác):
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
Quy tắc: mỗi câu đúng 4 đáp án, đúng 1 la_dap_an true, tiếng Việt."""

    raw = tao_de_thi_json(prompt)   # có thể raise RuntimeError

    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1]
        raw = raw.rsplit("```", 1)[0]

    data = json.loads(raw)   # JSONDecodeError sẽ bắt ở router

    # Lưu DB
    kt = kiemTra(
        id_ngDung=user_id,
        id_taiLieu=None,
        tieuDe=data["tieu_de"],
        diemSo=None,
        ngayTao=datetime.utcnow(),
    )
    db.add(kt)
    db.flush()

    result = []
    for ch in data["cau_hoi"]:
        cau = cauHoi(
            id_kiemTra=kt.id_kiemTra,
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

        result.append({
            "id":             cau.id_cauHoi,
            "noi_dung":       cau.noiDung,
            "loi_giai_thich": cau.loiGiaiThich,
            "dap_an":         dap_ans,
        })

    db.commit()
    return {
        "id_kiem_tra": kt.id_kiemTra,
        "tieu_de":     kt.tieuDe,
        "chu_de":      chu_de,
        "do_kho":      do_kho,
        "cau_hoi":     result,
    }


def cham_diem(db: Session, user_id: int, id_kiem_tra: int, cau_tra_loi: list[dict]) -> dict | None:
    kt = db.query(kiemTra).filter(
        kiemTra.id_kiemTra == id_kiem_tra,
        kiemTra.id_ngDung  == user_id,
    ).first()
    if not kt:
        return None

    tong = len(cau_tra_loi)
    dung = 0
    chi_tiet = []

    for tl in cau_tra_loi:
        id_cau     = tl.get("id_cau_hoi")
        id_da_chon = tl.get("id_dap_an")

        cau     = db.query(cauHoi).filter(cauHoi.id_cauHoi == id_cau).first()
        das     = db.query(dapAn).filter(dapAn.id_cauHoi  == id_cau).all()
        da_dung = next((d for d in das if d.laDapAn), None)
        la_dung = bool(da_dung and da_dung.id_dapAn == id_da_chon)

        if la_dung:
            dung += 1

        chi_tiet.append({
            "id_cau_hoi":     id_cau,
            "noi_dung_cau":   cau.noiDung if cau else "",
            "id_da_chon":     id_da_chon,
            "id_dap_an_dung": da_dung.id_dapAn if da_dung else None,
            "noi_dung_dung":  da_dung.noiDungDapAn if da_dung else "",
            "la_dung":        la_dung,
            "loi_giai_thich": cau.loiGiaiThich if cau else "",
        })

    diem     = round((dung / tong) * 10, 1) if tong > 0 else 0
    xep_loai = "Giỏi" if diem >= 8 else "Khá" if diem >= 6.5 else "Trung bình" if diem >= 5 else "Yếu"

    kt.diemSo = diem
    db.add(lichSuBaiLam(
        id_kiemTra=id_kiem_tra,
        id_ngDung=user_id,
        diem=diem,
        xepLoai=xep_loai,
        tg_batDau=datetime.utcnow(),
        tg_ketThuc=datetime.utcnow(),
    ))
    db.commit()

    return {"diem": diem, "dung": dung, "tong": tong, "xep_loai": xep_loai, "chi_tiet": chi_tiet}


def lay_lich_su_thi(db: Session, user_id: int) -> list[dict]:
    bais = (
        db.query(lichSuBaiLam)
        .filter(lichSuBaiLam.id_ngDung == user_id)
        .order_by(lichSuBaiLam.tg_batDau.desc())
        .limit(20)
        .all()
    )
    result = []
    for bl in bais:
        kt = db.query(kiemTra).filter(kiemTra.id_kiemTra == bl.id_kiemTra).first()
        result.append({
            "id":       bl.id_lsl,
            "tieu_de":  kt.tieuDe if kt else "Bài thi",
            "diem":     bl.diem,
            "xep_loai": bl.xepLoai,
            "ngay":     bl.tg_batDau.strftime("%d/%m/%Y") if bl.tg_batDau else "",
        })
    return result
