import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from dependencies import get_current_user
from models.khoahoc import loTrinh, buocHoc, chuDe, taiLieu, kyNang, tienDoKyNang, lichSuLamKT
from schemas.lotrinh import TaoLoTrinhRequest, CapNhatBuocHocRequest

router = APIRouter()


@router.get("")
def lay_lo_trinh(user=Depends(get_current_user), db: Session = Depends(get_db)):
    lt = db.query(loTrinh).filter(
        loTrinh.id_ngDung == user.id_ngDung
    ).order_by(loTrinh.id_loTrinh.desc()).first()

    if not lt:
        return None

    buocs = db.query(buocHoc).filter(
        buocHoc.id_loTrinh == lt.id_loTrinh
    ).order_by(buocHoc.thuTu).all()

    tong = len(buocs)
    da_xong = sum(1 for b in buocs if b.trangThai == 2)
    pct = round(da_xong / tong * 100) if tong > 0 else 0

    buoc_list = []
    for b in buocs:
        chu_de_obj = db.query(chuDe).filter(chuDe.id_chuDe == b.id_chuDe).first() if b.id_chuDe else None

        trang_thai_text = {0: "chua_mo", 1: "dang_hoc", 2: "hoan_thanh", 3: "dang_on"}.get(b.trangThai, "chua_mo")

        # Tính tiến độ thực từ điểm dò bài cao nhất trong chủ đề
        tien_do_thuc = 0
        if b.trangThai == 2:
            tien_do_thuc = 100
        elif b.trangThai in (1, 3) and b.id_chuDe:
            # trangThai=1 (dang_hoc) hoặc 3 (dang_on) đều tính tiến độ từ điểm thực
            lich_su_all = db.query(lichSuLamKT).filter(
                lichSuLamKT.id_ngDung == user.id_ngDung,
                lichSuLamKT.id_baiKiemTra == None,
            ).all()
            if lich_su_all:
                diem_cao_nhat = max((ls.diem or 0) for ls in lich_su_all)
                tien_do_thuc = min(99, round(diem_cao_nhat / 10 * 100))
            else:
                tien_do_thuc = 10  # Đã bắt đầu nhưng chưa làm bài nào

        # Lấy bài đầu tiên của chủ đề để spotlight khi navigate từ lộ trình
        tai_lieu_dau = None
        if chu_de_obj:
            tai_lieu_dau = db.query(taiLieu).filter(
                taiLieu.id_chuDe == chu_de_obj.id_chuDe
            ).order_by(taiLieu.id_taiLieu).first()

        buoc_list.append({
            "id": b.id_buocHoc,
            "thuTu": b.thuTu,
            "ten": b.mucTieu or "",
            "moTa": "",
            "trangThai": trang_thai_text,
            "tienDo": tien_do_thuc,
            "id_chuDe": b.id_chuDe,
            "id_tai_lieu": tai_lieu_dau.id_taiLieu if tai_lieu_dau else None,
            "thoiGianUocTinh": "1-2 tuan",
            "chuDe": chu_de_obj.ten_chuDe if chu_de_obj else "",
            "chuDeColor": "bg-blue-600",
            "kyNangs": [],
        })

    tien_do_ky_nang = []
    ky_nangs = db.query(kyNang).join(chuDe).filter(
        chuDe.id_chuDe.in_([b.id_chuDe for b in buocs if b.id_chuDe])
    ).all()

    for kn in ky_nangs[:6]:
        td = db.query(tienDoKyNang).filter(
            tienDoKyNang.id_ngDung == user.id_ngDung,
            tienDoKyNang.id_kyNang == kn.id_kyNang,
        ).first()

        tien_do_ky_nang.append({
            "tenKyNang": kn.tenKyNang,
            "mucDoThanhThao": round(td.mucDoThanhThao) if td and td.mucDoThanhThao else 0,
            "trangThai": td.trangThai if td else "chua_bat_dau",
        })

    return {
        "id_loTrinh": lt.id_loTrinh,
        "mucTieu": lt.mucTieu,
        "capDo": "co_ban",
        "thoiGianMoiTuan": 10,
        "trangThai": "dang_hoc",
        "tongBuoc": tong,
        "daXong": da_xong,
        "pctTong": pct,
        "buocHocs": buoc_list,
        "tienDoKyNang": tien_do_ky_nang if tien_do_ky_nang else [
            {"tenKyNang": "Kien thuc ly thuyet", "mucDoThanhThao": 0, "trangThai": "chua_bat_dau"},
            {"tenKyNang": "Giai bai tap", "mucDoThanhThao": 0, "trangThai": "chua_bat_dau"},
        ],
    }


