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
    vaiTro    = Column(String(20), default="hoc_sinh")


    cuoc_tro_chuyen = relationship(
        "cuocTroChuyen",
        back_populates="nguoi_dung",
        cascade="all, delete-orphan",
    )
    bai_kiem_tras = relationship(
        "baiKiemTra",
        cascade="all, delete-orphan",
        foreign_keys="baiKiemTra.id_ngDung",
    )
    lich_su_lam_kts = relationship(
        "lichSuLamKT",
        cascade="all, delete-orphan",
        foreign_keys="lichSuLamKT.id_ngDung",
    )
    tien_do_ky_nangs = relationship(
        "tienDoKyNang",
        cascade="all, delete-orphan",
        foreign_keys="tienDoKyNang.id_ngDung",
    )
    lo_trinhs = relationship(
        "loTrinh",
        cascade="all, delete-orphan",
        foreign_keys="loTrinh.id_ngDung",
    )
    ai_goi_ys = relationship(
        "aiGoiY",
        cascade="all, delete-orphan",
        foreign_keys="aiGoiY.id_ngDung",
    )
    ai_logs = relationship(
        "aiLog",
        cascade="all, delete-orphan",
        foreign_keys="aiLog.id_ngDung",
    )
    thong_baos = relationship(
        "thongBao",
        cascade="all, delete-orphan",
        foreign_keys="thongBao.id_ngDung",
    )
    tai_lieus = relationship(
        "taiLieu",
        cascade="all, delete-orphan",
        foreign_keys="taiLieu.id_ngDung",
    )
