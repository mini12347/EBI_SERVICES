from config import GROQ_MODEL
from groq_client import get_groq_client
import json

DEPARTMENTS_FR = {
    "Tele-services": "Télé-services",
    "Business Process Outsourcing (BPO)": "Business Process Outsourcing (BPO)",
    "Solutions IT & Digitales": "Solutions IT & Digitales",
    "Sourcing & Integration de profils": "Sourcing & Intégration de profils",
}

DEPARTMENTS_EN = {
    "Tele-services": "Tele-services",
    "Business Process Outsourcing (BPO)": "Business Process Outsourcing (BPO)",
    "IT & Digital Solutions": "IT & Digital Solutions",
    "Sourcing & Profile Integration": "Sourcing & Profile Integration",
}

FR_TO_EN = {
    "Télé-services": "Tele-services",
    "Business Process Outsourcing (BPO)": "Business Process Outsourcing (BPO)",
    "Solutions IT & Digitales": "IT & Digital Solutions",
    "Sourcing & Intégration de profils": "Sourcing & Profile Integration",
}

EN_TO_FR = {v: k for k, v in FR_TO_EN.items()}

ALL_FR_NAMES = list(FR_TO_EN.keys())
ALL_EN_NAMES = list(FR_TO_EN.values())

import unicodedata

DEPARTMENT_KEYS = (
    "Tele-services",
    "Business Process Outsourcing (BPO)",
    "Solutions IT & Digitales",
    "Sourcing & Integration de profils",
)

DEPARTMENT_DISPLAY = {
    "fr": {
        "Tele-services": "Télé-services",
        "Business Process Outsourcing (BPO)": "Business Process Outsourcing (BPO)",
        "Solutions IT & Digitales": "Solutions IT & Digitales",
        "Sourcing & Integration de profils": "Sourcing & Intégration de profils",
    },
    "en": {
        "Tele-services": "Tele-services",
        "Business Process Outsourcing (BPO)": "Business Process Outsourcing (BPO)",
        "Solutions IT & Digitales": "IT & Digital Solutions",
        "Sourcing & Integration de profils": "Sourcing & Profile Integration",
    },
}

_DEPARTMENT_ALIASES = {
    "tele-services": "Tele-services",
    "tele service": "Tele-services",
    "tele services": "Tele-services",
    "teleservices": "Tele-services",
    "bpo": "Business Process Outsourcing (BPO)",
    "business process outsourcing": "Business Process Outsourcing (BPO)",
    "business process outsourcing (bpo)": "Business Process Outsourcing (BPO)",
    "solutions it & digitales": "Solutions IT & Digitales",
    "solutions it et digitales": "Solutions IT & Digitales",
    "solutions it & digital": "Solutions IT & Digitales",
    "solutions it et digital": "Solutions IT & Digitales",
    "solutions it digital": "Solutions IT & Digitales",
    "it & digital solutions": "Solutions IT & Digitales",
    "it and digital solutions": "Solutions IT & Digitales",
    "it digital solutions": "Solutions IT & Digitales",
    "sourcing & integration de profils": "Sourcing & Integration de profils",
    "sourcing et integration de profils": "Sourcing & Integration de profils",
    "sourcing & integration": "Sourcing & Integration de profils",
    "sourcing et integration": "Sourcing & Integration de profils",
    "sourcing & profile integration": "Sourcing & Integration de profils",
    "sourcing and profile integration": "Sourcing & Integration de profils",
}


def _normalize_department(text: str) -> str:
    if not text:
        return ""
    text = unicodedata.normalize("NFKD", text)
    text = "".join(c for c in text if not unicodedata.combining(c))
    return " ".join(text.lower().split())


def resolve_department_key(raw_name):
    return _DEPARTMENT_ALIASES.get(_normalize_department(raw_name))


def resolve_department_name(raw_name, lang="fr"):
    """Return the accurate canonical department name in the given language,
    or None when raw_name does not match any known department."""
    key = resolve_department_key(raw_name)
    if key is None:
        return None
    return DEPARTMENT_DISPLAY.get(lang, DEPARTMENT_DISPLAY["fr"]).get(key, key)

def classify_intent(user_input, lang="fr"):
    if lang == "en":
        dept_list = ", ".join(ALL_EN_NAMES)
        system_prompt = (
            "You are an assistant that classifies user intents. "
            "Classify the user's intent based on the following departments: "
            f"{dept_list}. "
            "If the intent does not match any department, answer 'No matching department'. "
            "Answer ONLY with a JSON object in this exact format, with no other text: "
            '{"intent": "department name or No matching department", '
            '"confidence": 0.0, "reason": "reason for classification"}'
        )
        user_prompt = f"Classify the intent of the following user message: '{user_input}'."
    else:
        dept_list = ", ".join(ALL_FR_NAMES)
        system_prompt = (
            "Tu es un assistant qui classifie les intentions des utilisateurs. "
            "Classifie l'intention de l'utilisateur en fonction des départements suivants : "
            f"{dept_list}. "
            "Si l'intention ne correspond à aucun de ces départements, réponds 'Aucun département approprié'. "
            "Réponds UNIQUEMENT avec un objet JSON au format suivant, sans aucun autre texte : "
            '{"intent": "nom du département ou Aucun département approprié", '
            '"confiance": 0.0, "raison": "raison de la classification"}'
        )
        user_prompt = f"Classifie l'intention de l'utilisateur suivant : '{user_input}'."

    response = get_groq_client().chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0,
        response_format={"type": "json_object"}
    )

    result = json.loads(response.choices[0].message.content)

    if lang == "en":
        name = result.get("intent", "")
        if name in EN_TO_FR:
            result["intent_fr"] = EN_TO_FR[name]
        else:
            result["intent_fr"] = name
    else:
        name = result.get("intent", "")
        if name in FR_TO_EN:
            result["intent_en"] = FR_TO_EN[name]
        else:
            result["intent_en"] = name

    return result
