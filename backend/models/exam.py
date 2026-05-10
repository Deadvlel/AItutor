from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Float, Boolean
from datetime import datetime
from database import Base


class kiemTra(Base):
    __tablename__ = "kiemTra"

    id_kiemTra = Column(Integer, primary_key=True, index=True)
    id_ngDung  = Column(Integer, ForeignKey("ngDung.id_ngDung"))
    id_taiLieu = Column(Integer, nullable=True)
    tieuDe     = Column(String(255))
    diemSo     = Column(Float, nullable=True)
    ngayTao    = Column(DateTime, default=datetime.utcnow)


class cauHoi(Base):
    __tablename__ = "cauHoi"

    id_cauHoi      = Column(Integer, primary_key=True, index=True)
    id_kiemTra     = Column(Integer, ForeignKey("kiemTra.id_kiemTra"))
    id_chuDe       = Column(Integer, nullable=True)
    noiDung        = Column(Text)
    loiGiaiThich   = Column(Text)


class dapAn(Base):
    __tablename__ = "dapAn"

    id_dapAn      = Column(Integer, primary_key=True, index=True)
    id_cauHoi     = Column(Integer, ForeignKey("cauHoi.id_cauHoi"))
    noiDungDapAn  = Column(Text)
    laDapAn       = Column(Boolean)


class lichSuBaiLam(Base):
    __tablename__ = "lichSuBaiLam"

    id_lsl     = Column(Integer, primary_key=True, index=True)
    id_kiemTra = Column(Integer, ForeignKey("kiemTra.id_kiemTra"))
    id_ngDung  = Column(Integer, ForeignKey("ngDung.id_ngDung"))
    diem       = Column(Float)
    xepLoai    = Column(String(50))
    tg_batDau  = Column(DateTime, default=datetime.utcnow)
    tg_ketThuc = Column(DateTime, default=datetime.utcnow)
