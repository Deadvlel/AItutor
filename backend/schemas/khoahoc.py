from pydantic import BaseModel

class HuongDanRequest(BaseModel):
    id_tai_lieu: int
    buoc_hien_tai: int = 1
    cau_hoi_hoc_sinh: str = ""

class TraViTriRequest(BaseModel):
    tu_khoa: str
    ten_mon: str = ""

class GhiTienDoRequest(BaseModel):
    id_tai_lieu: int
    da_hoc_xong: bool = False