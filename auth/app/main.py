from fastapi import FastAPI, HTTPException
from app import schemas, crud
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Microservicio Auth")

origins = ["*"]  # Permitir cualquier frontend temporalmente
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate):
    if crud.get_user(user.username):
        raise HTTPException(status_code=400, detail="Usuario ya existe")
    return crud.create_user(user.dict())

@app.post("/login")
def login(user: schemas.UserLogin):
    db_user = crud.get_user(user.username)
    if not db_user or not crud.verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Usuario o contraseña inválidos")
    return {"message": f"Bienvenido {user.username}"}
