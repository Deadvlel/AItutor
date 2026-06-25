from pydantic import BaseModel
from typing import Optional


class TaoLoTrinhRequest(BaseModel):
    mon_hoc_ids: list[int]
    cap_do: str = "co_ban"
    muc_tieu: str
    thoi_gian_moi_tuan: int = 10


class CapNhatBuocHocRequest(BaseModel):
    trang_thai: int = 0
