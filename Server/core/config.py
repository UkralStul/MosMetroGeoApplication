from pydantic_settings import BaseSettings
from dotenv import load_dotenv
import os
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

class Settings(BaseSettings):
    api_v1_prefix: str = "/api/v1"
    db_url: str = DATABASE_URL
    echo: bool = False

settings = Settings()