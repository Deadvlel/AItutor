from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from database import Base


class ngDung(Base):
    __tablename__ = "ngDung"

    id_ngDung = Column(Integer, primary_key=True, index=True)
    email     = Column(String(255), unique=True, index=True, nullable=False)
    mat_khau  = Column(String(255), nullable=False)
    auth      = Column(String(50))
    full_name = Column(String(255))

    cuoc_tro_chuyen = relationship("cuocTroChuyen", back_populates="nguoi_dung")
