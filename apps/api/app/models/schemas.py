from pydantic import BaseModel, EmailStr, Field, HttpUrl, field_validator


class AuthPayload(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator("email")
    @classmethod
    def require_qq_email(cls, value: str) -> str:
        if not value.lower().endswith("@qq.com"):
            raise ValueError("Only QQ email registration/login is supported for now")
        return value.lower()


class RegisterPayload(AuthPayload):
    verification_code: str = Field(min_length=4, max_length=8)


class SendCodePayload(BaseModel):
    email: EmailStr

    @field_validator("email")
    @classmethod
    def require_qq_email(cls, value: str) -> str:
        if not value.lower().endswith("@qq.com"):
            raise ValueError("Only QQ email registration is supported for now")
        return value.lower()


class SendCodeResponse(BaseModel):
    message: str
    expires_in: int
    code: str | None = None


class UserDTO(BaseModel):
    id: str
    email: EmailStr
    membership_status: str
    is_admin: bool = False


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserDTO


class VideoParseRequest(BaseModel):
    url: HttpUrl
    platform: str | None = None


class CopyRewriteRequest(BaseModel):
    text: str = Field(min_length=1)
    instruction: str = Field(min_length=1)


class ConvertRequest(BaseModel):
    source_url: HttpUrl | None = None
    target_format: str = Field(min_length=2, max_length=16)
