from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from dependencies import get_current_user
from schemas.conversation import TaoMoiRequest, GuiTinRequest
from services import conversation_service

router = APIRouter()


@router.get("/lich-su")
def lay_lich_su(user=Depends(get_current_user), db: Session = Depends(get_db)):
    return conversation_service.lay_lich_su(db, user.id_ngDung)


@router.post("/tao-moi")
def tao_cuoc_moi(req: TaoMoiRequest, user=Depends(get_current_user), db: Session = Depends(get_db)):
    return conversation_service.tao_cuoc_moi(db, user.id_ngDung, req.tieu_de)


@router.get("/{id_cuoc}/tin-nhan")
def lay_tin_nhan(id_cuoc: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    # Kiểm tra quyền truy cập
    from models import cuocTroChuyen
    cuoc = db.query(cuocTroChuyen).filter(
        cuocTroChuyen.id_cuocTroChuyen == id_cuoc,
        cuocTroChuyen.id_ngDung == user.id_ngDung,
    ).first()
    if not cuoc:
        raise HTTPException(status_code=404, detail="Không tìm thấy cuộc trò chuyện")
    return conversation_service.lay_tin_nhan(db, id_cuoc)


@router.post("/gui")
def gui_tin_nhan(req: GuiTinRequest, user=Depends(get_current_user), db: Session = Depends(get_db)):
    result = conversation_service.gui_tin(db, user.id_ngDung, req.id_cuoc_tro_chuyen, req.noi_dung)
    if result is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy cuộc trò chuyện")
    return result


@router.delete("/{id_cuoc}")
def xoa_cuoc(id_cuoc: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    if not conversation_service.xoa_cuoc(db, user.id_ngDung, id_cuoc):
        raise HTTPException(status_code=404, detail="Không tìm thấy cuộc trò chuyện")
    return {"ok": True}
