from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from datetime import datetime
from database import Base


class chuDe(Base):
    __tablename__ = "chuDe"

    id_chuDe   = Column(Integer, primary_key=True, index=True)
    ten_chuDe  = Column(String(255), nullable=False) 


class taiLieu(Base):
    __tablename__ = "taiLieu"

    id_taiLieu      = Column(Integer, primary_key=True, index=True)
    id_ngDung       = Column(Integer, nullable=True)
    id_chuDe        = Column(Integer, ForeignKey("chuDe.id_chuDe"))
    tieuDe          = Column(String(255))  
    file            = Column(String(255), nullable=True)
    link            = Column(String(255), nullable=True)
    loai            = Column(String(50)) 
    mucDoKho        = Column(Integer, default=1)
    thoiGianDuKien  = Column(Integer, nullable=True)


class cauHoiDoBai(Base):
    """Câu hỏi dò bài — tách riêng khỏi cauHoi của kiemTra"""
    __tablename__ = "cauHoiDoBai"

    id          = Column(Integer, primary_key=True, index=True)
    id_taiLieu  = Column(Integer, ForeignKey("taiLieu.id_taiLieu"))
    cau_hoi     = Column(Text)   
    dap_an_mau  = Column(Text)    
    goi_y       = Column(Text, nullable=True)  
    thu_tu      = Column(Integer, default=1)   


class ketQuaDoBai(Base):
    """Lưu kết quả mỗi lần dò bài"""
    __tablename__ = "ketQuaDoBai"

    id             = Column(Integer, primary_key=True, index=True)
    id_ngDung      = Column(Integer, ForeignKey("ngDung.id_ngDung"))
    id_taiLieu     = Column(Integer, ForeignKey("taiLieu.id_taiLieu"))
    tong_cau       = Column(Integer)
    so_cau_dung    = Column(Integer)
    diem           = Column(Integer) 
    ngay_lam       = Column(DateTime, default=datetime.utcnow)
