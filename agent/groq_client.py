from groq import Groq
from config import GROQ_API_KEY

_client = None


def get_groq_client():
    global _client
    if not GROQ_API_KEY:
        raise RuntimeError(
            "GROQ_API_KEY is not configured. Set it in agent/.env to enable AI responses."
        )
    if _client is None:
        _client = Groq(api_key=GROQ_API_KEY)
    return _client
