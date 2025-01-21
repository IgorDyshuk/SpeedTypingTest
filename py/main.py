from datetime import timedelta

from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException, Response, Depends, Request
from pydantic import BaseModel, EmailStr
import psycopg2
from authx import AuthX, AuthXConfig
from passlib.context import CryptContext

app = FastAPI()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

config = AuthXConfig(
  JWT_SECRET_KEY="SECRET_KEY",
  # JWT_ACCESS_TOKEN_EXPIRES=timedelta(minutes=30),  # Время жизни access-токена
  # JWT_REFRESH_TOKEN_EXPIRES=timedelta(days=7),    # Время жизни refresh-токена
  JWT_TOKEN_LOCATION=["cookies"],
  JWT_ACCESS_COOKIE_NAME="my_access_token"
)

security = AuthX(config=config)

app.add_middleware(
  CORSMiddleware,
  allow_origins=["*"],  # Указать домен фронтенда
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)



def get_db_connection():
  return psycopg2.connect(
    database="typing_database",
    user="postgres",
    password="Dysu_kc2c",
    host="localhost",
    port="5432"
  )


class RegisterUserSchema(BaseModel):
  username: str
  email: EmailStr
  password: str


class LoginUserSchema(BaseModel):
  email: EmailStr
  password: str


def hash_password(password: str) -> str:
  return pwd_context.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
  return pwd_context.verify(password, hashed_password)


@app.post("/register")
def register_user(user: RegisterUserSchema):
  connection = get_db_connection()
  try:
    with connection.cursor() as cursor:
      cursor.execute("SELECT * FROM public.users WHERE email = %s", (user.email,))
      if cursor.fetchone():
        raise HTTPException(status_code=400, detail="This user already registered")

      hashed_password = hash_password(user.password)

      cursor.execute(
        "INSERT INTO public.users (name, email, password) VALUES (%s, %s, %s)",
        (user.username, user.email, hashed_password)
      )

      connection.commit()
      return {"message": "User successfully registered"}
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))
  finally:
    connection.close()


@app.post("/login")
def login_user(user: LoginUserSchema, response: Response):
  connection = get_db_connection()
  try:
    with connection.cursor() as cursor:
      cursor.execute("SELECT * FROM public.users WHERE email = %s", (user.email,))
      db_user = cursor.fetchone()
      if not db_user:
        raise HTTPException(status_code=401, detail="Incorrect email or password")

      db_user_password = db_user[3]
      if not verify_password(user.password, db_user_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

      token = security.create_access_token(uid=str(db_user[0]))
      # Возвращаемся к простому set_cookie
      response.set_cookie(config.JWT_ACCESS_COOKIE_NAME, token, httponly=True)

      username = db_user[1]
      return {
        "access_token": token,
        "username": username,
        "message": "User successfully logged in"
      }
  except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))
  finally:
    connection.close()







