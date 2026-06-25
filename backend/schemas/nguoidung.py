from pydantic import BaseModel, EmailStr


class DangKyRequest(BaseModel):
    full_name: str
    email:     EmailStr
    mat_khau:  str


class DangNhapRequest(BaseModel):
    email:    EmailStr
    mat_khau: str


class CapNhatRequest(BaseModel):
    full_name:    str | None = None
    email:        EmailStr | None = None
    mat_khau_cu:  str | None = None
    mat_khau_moi: str | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type:   str
    full_name:    str
    email:        str
    vai_tro:      str = "hoc_sinh"


class UserResponse(BaseModel):
    id:        int
    full_name: str
    email:     str
    vai_tro:   str = "hoc_sinh"

    class Config:
        from_attributes = True
