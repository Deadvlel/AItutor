import sys
sys.path.insert(0, ".")
from database import SessionLocal
from models.course import loaiCauHoi

db = SessionLocal()

loai_1 = db.query(loaiCauHoi).filter(loaiCauHoi.id_loaiCauHoi == 1).first()
if not loai_1:
    db.add(loaiCauHoi(tenLoai="Trắc nghiệm", moTa="Câu hỏi chọn A/B/C/D"))
    print("Tạo loại: Trắc nghiệm")

loai_2 = db.query(loaiCauHoi).filter(loaiCauHoi.id_loaiCauHoi == 2).first()
if not loai_2:
    db.add(loaiCauHoi(tenLoai="Tự luận", moTa="Câu hỏi dò bài, trả lời bằng miệng/text"))
    print("Tạo loại: Tự luận")

db.commit()
db.close()
print("Xong!")
