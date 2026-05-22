from datetime import timedelta
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy import select, text, func
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..core.security import verify_password, create_access_token, decode_access_token, get_password_hash
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


@router.post("/auth/setup")
@router.get("/auth/setup")
async def setup_admin(db: AsyncSession = Depends(get_db)):
    """Crea el usuario admin inicial si no existe ningún usuario en la BD.
    También crea la tabla usuario (y el tipo enum) si no existen."""
    try:
        # Verificar si la tabla existe
        check_sql = text("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables
                WHERE table_schema = 'public'
                AND table_name = 'usuario'
            )
        """)
        result = await db.execute(check_sql)
        table_exists = result.scalar_one()

        if not table_exists:
            # Crear tipo enum si no existe
            await db.execute(text("""
                DO $$
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'rol_usuario') THEN
                        CREATE TYPE rol_usuario AS ENUM ('admin', 'directivo', 'orientador', 'docente', 'apoderado');
                    END IF;
                END $$;
            """))
            # Crear tabla sin constraints de FK (por si gestion.colegio/docente no existen aún)
            await db.execute(text("""
                CREATE TABLE public.usuario (
                    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                    email TEXT NOT NULL UNIQUE,
                    password_hash TEXT NOT NULL,
                    nombres TEXT NOT NULL,
                    apellido_paterno TEXT NOT NULL,
                    apellido_materno TEXT,
                    rol rol_usuario NOT NULL DEFAULT 'docente',
                    colegio_id UUID,
                    docente_id UUID,
                    activo BOOLEAN NOT NULL DEFAULT TRUE,
                    ultimo_acceso TIMESTAMPTZ,
                    creado_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
                )
            """))
            await db.commit()

        result = await db.execute(select(func.count()).select_from(Usuario))
        count = result.scalar_one()
        if count > 0:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Ya existen usuarios en el sistema",
            )
        user = Usuario(
            email="admin@ceis.cl",
            password_hash=get_password_hash("ceis2026"),
            nombres="Administrador",
            apellido_paterno="CEIS",
            rol="admin",
            activo=True,
        )
        db.add(user)
        await db.commit()
        return {"ok": True, "email": user.email, "message": "Usuario admin creado"}
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        return {"ok": False, "error": str(e), "traceback": traceback.format_exc()}


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

    access_token = create_access_token(data={"sub": str(user.id), "rol": user.rol})

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
