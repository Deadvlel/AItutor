import json
from datetime import datetime
from sqlalchemy.orm import Session
from models.khoahoc import baiKiemTra, cauHoi, dapAn, lichSuLamKT, chiTietKiemTra, thongBao
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

    raw = tao_de_thi_json(prompt)

    raw = raw.strip()
    if raw.startswith("```"):
        raw = raw.split("\n", 1)[1]
        raw = raw.rsplit("```", 1)[0]

    data = json.loads(raw)

    kt = baiKiemTra(
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
            id_baiKiemTra=kt.id_baiKiemTra,
            id_chuDe=None,
            id_loaiCauHoi=1,
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
                laDapAnDung=da["la_dap_an"],
            )
            db.add(d)
            db.flush()
            dap_ans.append({
                "id":        d.id_dapAn,
                "noi_dung":  d.noiDungDapAn,
                "la_dap_an": d.laDapAnDung,
            })

        result.append({
            "id":             cau.id_cauHoi,
            "noi_dung":       cau.noiDung,
            "loi_giai_thich": cau.loiGiaiThich,
            "dap_an":         dap_ans,
        })

    db.commit()
    return {
        "id_kiem_tra": kt.id_baiKiemTra,
        "tieu_de":     kt.tieuDe,
        "chu_de":      chu_de,
        "do_kho":      do_kho,
        "cau_hoi":     result,
    }


def cham_diem(db: Session, user_id: int, id_kiem_tra: int, cau_tra_loi: list[dict]) -> dict | None:
    kt = db.query(baiKiemTra).filter(
        baiKiemTra.id_baiKiemTra == id_kiem_tra,
        baiKiemTra.id_ngDung == user_id,
    ).first()
    if not kt:
        return None

    tong = len(cau_tra_loi)
    dung = 0
    chi_tiet = []

    ls = lichSuLamKT(
        id_baiKiemTra=id_kiem_tra,
        id_ngDung=user_id,
        diem=0,
        xepLoai=None,
        tg_batDau=datetime.utcnow(),
        tg_ketThuc=datetime.utcnow(),
    )
    db.add(ls)
    db.flush()

    for tl in cau_tra_loi:
        id_cau     = tl.get("id_cau_hoi")
        id_da_chon = tl.get("id_dap_an")

        cau     = db.query(cauHoi).filter(cauHoi.id_cauHoi == id_cau).first()
        das     = db.query(dapAn).filter(dapAn.id_cauHoi == id_cau).all()
        da_dung = next((d for d in das if d.laDapAnDung), None)
        la_dung = bool(da_dung and da_dung.id_dapAn == id_da_chon)

        if la_dung:
            dung += 1

        db.add(chiTietKiemTra(
            id_lsIKT=ls.id_lsIKT,
            id_baiKiemTra=id_kiem_tra,
            id_cauHoi=id_cau,
            id_dapAnChon=id_da_chon,
            la_Dung=la_dung,
        ))

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
    xep_loai_map = {True: 1, False: 2}
    if diem >= 8:
        xep_loai = 1
    elif diem >= 6.5:
        xep_loai = 2
    elif diem >= 5:
        xep_loai = 3
    else:
        xep_loai = 4
    xep_loai_text = {1: "Giỏi", 2: "Khá", 3: "Trung bình", 4: "Yếu"}[xep_loai]

    ls.diem = diem
    ls.xepLoai = xep_loai
    kt.diemSo = diem

    db.commit()

    return {"diem": diem, "dung": dung, "tong": tong, "xep_loai": xep_loai_text, "chi_tiet": chi_tiet}


def lay_lich_su_thi(db: Session, user_id: int) -> list[dict]:
    bais = (
        db.query(lichSuLamKT)
        .filter(lichSuLamKT.id_ngDung == user_id)
        .order_by(lichSuLamKT.tg_batDau.desc())
        .limit(20)
        .all()
    )
    xep_map = {1: "Giỏi", 2: "Khá", 3: "Trung bình", 4: "Yếu"}
    result = []
    for bl in bais:
        kt = db.query(baiKiemTra).filter(baiKiemTra.id_baiKiemTra == bl.id_baiKiemTra).first()
        result.append({
            "id":       bl.id_lsIKT,
            "tieu_de":  kt.tieuDe if kt else "Bài thi",
            "diem":     bl.diem,
            "xep_loai": xep_map.get(bl.xepLoai, ""),
            "ngay":     bl.tg_batDau.strftime("%d/%m/%Y") if bl.tg_batDau else "",
        })
    return result


def lay_chi_tiet(db: Session, user_id: int, id_lich_su: int) -> dict | None:
    ls = db.query(lichSuLamKT).filter(
        lichSuLamKT.id_lsIKT == id_lich_su,
        lichSuLamKT.id_ngDung == user_id,
    ).first()
    if not ls:
        return None

    kt = db.query(baiKiemTra).filter(baiKiemTra.id_baiKiemTra == ls.id_baiKiemTra).first()

    chi_tiets = (
        db.query(chiTietKiemTra)
        .filter(chiTietKiemTra.id_lsIKT == id_lich_su)
        .all()
    )

    xep_map = {1: "Giỏi", 2: "Khá", 3: "Trung bình", 4: "Yếu"}
    cau_hoi_list = []
    for ct in chi_tiets:
        cau = db.query(cauHoi).filter(cauHoi.id_cauHoi == ct.id_cauHoi).first()
        das = db.query(dapAn).filter(dapAn.id_cauHoi == ct.id_cauHoi).all()
        da_dung = next((d for d in das if d.laDapAnDung), None)

        cau_hoi_list.append({
            "noi_dung_cau":   cau.noiDung if cau else "",
            "loi_giai_thich": cau.loiGiaiThich if cau else "",
            "dap_an": [
                {"id": d.id_dapAn, "noi_dung": d.noiDungDapAn, "la_dap_an_dung": d.laDapAnDung}
                for d in das
            ],
            "id_da_chon":     ct.id_dapAnChon,
            "la_dung":        ct.la_Dung,
        })

    return {
        "tieu_de":  kt.tieuDe if kt else "Bài thi",
        "diem":     ls.diem,
        "xep_loai": xep_map.get(ls.xepLoai, ""),
        "ngay":     ls.tg_batDau.strftime("%d/%m/%Y %H:%M") if ls.tg_batDau else "",
        "cau_hoi":  cau_hoi_list,
    }
