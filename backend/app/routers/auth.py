from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..core.security import verify_password, create_access_token, decode_access_token
from ..models.usuario import Usuario

router = APIRouter(tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    usuario: dict


class UsuarioOut(BaseModel):
    id: str
    email: str
    nombres: str
    apellido_paterno: str
    rol: str
    colegio_id: str | None

    class Config:
        from_attributes = True


async def get_current_usuario(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: AsyncSession = Depends(get_db),
) -> Usuario:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales inválidas",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    user_id: str | None = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    result = await db.execute(select(Usuario).where(Usuario.id == user_id, Usuario.activo == True))
    user = result.scalar_one_or_none()
    if user is None:
        raise credentials_exception
    return user


@router.post("/auth/login", response_model=Token)
async def login(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Usuario).where(Usuario.email == form_data.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": str(user.id)})

    return Token(
        access_token=access_token,
        usuario={
            "id": str(user.id),
            "email": user.email,
            "nombres": user.nombres,
            "apellido_paterno": user.apellido_paterno,
            "rol": user.rol,
            "colegio_id": str(user.colegio_id) if user.colegio_id else None,
        },
    )


@router.get("/auth/me", response_model=UsuarioOut)
async def read_me(current_user: Annotated[Usuario, Depends(get_current_usuario)]):
    return current_user
