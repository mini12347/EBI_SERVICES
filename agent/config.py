import os
from dotenv import load_dotenv

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY", "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")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

BREVO_API_KEY = os.getenv("BREVO_API_KEY", "")
BREVO_SENDER_EMAIL = os.getenv("BREVO_SENDER_EMAIL", "")
BREVO_SENDER_NAME = os.getenv("BREVO_SENDER_NAME", "EBI Services")

MONGO_URI = os.getenv("MONGO_URI", "")

AGENT_MAX_RETRIES = int(os.getenv("AGENT_MAX_RETRIES", "3"))
