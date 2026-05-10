from pydantic import BaseModel, EmailStr


class DangKyRequest(BaseModel):
    full_name: str
    email:     EmailStr
    mat_khau:  str


class DangNhapRequest(BaseModel):
    email:    EmailStr
    mat_khau: str


class TokenResponse(BaseModel):
    access_token: str
    token_type:   str
    full_name:    str
    email:        str


class UserResponse(BaseModel):
    id:        int
    full_name: str
    email:     str

    class Config:
        from_attributes = True
