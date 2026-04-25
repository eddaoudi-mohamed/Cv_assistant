from pydantic_settings import BaseSettings
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
env_file = Path(__file__).parent / ".env"
load_dotenv(env_file)

class Settings(BaseSettings):
    google_api_key: str

    class Config:
        case_sensitive = False

settings = Settings()
