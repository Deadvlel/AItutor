from sqlalchemy import  Column, Integer, String, Text, ForeignKey, DateTime, Float, Boolean, SmallInteger
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class chuDe(Base):
    __tablename__ = "chuDe"

    id_chuDe  = Column(Integer, primary_key=True, index=True)
    ten_chuDe = Column(String(255), nullable=False)

    tai_lieus = relationship("taiLieu", back_populates="chu_de")
    ky_nangs  = relationship("kyNang",  back_populates="chu_de")

class taiLieu(Base):
    __tablename__ = "taiLieu"

    id_taiLieu     = Column(Integer, primary_key=True, index=True)
    id_ngDung      = Column(Integer, ForeignKey("ngDung.id_ngDung"), nullable=True)
    id_chuDe       = Column(Integer, ForeignKey("chuDe.id_chuDe"))
    tieuDe         = Column(String(255))
    file           = Column(String(500), nullable=True)   
    link           = Column(String(500), nullable=True)
    loai           = Column(String(50))   
    mucDoKho       = Column(Integer, default=1)           
    thoiGianDuKien = Column(Integer, nullable=True)       

    chu_de   = relationship("chuDe",  back_populates="tai_lieus")
    cau_hois = relationship("cauHoi", back_populates="tai_lieu")


class loaiCauHoi(Base):
    __tablename__ = "loaiCauHoi"

    id_loaiCauHoi = Column(Integer, primary_key=True, index=True)
    tenLoai       = Column(String(100), nullable=False)
    moTa          = Column(String(255), nullable=True)


class cauHoi(Base):
    __tablename__ = "cauHoi" 

    id_cauHoi      = Column(Integer, primary_key=True, index=True)
    id_baiKiemTra  = Column(Integer, ForeignKey("baiKiemTra.id_baiKiemTra"), nullable=True)
    id_chuDe       = Column(Integer, ForeignKey("chuDe.id_chuDe"),           nullable=True)
    id_taiLieu     = Column(Integer, ForeignKey("taiLieu.id_taiLieu"),       nullable=True)
    id_loaiCauHoi  = Column(Integer, ForeignKey("loaiCauHoi.id_loaiCauHoi"), nullable=True)
    noiDung        = Column(Text)
    dapAnMau       = Column(Text, nullable=True) 
    loiGiaiThich   = Column(Text, nullable=True)
    goiY           = Column(Text, nullable=True)
    thuTu          = Column(Integer, default=1)

    tai_lieu = relationship("taiLieu", back_populates="cau_hois")
    dap_ans  = relationship("dapAn", back_populates="cau_hoi")

class dapAn(Base):
    __tablename__ = "dapAn" 

    id_dapAn     = Column(Integer, primary_key=True, index=True)
    id_cauHoi    = Column(Integer, ForeignKey("cauHoi.id_cauHoi"))
    noiDungDapAn = Column(Text)
    laDapAnDung  = Column(Boolean, default=False)

    cau_hoi = relationship("cauHoi", back_populates="dap_ans")


class baiKiemTra(Base):
    __tablename__ = "baiKiemTra"

    id_baiKiemTra = Column(Integer, primary_key=True, index=True)
    id_ngDung     = Column(Integer, ForeignKey("ngDung.id_ngDung"))
    id_taiLieu    = Column(Integer, ForeignKey("taiLieu.id_taiLieu"), nullable=True)
    tieuDe        = Column(String(255))
    diemSo        = Column(Float, nullable=True)
    ngayTao       = Column(DateTime, default=datetime.utcnow)

class chiTietKiemTra(Base):
    __tablename__ = "chiTietKiemTra"

    id_chiTietKT  = Column(Integer, primary_key=True, index=True)
    id_baiKiemTra = Column(Integer, ForeignKey("baiKiemTra.id_baiKiemTra"))
    id_cauHoi     = Column(Integer, ForeignKey("cauHoi.id_cauHoi"))
    id_dapAnChon  = Column(Integer, ForeignKey("dapAn.id_dapAn"), nullable=True)
    la_Dung       = Column(Boolean, default=False)

