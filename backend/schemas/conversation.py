from pydantic import BaseModel


class TaoMoiRequest(BaseModel):
    tieu_de: str | None = None


class GuiTinRequest(BaseModel):
    id_cuoc_tro_chuyen: int
    noi_dung:           str


class TinNhanResponse(BaseModel):
    id:       int
    role:     str
    noi_dung: str
    ngay_tao: str


class CuocTroChuyenResponse(BaseModel):
    id:       int
    tieu_de:  str
    ngay_tao: str
