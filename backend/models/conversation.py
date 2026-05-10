from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class cuocTroChuyen(Base):
    __tablename__ = "cuocTroChuyen"

    id_cuocTroChuyen = Column(Integer, primary_key=True, index=True)
    id_ngDung        = Column(Integer, ForeignKey("ngDung.id_ngDung"))
    tieuDe           = Column(String(255))
    ngayTao          = Column(DateTime, default=datetime.utcnow)

    nguoi_dung = relationship("ngDung", back_populates="cuoc_tro_chuyen")
    tin_nhan   = relationship("tinNhan", back_populates="cuoc_tro_chuyen")


class tinNhan(Base):
    __tablename__ = "tinNhan"

    id_tinNhan       = Column(Integer, primary_key=True, index=True)
    id_cuocTroChuyen = Column(Integer, ForeignKey("cuocTroChuyen.id_cuocTroChuyen"))
    noiDung          = Column(Text)
    anh              = Column(String(20), nullable=True)   # "user" | "assistant"
    ngayTao          = Column(DateTime, default=datetime.utcnow)

    cuoc_tro_chuyen = relationship("cuocTroChuyen", back_populates="tin_nhan")
