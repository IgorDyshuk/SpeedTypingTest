from datetime import timedelta, datetime, timezone
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException, Response, Request, status
from pydantic import BaseModel, EmailStr
import psycopg2
from authx import AuthX, AuthXConfig
from passlib.context import CryptContext
import json

app = FastAPI()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

config = AuthXConfig(
  JWT_SECRET_KEY="SECRET_KEY",
  JWT_ACCESS_TOKEN_EXPIRES=timedelta(minutes=30),
  # JWT_REFRESH_TOKEN_EXPIRES=timedelta(days=7),
  JWT_TOKEN_LOCATION=["cookies"],
  JWT_ACCESS_COOKIE_NAME="my_access_token"
)

security = AuthX(config=config)

app.add_middleware(
  CORSMiddleware,
  allow_origins=["http://127.0.0.1:5501"],
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


class ScoreUpdateSchema(BaseModel):
  score: int
  language: str
  time: int


def hash_password(password: str) -> str:
  return pwd_context.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
  return pwd_context.verify(password, hashed_password)


@app.post("/register")
def register_user(user: RegisterUserSchema, response: Response):
  connection = get_db_connection()
  try:
    with connection.cursor() as cursor:
      cursor.execute("SELECT * FROM public.users WHERE email = %s", (user.email,))
      if cursor.fetchone():
        raise HTTPException(status_code=400, detail="This user already registered")

      hashed_password = hash_password(user.password)

      date = datetime.now(timezone.utc).date()

      cursor.execute(
        "INSERT INTO public.users (name, email, password, registration_date) VALUES (%s, %s, %s, %s) RETURNING id",
        (user.username, user.email, hashed_password, date)
      )
      user_id = cursor.fetchone()[0]
      connection.commit()

      token = security.create_access_token(uid=str(user_id), expires_delta=timedelta(minutes=30))
      response.set_cookie(
        config.JWT_ACCESS_COOKIE_NAME,
        token,
        httponly=True,
        samesite="none",
        secure=True,
        max_age=1800,
        expires=1800,
      )
      return {"message": "User successfully registered", "username": user.username}
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

      token = security.create_access_token(uid=str(db_user[0]), expires_delta=timedelta(minutes=30))
      response.set_cookie(
        config.JWT_ACCESS_COOKIE_NAME,
        token,
        httponly=True,
        samesite="none",
        secure=True,
        max_age=1800,
        expires=1800,
      )

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


@app.get("/profile")
def protected(request: Request):
  token = request.cookies.get(config.JWT_ACCESS_COOKIE_NAME)
  if not token:
    return Response(status_code=status.HTTP_204_NO_CONTENT)

  try:
    decoded_token = security._decode_token(token)
    user_id = decoded_token.sub

    connection = get_db_connection()
    with connection.cursor() as cursor:
      cursor.execute("SELECT name FROM public.users WHERE id = %s", (user_id,))
      db_user = cursor.fetchone()
      if not db_user:
        return Response(status_code=status.HTTP_204_NO_CONTENT)
      name = db_user[0]
      return {"username": name}

  except Exception as e:
    return Response(status_code=status.HTTP_204_NO_CONTENT)

  finally:
    connection.close()


@app.post("/logout")
def logout(response: Response):
  response.delete_cookie(config.JWT_ACCESS_COOKIE_NAME, path="/")
  return {"message": "User successfully logged out"}


@app.post("/update_best_score")
def update_best_score(score_data: ScoreUpdateSchema, request: Request):
  token = request.cookies.get(config.JWT_ACCESS_COOKIE_NAME)

  if not token:
    return Response(status_code=status.HTTP_401_UNAUTHORIZED, content="Login to \n access")

  try:
    decoded_token = security._decode_token(token)
    user_id = decoded_token.sub

    column_name = f"best_{score_data.language}_{score_data.time}"

    connection = get_db_connection()
    with connection.cursor() as cursor:
      cursor.execute(
        "SELECT column_name FROM information_schema.columns WHERE table_name = 'users' AND column_name = %s",
        (column_name,)
      )
      column_exists = cursor.fetchone()

      if not column_exists:
        return Response(status_code=400, content=f"Column '{column_name}' not found in database")

      cursor.execute(f"SELECT {column_name} FROM public.users WHERE id = %s", (user_id,))
      best_score = cursor.fetchone()
      best_score = best_score[0] if best_score and best_score[0] is not None else 0

      if score_data.score > best_score:
        cursor.execute(f"UPDATE public.users SET {column_name} = %s WHERE id = %s", (score_data.score, user_id))
        connection.commit()
        best_score = score_data.score
        response_data = {"better": True, "best_score": best_score, "message": "Congratulation with new record!"}
      else:
        response_data = {"better": False, "best_score": best_score}

      return Response(content=json.dumps(response_data), media_type="application/json")

  except Exception as e:
    return Response(status_code=500, content=f"Server error: {str(e)}")

  finally:
    connection.close()


@app.post("/update_started_tests")
def update_started_tests(request: Request):
  token = request.cookies.get(config.JWT_ACCESS_COOKIE_NAME)

  if not token:
    return Response(status_code=status.HTTP_401_UNAUTHORIZED, content="Login to access")

  connection = None
  try:
    connection = get_db_connection()
    decoded_token = security._decode_token(token)
    user_id = decoded_token.sub

    with connection.cursor() as cursor:
      cursor.execute("SELECT started_tests FROM public.users WHERE id = %s FOR UPDATE", (user_id,))
      result = cursor.fetchone()

      if result is None or result[0] is None:
        amount_started_tests = 1
      else:
        amount_started_tests = result[0] + 1

      # print(f"User ID: {user_id}, Current started_tests: {result}, New Value: {amount_started_tests}")

      cursor.execute("UPDATE public.users SET started_tests = %s WHERE id = %s", (amount_started_tests, user_id))
      connection.commit()

      return Response(content=json.dumps({"amount_started_tests": amount_started_tests}), media_type="application/json")

  except psycopg2.Error as db_error:
    return Response(status_code=500, content=f"Database error: {str(db_error)}")

  except Exception as e:
    return Response(status_code=500, content=f"Server error: {str(e)}")

  finally:
    if connection:
      connection.close()


@app.post("/update_completed_tests")
def update_completed_tests(request: Request):
  token = request.cookies.get(config.JWT_ACCESS_COOKIE_NAME)

  if not token:
    return Response(status_code=status.HTTP_401_UNAUTHORIZED, content="Login to access")

  connection = None
  try:
    connection = get_db_connection()
    decoded_token = security._decode_token(token)
    user_id = decoded_token.sub

    with connection.cursor() as cursor:
      cursor.execute("SELECT completed_tests FROM public.users WHERE id = %s FOR UPDATE", (user_id,))
      result = cursor.fetchone()

      if result is None or result[0] is None:
        amount_completed_tests = 1
      else:
        amount_completed_tests = result[0] + 1

      # print(f"User ID: {user_id}, Current completed_tests: {result}, New Value: {amount_completed_tests}")

      cursor.execute("UPDATE public.users SET completed_tests = %s WHERE id = %s", (amount_completed_tests, user_id))
      connection.commit()

      return Response(content=json.dumps({"amount_completed_tests": amount_completed_tests}), media_type="application/json")

  except psycopg2.Error as db_error:
    return Response(status_code=500, content=f"Database error: {str(db_error)}")

  except Exception as e:
    return Response(status_code=500, content=f"Server error: {str(e)}")

  finally:
    if connection:
      connection.close()