class cauTraLoi(Base):
    __tablename__ = "cauTraLoi"

    id_cauTraLoi  = Column(Integer, primary_key=True, index=True)
    id_lsIKT      = Column(Integer, ForeignKey("lichSuLamKT.id_lsIKT"))
    id_dapAn      = Column(Integer, ForeignKey("dapAn.id_dapAn"), nullable=True)
    noiDungTuLuan = Column(Text, nullable=True)   # câu trả lời tự luận / voice
    ketQua        = Column(Boolean, default=False)


class lichSuLamKT(Base):
    __tablename__ = "lichSuLamKT"

    id_lsIKT      = Column(Integer, primary_key=True, index=True)
    id_baiKiemTra = Column(Integer, ForeignKey("baiKiemTra.id_baiKiemTra"), nullable=True)
    id_ngDung     = Column(Integer, ForeignKey("ngDung.id_ngDung"))
    diem          = Column(Float)
    xepLoai       = Column(SmallInteger, nullable=True) 
    tg_batDau     = Column(DateTime, default=datetime.utcnow)
    tg_ketThuc    = Column(DateTime, default=datetime.utcnow)

class kyNang(Base):
    __tablename__ = "kyNang"

    id_kyNang   = Column(Integer, primary_key=True, index=True)
    id_chuDe    = Column(Integer, ForeignKey("chuDe.id_chuDe"))
    tenKyNang   = Column(String(255))
    ngayCapNhap = Column(DateTime, default=datetime.utcnow)

    chu_de = relationship("chuDe", back_populates="ky_nangs")

class tienDoKyNang(Base):
    __tablename__ = "tienDoKyNang"

    id_tienDo      = Column(Integer, primary_key=True, index=True)
    id_ngDung      = Column(Integer, ForeignKey("ngDung.id_ngDung"))
    id_kyNang      = Column(Integer, ForeignKey("kyNang.id_kyNang"))
    diemDanhGia    = Column(Float, nullable=True)
    ngayDanhGia    = Column(DateTime, default=datetime.utcnow)
    trangThai      = Column(String(50), nullable=True) 
    mucDoThanhThao = Column(Float, nullable=True)         


class loTrinh(Base):
    __tablename__ = "loTrinh"

    id_loTrinh = Column(Integer, primary_key=True, index=True)
    id_ngDung  = Column(Integer, ForeignKey("ngDung.id_ngDung"))
    mucTieu    = Column(String(255))

    buoc_hocs = relationship("buocHoc", back_populates="lo_trinh")

class buocHoc(Base):
    __tablename__ = "buocHoc"

    id_buocHoc = Column(Integer, primary_key=True, index=True)
    id_loTrinh = Column(Integer, ForeignKey("loTrinh.id_loTrinh"))
    id_chuDe   = Column(Integer, ForeignKey("chuDe.id_chuDe"))
    trangThai  = Column(Integer, default=0)  
    thuTu      = Column(Integer, default=1)
    mucTieu    = Column(String(255), nullable=True)

    lo_trinh = relationship("loTrinh", back_populates="buoc_hocs")

class aiGoiY(Base):
    __tablename__ = "aiGoiY"

    id_goiY     = Column(Integer, primary_key=True, index=True)
    id_ngDung   = Column(Integer, ForeignKey("ngDung.id_ngDung"))
    id_chuDe    = Column(Integer, ForeignKey("chuDe.id_chuDe"),     nullable=True)
    id_taiLieu  = Column(Integer, ForeignKey("taiLieu.id_taiLieu"), nullable=True)
    noiDungGoiY = Column(Text)
    trangThai   = Column(Boolean, default=False)
    ngayTao     = Column(DateTime, default=datetime.utcnow)
    diemTinCay  = Column(Integer, default=50)   # 0-100

class aiLog(Base):
    __tablename__ = "aiLog"

    id_log        = Column(Integer, primary_key=True, index=True)
    id_ngDung     = Column(Integer, ForeignKey("ngDung.id_ngDung"))
    loaiHanhDong  = Column(String(100))
    noiDungInput  = Column(Text)
    noiDungOutput = Column(Text)
    thoiGian      = Column(DateTime, default=datetime.utcnow)
