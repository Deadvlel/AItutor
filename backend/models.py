from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Float, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class ngDung(Base): 
    __tablename__ = "ngDung"

    id_ngDung = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    mat_khau = Column(String(255), nullable=False)
    auth = Column(String(50)) 
    full_name = Column(String(255))

    cuoc_tro_chuyen = relationship("cuocTroChuyen", back_populates="nguoi_dung")

class cuocTroChuyen(Base): 
    __tablename__ = "cuocTroChuyen"

    id_cuocTroChuyen = Column(Integer, primary_key=True, index=True)
    id_ngDung = Column(Integer, ForeignKey("ngDung.id_ngDung"))
    tieuDe = Column(String(255))
    ngayTao = Column(DateTime, default=datetime.utcnow)

    nguoi_dung = relationship("ngDung", back_populates="cuoc_tro_chuyen")
    tin_nhan = relationship("tinNhan", back_populates="cuoc_tro_chuyen")


class tinNhan(Base): 
    __tablename__ = "tinNhan"

    id_tinNhan = Column(Integer, primary_key=True, index=True)
    id_cuocTroChuyen = Column(Integer, ForeignKey("cuocTroChuyen.id_cuocTroChuyen"))
    noiDung = Column(Text)
    anh = Column(String(255), nullable=True) 
    ngayTao = Column(DateTime, default=datetime.utcnow)

    cuoc_tro_chuyen = relationship("cuocTroChuyen", back_populates="tin_nhan")

class kiemTra(Base):
    __tablename__ = "kiemTra"

    id_kiemTra = Column(Integer, primary_key=True, index=True)
    id_ngDung = Column(Integer, ForeignKey("ngDung.id_ngDung"))
    id_taiLieu = Column(Integer, nullable=True)
    tieuDe = Column(String(255))
    diemSo = Column(Float, nullable=True)
    ngayTao = Column(DateTime, default=datetime.utcnow)

class cauHoi(Base):
    __tablename__ = "cauHoi"

    id_cauHoi = Column(Integer, primary_key=True, index=True)
    id_kiemTra = Column(Integer, ForeignKey("kiemTra.id_kiemTra"))
    id_chuDe = Column(Integer, nullable=True)
    noiDung = Column(Text)
    loiGiaiThich = Column(Text)

class dapAn(Base):
    __tablename__ = "dapAn"

    id_dapAn = Column(Integer, primary_key=True, index=True)
    id_cauHoi = Column(Integer, ForeignKey("cauHoi.id_cauHoi"))
    noiDungDapAn = Column(Text)
    laDapAn = Column(Boolean)

class lichSuBaiLam(Base):
    __tablename__ = "lichSuBaiLam"

    id_lsl = Column(Integer, primary_key=True, index=True)
    id_kiemTra = Column(Integer, ForeignKey("kiemTra.id_kiemTra"))
    id_ngDung = Column(Integer, ForeignKey("ngDung.id_ngDung"))
    diem = Column(Float)
    xepLoai = Column(String(50))
    tg_batDau = Column(DateTime, default=datetime.utcnow)
    tg_ketThuc = Column(DateTime, default=datetime.utcnow)