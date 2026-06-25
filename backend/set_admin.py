import sys
sys.path.insert(0, ".")
from database import SessionLocal
from models import ngDung

db = SessionLocal()
user = db.query(ngDung).filter(ngDung.id_ngDung == 1).first()
if user:
    user.vaiTro = "admin"
    db.commit()
    print(f"Da set admin cho: {user.full_name} ({user.email})")
else:
    print("Khong tim thay user id=1")
db.close()
