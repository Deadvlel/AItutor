import os
from fastapi import HTTPException, Depends, Header
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from database import get_db
from models import ngDung

SECRET_KEY = os.getenv("SECRET_KEY", "tutor_secret_key_change_this_in_production")
ALGORITHM  = "HS256"


def get_current_user(
    authorization: str = Header(...),
    db: Session = Depends(get_db)
):
    """
    Đọc JWT từ header Authorization: Bearer <token>
    Dùng chung cho tất cả router cần xác thực
    """
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Token không hợp lệ")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = int(payload.get("sub"))
    except (JWTError, ValueError, AttributeError):
        raise HTTPException(status_code=401, detail="Token không hợp lệ hoặc đã hết hạn")

    user = db.query(ngDung).filter(ngDung.id_ngDung == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Người dùng không tồn tại")
    return user
