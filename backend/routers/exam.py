import json
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
from dependencies import get_current_user
from schemas.exam import TaoDeThiRequest, NopBaiRequest
from services import exam_service

router = APIRouter()


@router.post("/tao-de")
def tao_de_thi(req: TaoDeThiRequest, user=Depends(get_current_user), db: Session = Depends(get_db)):
    try:
        return exam_service.tao_de(db, user.id_ngDung, req.chu_de, req.so_cau, req.do_kho)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI trả về dữ liệu không hợp lệ, thử lại")
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))


@router.post("/nop-bai")
def nop_bai(req: NopBaiRequest, user=Depends(get_current_user), db: Session = Depends(get_db)):
    result = exam_service.cham_diem(db, user.id_ngDung, req.id_kiem_tra, req.cau_tra_loi)
    if result is None:
        raise HTTPException(status_code=404, detail="Không tìm thấy bài kiểm tra")
    return result


@router.get("/lich-su")
def lay_lich_su_thi(user=Depends(get_current_user), db: Session = Depends(get_db)):
    return exam_service.lay_lich_su_thi(db, user.id_ngDung)
