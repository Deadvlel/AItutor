from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from database import get_db
from dependencies import get_current_user
from models.khoahoc import lichSuLamKT, tienDoKyNang, kyNang

router = APIRouter()


@router.get("")
def lay_thong_ke(user=Depends(get_current_user), db: Session = Depends(get_db)):
    id_user = user.id_ngDung
    now = datetime.utcnow()
    tuan_truoc = now - timedelta(days=7)

    tong_bai = db.query(lichSuLamKT).filter(
        lichSuLamKT.id_ngDung == id_user
    ).count()

    bai_tuan_nay = db.query(lichSuLamKT).filter(
        lichSuLamKT.id_ngDung == id_user,
        lichSuLamKT.tg_batDau >= tuan_truoc,
    ).count()

    diem_tb_row = db.query(func.avg(lichSuLamKT.diem)).filter(
        lichSuLamKT.id_ngDung == id_user
    ).scalar()
    diem_tb = round(float(diem_tb_row), 1) if diem_tb_row else 0

    diem_tb_truoc = db.query(func.avg(lichSuLamKT.diem)).filter(
        lichSuLamKT.id_ngDung == id_user,
        lichSuLamKT.tg_batDau < tuan_truoc,
    ).scalar()
    diem_tb_truoc = round(float(diem_tb_truoc), 1) if diem_tb_truoc else diem_tb
    xu_huong_diem = round(diem_tb - diem_tb_truoc, 1)

    hoat_dong_7_ngay = []
    for i in range(7):
        ngay = now - timedelta(days=6 - i)
        ngay_start = ngay.replace(hour=0, minute=0, second=0)
        ngay_end = ngay.replace(hour=23, minute=59, second=59)
        so_bai = db.query(lichSuLamKT).filter(
            lichSuLamKT.id_ngDung == id_user,
            lichSuLamKT.tg_batDau >= ngay_start,
            lichSuLamKT.tg_batDau <= ngay_end,
        ).count()
        hoat_dong_7_ngay.append({
            "ngay": ngay.strftime("%a"),
            "so_bai": so_bai,
            "la_hom_nay": i == 6,
        })

    lich_su = db.query(lichSuLamKT).filter(
        lichSuLamKT.id_ngDung == id_user
    ).order_by(lichSuLamKT.tg_batDau.desc()).limit(5).all()

    hoat_dong_gan_day = []
    for ls in lich_su:
        delta = now - ls.tg_batDau if ls.tg_batDau else timedelta(0)
        if delta.days == 0:
            thoi_gian = f"Hom nay, {ls.tg_batDau.strftime('%H:%M')}" if ls.tg_batDau else "Hom nay"
        elif delta.days == 1:
            thoi_gian = "Hom qua"
        else:
            thoi_gian = f"{delta.days} ngay truoc"

        hoat_dong_gan_day.append({
            "tieu_de": "Bai kiem tra",
            "thoi_gian": thoi_gian,
            "diem": ls.diem,
        })

    tien_do = db.query(
        kyNang.tenKyNang,
        tienDoKyNang.mucDoThanhThao,
        tienDoKyNang.trangThai,
    ).join(kyNang, tienDoKyNang.id_kyNang == kyNang.id_kyNang).filter(
        tienDoKyNang.id_ngDung == id_user
    ).limit(6).all()

    ky_nang_list = [
        {
            "ten": td[0],
            "muc_do": round(td[1]) if td[1] else 0,
            "trang_thai": td[2] or "chua_bat_dau",
        }
        for td in tien_do
    ]

    return {
        "tong_bai": tong_bai,
        "bai_tuan_nay": bai_tuan_nay,
        "diem_trung_binh": diem_tb,
        "xu_huong_diem": xu_huong_diem,
        "hoat_dong_7_ngay": hoat_dong_7_ngay,
        "hoat_dong_gan_day": hoat_dong_gan_day,
        "ky_nang": ky_nang_list,
    }
