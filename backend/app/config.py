from dotenv import load_dotenv
import os

load_dotenv()

SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")
SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
DATABASE_URL: str = os.getenv("DATABASE_URL", "")
APP_ENV: str = os.getenv("APP_ENV", "development")
BACKEND_PORT: int = int(os.getenv("BACKEND_PORT", "8000"))
# Anthropic Claude API — Phase 14.8 AI Query Suggestions
ANTHROPIC_API_KEY: str = os.getenv("ANTHROPIC_API_KEY", "")
ALLOWED_ORIGINS: list[str] = os.getenv(
    "ALLOWED_ORIGINS", "http://localhost:5173"
).split(",")

def validate_config() -> None:
    """Validate that all required environment variables are set."""
    missing = []
    if not SUPABASE_URL or SUPABASE_URL == "ENTER_YOUR_VALUE_HERE":
        missing.append("SUPABASE_URL")
    if not SUPABASE_ANON_KEY or SUPABASE_ANON_KEY == "ENTER_YOUR_VALUE_HERE":
        missing.append("SUPABASE_ANON_KEY")
    if not DATABASE_URL or DATABASE_URL == "ENTER_YOUR_VALUE_HERE":
        missing.append("DATABASE_URL")
    if missing:
        raise EnvironmentError(
            f"Missing or placeholder environment variables: {', '.join(missing)}. "
            f"Please fill in backend/.env before starting the server."
        )
