from datetime import timedelta, datetime, timezone, date
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


class BestScoreUpdateSchema(BaseModel):
  score: int
  accuracy: int
  language: str
  time: int


class TypingDurationSchema(BaseModel):
  typing_duration: int


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

      token = security.create_access_token(uid=str(user_id), expires_delta=timedelta(minutes=120))
      response.set_cookie(
        config.JWT_ACCESS_COOKIE_NAME,
        token,
        httponly=True,
        samesite="none",
        secure=True,
        max_age=7200,
        expires=7200,
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

      token = security.create_access_token(uid=str(db_user[0]), expires_delta=timedelta(minutes=120))
      response.set_cookie(
        config.JWT_ACCESS_COOKIE_NAME,
        token,
        httponly=True,
        samesite="none",
        secure=True,
        max_age=7200,
        expires=7200,
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
def update_best_score(score_data: BestScoreUpdateSchema, request: Request):
  token = request.cookies.get(config.JWT_ACCESS_COOKIE_NAME)

  if not token:
    return Response(status_code=status.HTTP_401_UNAUTHORIZED, content="Login to \n access")

  connection = None
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

      cursor.execute(f"SELECT COALESCE({column_name}, '{{}}'::jsonb) FROM public.users WHERE id = %s FOR UPDATE",
                     (user_id,))
      best_score_data = cursor.fetchone()
      best_score_json = best_score_data[0] if best_score_data else {}

      best_wpm = best_score_json.get("wpm", 0)

      record_date = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")

      if score_data.score > best_wpm:
        new_best_score = {
          "wpm": score_data.score,
          "accuracy": score_data.accuracy,
          "record_date": record_date
        }
        cursor.execute(f"UPDATE public.users SET {column_name} = %s WHERE id = %s",
                       (json.dumps(new_best_score), user_id))
        connection.commit()
        best_score = score_data.score
        response_data = {"better": True, "best_score": best_score, "message": "Congratulation with new record!"}
      else:
        response_data = {"better": False, "best_score": best_wpm}

      return Response(content=json.dumps(response_data), media_type="application/json")

  except Exception as e:
    return Response(status_code=500, content=f"Server error: {str(e)}")

  finally:
    if connection:
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

      return Response(content=json.dumps({"amount_completed_tests": amount_completed_tests}),
                      media_type="application/json")

  except psycopg2.Error as db_error:
    return Response(status_code=500, content=f"Database error: {str(db_error)}")

  except Exception as e:
    return Response(status_code=500, content=f"Server error: {str(e)}")

  finally:
    if connection:
      connection.close()


@app.post("/update_typing_duration")
def update_typing_duration(typing_duration_data: TypingDurationSchema, request: Request):
  token = request.cookies.get(config.JWT_ACCESS_COOKIE_NAME)

  if not token:
    return Response(status_code=status.HTTP_401_UNAUTHORIZED, content="Login to access")

  connection = None
  try:
    connection = get_db_connection()
    decoded_token = security._decode_token(token)
    user_id = decoded_token.sub

    with connection.cursor() as cursor:
      cursor.execute("SELECT typing_duration FROM public.users WHERE id = %s FOR UPDATE", (user_id,))
      result = cursor.fetchone()
      current_typing_duration = result[0] if result and result[0] is not None else 0

      new_typing_duration = current_typing_duration + typing_duration_data.typing_duration
      cursor.execute("UPDATE public.users SET typing_duration = %s WHERE id = %s", (new_typing_duration, user_id))
      connection.commit()

      return Response(content=json.dumps({"new_typing_duration": new_typing_duration}),
                      media_type="application/json")

  except psycopg2.Error as db_error:
    return Response(status_code=500, content=f"Database error: {str(db_error)}")

  except Exception as e:
    return Response(status_code=500, content=f"Server error: {str(e)}")

  finally:
    if connection:
      connection.close()



@app.get("/get_profile_information")
def get_profile_information(request: Request):
  token = request.cookies.get(config.JWT_ACCESS_COOKIE_NAME)

  if not token:
    return Response(status_code=status.HTTP_401_UNAUTHORIZED, content="Login to access")

  connection = None
  try:
    decoded_token = security._decode_token(token)
    user_id = decoded_token.sub

    connection = get_db_connection()
    with connection.cursor() as cursor:
      cursor.execute("SELECT * FROM public.users WHERE id = %s", (user_id,))
      user_data = cursor.fetchone()

      if not user_data:
        return Response(status_code=404, content="User not found")

      username = user_data[1]
      registration_date = user_data[6]
      started_tests = user_data[4]
      completed_tests = user_data[5]
      typing_duration = user_data[16]

      if isinstance(registration_date, date):
        registration_date = registration_date.strftime("%Y-%m-%d")

      return Response(content=json.dumps({
        "username": username,
        "registration_date": registration_date,
        "started_tests": started_tests,
        "completed_tests": completed_tests,
        "typing_duration": typing_duration,
        "best_score" : {
          "eng_words_15" : user_data[7],
          "eng_words_30" : user_data[8],
          "eng_words_60" : user_data[9],
          "ukr_words_15" : user_data[10],
          "ukr_words_30" : user_data[11],
          "ukr_words_60" : user_data[12],
          "ru_words_15" : user_data[13],
          "ru_words_30" : user_data[14],
          "ru_words_60" : user_data[15]
        }
      }), media_type="application/json")

  except psycopg2.Error as db_error:
    return Response(status_code=500, content=f"Database error: {str(db_error)}")

  except Exception as e:
    return Response(status_code=500, content=f"Server error: {str(e)}")

  finally:
    if connection:
      connection.close()
