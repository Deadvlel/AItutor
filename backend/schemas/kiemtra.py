from pydantic import BaseModel


class TaoDeThiRequest(BaseModel):
    chu_de: str
    so_cau: int = 5
    do_kho: str = "trung binh"


class NopBaiRequest(BaseModel):
    id_kiem_tra:  int
    cau_tra_loi:  list[dict]
