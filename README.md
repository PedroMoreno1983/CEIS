# CEIS — Generador de Instrumentos

Sistema para gestionar y generar automáticamente ítems de las baterías de orientación vocacional CEIS Maristas, en sus cuatro niveles educativos.

## Arquitectura

- **Backend**: FastAPI + SQLAlchemy async + PostgreSQL
- **Frontend**: React + TypeScript + Vite + Tailwind
- **LLM**: Anthropic Claude (configurable vía `LLM_MODEL`)

## Niveles e instrumentos

| Nivel | Edad | Instrumentos generables |
|-------|------|-------------------------|
| 5°-6° Básico | 10-12 | Razonamiento verbal, vocabulario, razonamiento numérico, habilidad numérica, inteligencia práctica, intereses, personalidad, adaptación-motivación, hábitos de estudio |
| 8° Básico | 13-14 | Idem |
| 2° Medio | 15-16 | + comprensión lectora, rapidez lectora |
| 4° Medio | 17-18 | Idem |

## Estructura del proyecto

```
sistema/
├── backend/              FastAPI
│   ├── app/
│   │   ├── core/         config, database
│   │   ├── models/       SQLAlchemy
│   │   ├── schemas/      Pydantic
│   │   ├── routers/      items, generación, instrumentos
│   │   ├── services/     prompts y servicio LLM
│   │   └── main.py
│   ├── requirements.txt
│   └── run.py
├── database/             SQL
│   ├── 01_schema.sql
│   ├── 02_seed_5to6to.sql
│   ├── 03_seed_8basico.sql
│   ├── 04_seed_2medio.sql
│   └── 05_seed_4medio.sql
└── frontend/             React + Vite
    └── src/
        ├── pages/        BankPage, GeneratorPage
        ├── components/   ItemCard
        ├── api.ts
        ├── types.ts
        ├── App.tsx
        └── main.tsx
```

## Instalación

### 1. Base de datos

```powershell
# Crear base de datos
psql -U postgres -c "CREATE DATABASE ceis_instrumentos;"

# Aplicar esquema y semillas (en orden)
psql -U postgres -d ceis_instrumentos -f database/01_schema.sql
psql -U postgres -d ceis_instrumentos -f database/02_seed_5to6to.sql
psql -U postgres -d ceis_instrumentos -f database/03_seed_8basico.sql
psql -U postgres -d ceis_instrumentos -f database/04_seed_2medio.sql
psql -U postgres -d ceis_instrumentos -f database/05_seed_4medio.sql
```

### 2. Backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Copiar y editar .env
Copy-Item .env.example .env
# Editar .env con tu ANTHROPIC_API_KEY y credenciales de BD

python run.py
# API en http://localhost:8001
# Docs interactivas en http://localhost:8001/docs
```

### 3. Frontend

```powershell
cd frontend
npm install
npm run dev
# UI en http://localhost:5174
```

## Uso

1. Abrir http://localhost:5174.
2. **Banco**: ver, filtrar y revisar todos los ítems (originales y generados).
3. **Generar**: escoger nivel + tipo + cantidad y presionar "Generar". El LLM produce ítems siguiendo el formato de la batería original. Los ítems quedan en estado `borrador` y deben ser aprobados manualmente.

## API principal

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/items` | Listar ítems con filtros (nivel, tipo, estado, origen) |
| GET | `/api/items/{id}` | Obtener un ítem |
| PATCH | `/api/items/{id}` | Actualizar (cambio de estado, edición) |
| DELETE | `/api/items/{id}` | Eliminar |
| POST | `/api/generar` | Generar nuevos ítems con LLM |
| GET | `/api/instrumentos` | Listar instrumentos ensamblados |
| POST | `/api/instrumentos` | Crear instrumento desde un set de ítems |

## Flujo de trabajo recomendado

1. **Generar** en lotes pequeños (3-5 ítems por solicitud) para revisar calidad.
2. **Revisar** cada ítem en el banco: validar enunciado, opciones, respuesta correcta y constructo.
3. **Aprobar** los buenos y **rechazar** los descartados.
4. **Ensamblar instrumentos** combinando ítems aprobados (vía API por ahora).

## Limitaciones conocidas

- La generación depende de la calidad del LLM y los prompts; siempre requiere revisión humana antes de aplicar.
- No hay validación psicométrica empírica (índices de discriminación, dificultad real) — se asignan valores propuestos por el LLM.
- El banco semilla no es exhaustivo: contiene ítems representativos de cada categoría, no la batería completa.
