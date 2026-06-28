"""
ai_suggest.py — FastAPI router for AI-powered SQL query suggestions.

Endpoint: POST /api/ai/suggest
  - Accepts a natural-language intent string
  - Calls Claude API (claude-haiku-4-5) via claude_client.suggest_query()
  - Returns a ready-to-run SQL query with inline comments

Endpoint: GET /api/ai/status
  - Reports whether the AI feature is enabled (API key set)
"""

from fastapi import APIRouter
from app.models.schemas import AiSuggestRequest, AiSuggestResponse, AiSuggestDebug
from app.utils.claude_client import suggest_query
import anthropic

router = APIRouter(prefix="/api/ai", tags=["AI Suggestions"])

_MAX_INTENT_LENGTH = 500


@router.post("/suggest", response_model=AiSuggestResponse)
def suggest_sql(request: AiSuggestRequest) -> AiSuggestResponse:
    """
    Generate a SQL query from a natural-language intent using Claude.

    The system prompt injects the full schema, window function rules, and
    output constraints so Claude generates correct, project-specific SQL.
    """
    intent = request.intent.strip()

    # ── Validate intent ───────────────────────────────────────────────────
    if not intent:
        return AiSuggestResponse(
            status="error",
            error_code="EMPTY_INTENT",
            error_message="Intent cannot be empty.",
            hint="Describe what you want to query, e.g. 'show running totals per customer'.",
        )

    if len(intent) > _MAX_INTENT_LENGTH:
        return AiSuggestResponse(
            status="error",
            error_code="INTENT_TOO_LONG",
            error_message=f"Intent must be under {_MAX_INTENT_LENGTH} characters.",
            hint="Keep the description concise — the AI will fill in the details.",
        )

    # ── Call Claude API ───────────────────────────────────────────────────
    try:
        result = suggest_query(intent)
        debug = AiSuggestDebug(prompt=result.get("debug", {}).get("prompt"))
        return AiSuggestResponse(
            status="success",
            sql=result["sql"],
            model=result["model"],
            input_tokens=result["input_tokens"],
            output_tokens=result["output_tokens"],
            debug=debug if debug.prompt else None,
        )

    except ValueError as e:
        # ANTHROPIC_API_KEY not set
        return AiSuggestResponse(
            status="error",
            error_code="AI_DISABLED",
            error_message=str(e),
            hint="Set ANTHROPIC_API_KEY in backend/.env and restart the server.",
        )

    except anthropic.RateLimitError:
        return AiSuggestResponse(
            status="error",
            error_code="RATE_LIMIT",
            error_message="Anthropic API rate limit reached.",
            hint="Too many requests — wait a few seconds and try again.",
        )

    except anthropic.APIError as e:
        return AiSuggestResponse(
            status="error",
            error_code="UPSTREAM_ERROR",
            error_message=f"Claude API error: {str(e)}",
            hint="Check the backend logs for the full error. Ensure your API key is valid.",
        )

    except Exception as e:
        return AiSuggestResponse(
            status="error",
            error_code="INTERNAL_ERROR",
            error_message=str(e),
            hint="An unexpected server error occurred.",
        )


@router.get("/status", tags=["AI Suggestions"])
def ai_status():
    """Returns whether the AI suggestion feature is enabled (API key is set)."""
    from app.config import ANTHROPIC_API_KEY
    enabled = bool(ANTHROPIC_API_KEY and ANTHROPIC_API_KEY != "ENTER_YOUR_VALUE_HERE")
    return {
        "ai_enabled": enabled,
        "model": "claude-haiku-4-5" if enabled else None,
        "hint": None if enabled else "Set ANTHROPIC_API_KEY in backend/.env",
    }
