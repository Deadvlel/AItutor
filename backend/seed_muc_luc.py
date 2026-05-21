import json, sys
sys.path.insert(0, ".")

from database import SessionLocal
from models.course import chuDe, taiLieu, cauHoi

def seed(json_file: str, ten_mon: str):
    db = SessionLocal()
    try:
        mon = db.query(chuDe).filter(chuDe.ten_chuDe == ten_mon).first()
        if not mon:
            mon = chuDe(ten_chuDe=ten_mon)
            db.add(mon)
            db.flush()
            print(f"Tạo môn: {ten_mon} (id={mon.id_chuDe})")
        else:
            print(f"Môn đã có: {ten_mon} (id={mon.id_chuDe})")

        with open(json_file, encoding="utf-8") as f:
            muc_luc = json.load(f)

        muc_mon = [m for m in muc_luc if m.get("mon") == ten_mon or "mon" not in m]
        print(f"Tìm thấy {len(muc_mon)} mục cho môn {ten_mon}")

        count_tl = count_cq = 0

        for muc in muc_mon:
            cap     = muc["cap"]
            tieu_de = muc["tieu_de"].strip()
            trang   = muc.get("trang", 0)
            nd      = muc.get("noi_dung", "")

            if cap == 1:
                tl = taiLieu(
                    id_chuDe  = mon.id_chuDe,
                    tieuDe    = tieu_de,
                    loai      = "chuong",
                    mucDoKho  = 1,
                )
                db.add(tl)
                db.flush()
                count_tl += 1
                print(f"  [Chương] {tieu_de}")

            elif cap == 2:
                tl = taiLieu(
                    id_chuDe  = mon.id_chuDe,
                    tieuDe    = tieu_de,
                    loai      = "bai",
                    mucDoKho  = 1,
                )
                db.add(tl)
                db.flush()
                count_tl += 1
                print(f"    [Bài] {tieu_de}")

                if nd and len(nd) > 50:
                    cq = cauHoi(
                        id_taiLieu = tl.id_taiLieu,
                        id_chuDe   = mon.id_chuDe,
                        noiDung    = tieu_de,
                        dapAnMau   = nd[:500],
                        goiY       = f"Xem trang {trang}",
                        thuTu      = 1,
                    )
                    db.add(cq)
                    count_cq += 1

        db.commit()
        print(f"\nXong! Tài liệu: {count_tl}, Câu hỏi: {count_cq}")

    except Exception as e:
        db.rollback()
        print(f"Lỗi: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed("muc_luc.json", "Giải Tích 12")
    seed("muc_luc.json", "Ngữ Văn 12")