@router.post("/tao-moi")
def tao_lo_trinh(
    req: TaoLoTrinhRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from services.ai_service import hoi_gia_su

    chu_des = db.query(chuDe).filter(chuDe.id_chuDe.in_(req.mon_hoc_ids)).all()
    if not chu_des:
        raise HTTPException(400, "Khong tim thay mon hoc nao")

    ds_mon = ", ".join(f'"{c.ten_chuDe}" (id={c.id_chuDe})' for c in chu_des)
    cap_do_text = {"moi_bat_dau": "moi bat dau", "co_ban": "co ban", "nang_cao": "nang cao"}.get(req.cap_do, "co ban")

    prompt = (
        f'Hoc sinh trinh do "{cap_do_text}", muc tieu: "{req.muc_tieu}", '
        f'cam ket {req.thoi_gian_moi_tuan} gio/tuan.\n'
        f'Cac mon hoc: {ds_mon}\n\n'
        f'Tao lo trinh hoc gom 4-8 buoc, moi buoc gan voi 1 id_chu_de tu danh sach tren.\n'
        f'Tra ve JSON array, moi phan tu co: "thu_tu" (int), "id_chu_de" (int), "muc_tieu" (string mo ta buoc hoc), "mo_ta" (string giai thich ngan), "thoi_gian_uoc_tinh" (string vd "1 tuan").\n'
        f'Chi tra JSON array, KHONG giai thich gi them.\n'
        f'Vi du: [{{"thu_tu":1,"id_chu_de":1,"muc_tieu":"Nam vung kien thuc nen","mo_ta":"On tap lai khai niem co ban","thoi_gian_uoc_tinh":"1 tuan"}}]'
    )

    try:
        ai_text = hoi_gia_su(prompt)
        start = ai_text.find("[")
        end = ai_text.rfind("]") + 1
        if start == -1 or end == 0:
            raise ValueError()
        buoc_data = json.loads(ai_text[start:end])
    except Exception:
        buoc_data = []
        thu_tu = 1
        for c in chu_des:
            if req.cap_do == "moi_bat_dau":
                steps = [
                    {"muc_tieu": f"Kien thuc nen {c.ten_chuDe}", "mo_ta": "On tap khai niem co ban"},
                    {"muc_tieu": f"Luyen tap {c.ten_chuDe} co ban", "mo_ta": "Giai bai tap tu de den trung binh"},
                    {"muc_tieu": f"{c.ten_chuDe} nang cao", "mo_ta": "Bai tap van dung cao"},
                ]
            elif req.cap_do == "nang_cao":
                steps = [
                    {"muc_tieu": f"{c.ten_chuDe} nang cao", "mo_ta": "Phan tich de thi cac nam truoc"},
                    {"muc_tieu": f"Luyen de {c.ten_chuDe}", "mo_ta": "Lam de thi thu, ren toc do"},
                ]
            else:
                steps = [
                    {"muc_tieu": f"On tap {c.ten_chuDe}", "mo_ta": "Cung co kien thuc co ban"},
                    {"muc_tieu": f"Luyen tap {c.ten_chuDe}", "mo_ta": "Giai bai tap va lam de"},
                ]
            for s in steps:
                buoc_data.append({
                    "thu_tu": thu_tu,
                    "id_chu_de": c.id_chuDe,
                    "muc_tieu": s["muc_tieu"],
                    "mo_ta": s["mo_ta"],
                    "thoi_gian_uoc_tinh": "1-2 tuan",
                })
                thu_tu += 1

    lt = loTrinh(id_ngDung=user.id_ngDung, mucTieu=req.muc_tieu)
    db.add(lt)
    db.commit()
    db.refresh(lt)

    buoc_list = []
    chu_de_map = {c.id_chuDe: c for c in chu_des}
    colors = ["bg-blue-600", "bg-violet-600", "bg-emerald-600", "bg-amber-500", "bg-pink-500", "bg-red-500"]

    for i, b in enumerate(buoc_data):
        id_cd = b.get("id_chu_de", chu_des[0].id_chuDe if chu_des else 1)
        buoc = buocHoc(
            id_loTrinh=lt.id_loTrinh,
            id_chuDe=id_cd,
            thuTu=b.get("thu_tu", i + 1),
            mucTieu=b.get("muc_tieu", ""),
            trangThai=1 if i == 0 else 0,
        )
        db.add(buoc)
        db.flush()

        cd_obj = chu_de_map.get(id_cd)
        buoc_list.append({
            "id": buoc.id_buocHoc,
            "id_chuDe": id_cd,
            "thuTu": buoc.thuTu,
            "ten": buoc.mucTieu,
            "moTa": b.get("mo_ta", ""),
            "trangThai": "chua_mo",
            "tienDo": 0,
            "thoiGianUocTinh": b.get("thoi_gian_uoc_tinh", "1-2 tuan"),
            "chuDe": cd_obj.ten_chuDe if cd_obj else "",
            "chuDeColor": colors[i % len(colors)],
            "kyNangs": [
                {"ten": "Kien thuc ly thuyet", "mucDoThanhThao": 0},
                {"ten": "Giai bai tap", "mucDoThanhThao": 0},
                {"ten": "Phan tich de", "mucDoThanhThao": 0},
            ],
        })

    db.commit()

    return {
        "id_loTrinh": lt.id_loTrinh,
        "mucTieu": lt.mucTieu,
        "capDo": req.cap_do,
        "thoiGianMoiTuan": req.thoi_gian_moi_tuan,
        "trangThai": "dang_hoc",
        "tongBuoc": len(buoc_list),
        "daXong": 0,
        "pctTong": 0,
        "buocHocs": buoc_list,
        "tienDoKyNang": [
            {"tenKyNang": "Kien thuc ly thuyet", "mucDoThanhThao": 0, "trangThai": "chua_bat_dau"},
            {"tenKyNang": "Giai bai tap", "mucDoThanhThao": 0, "trangThai": "chua_bat_dau"},
            {"tenKyNang": "Phan tich de", "mucDoThanhThao": 0, "trangThai": "chua_bat_dau"},
            {"tenKyNang": "Toc do lam bai", "mucDoThanhThao": 0, "trangThai": "chua_bat_dau"},
        ],
    }


@router.put("/buoc-hoc/{id_buoc_hoc}")
def cap_nhat_buoc_hoc(
    id_buoc_hoc: int,
    req: CapNhatBuocHocRequest,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    buoc = db.query(buocHoc).filter(buocHoc.id_buocHoc == id_buoc_hoc).first()
    if not buoc:
        raise HTTPException(404, "Khong tim thay buoc hoc")

    lt = db.query(loTrinh).filter(
        loTrinh.id_loTrinh == buoc.id_loTrinh,
        loTrinh.id_ngDung == user.id_ngDung,
    ).first()
    if not lt:
        raise HTTPException(403, "Khong co quyen")

    buoc.trangThai = req.trang_thai
    db.commit()

    trang_thai_text = {0: "chua_mo", 1: "dang_hoc", 2: "hoan_thanh"}.get(req.trang_thai, "chua_mo")
    return {"thong_bao": "Cap nhat thanh cong", "trang_thai": trang_thai_text}


@router.delete("/{id_lo_trinh}")
def xoa_lo_trinh(
    id_lo_trinh: int,
    user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    lt = db.query(loTrinh).filter(
        loTrinh.id_loTrinh == id_lo_trinh,
        loTrinh.id_ngDung == user.id_ngDung,
    ).first()
    if not lt:
        raise HTTPException(404, "Khong tim thay lo trinh")

    db.query(buocHoc).filter(buocHoc.id_loTrinh == id_lo_trinh).delete()
    db.delete(lt)
    db.commit()
    return {"thong_bao": "Da xoa lo trinh"}
