import sys
import re
import inspect
import json
import os
import tempfile
from general_questions_responder import generate_response
from department_handler import classify_intent, resolve_department_key, resolve_department_name
from department_contexts import build_context
from rdv_manager import RDVManager

rdv_manager = RDVManager()

STATE_FILE = os.path.join(tempfile.gettempdir(), "ebi_agent_state.json")

RDV_KEYWORDS = [
    "rdv", "rendez-vous", "rendez vous", "planifier", "programmer",
    "reserver", "re server", "annuler", "creneau", "creneau",
    "disponible", "prendre rdv", "calendrier", "agenda",
    "mes rdv", "mes rendez-vous",
    "appointment", "appointments", "book", "booking", "schedule",
    "reschedule", "cancel", "slot", "available", "availability",
    "my appointment", "my appointments", "calendar",
]

FORM_KEYWORDS = [
    "formulaire de contact", "remplir le formulaire", "soumettre le formulaire",
    "je veux etre contacte", "me contacter", "contactez-moi",
    "contact form", "fill out the form", "submit the form",
    "contact me", "get in touch", "reach out",
]

GENERAL_INFO_KEYWORDS = [
    "heure", "heures", "horaire", "horaires", "ouvert", "ouverte",
    "ouverture", "ferme", "ferme", "fermeture", "a partir de quelle heure",
    "quand etes-vous ouvert", "adresse", "ou etes-vous", "ou se trouve",
    "localisation", "emplacement", "numero de telephone", "telephone",
    "email", "courriel", "site web",
    "hour", "hours", "opening", "open", "close", "closed", "closing",
    "what time", "when are you open", "address", "where are you",
    "location", "phone number", "phone", "website",
]

APP_NAVIGATION_KEYWORDS = [
    "comment faire", "comment puis-je", "comment", "ou puis-je", "ou trouver",
    "how do i", "how can i", "how to", "where can i", "where do i",
    "register", "signup", "sign up", "login", "log in", "sign in",
    "inscription", "connexion", "se connecter", "s'inscrire",
    "request quote", "ask for quote", "get quote", "demande de devis",
    "demande un devis", "obtenir un devis",
    "book consultation", "schedule meeting", "prendre rendez-vous",
    "reserver consultation", "planifier meeting",
    "upload document", "upload file", "telecharger document",
    "televerser", "envoyer document", "vault", "coffre-fort",
    "chat with manager", "message manager", "parler au manager",
    "envoyer message", "contacter manager",
    "cancel appointment", "annuler rendez-vous",
    "see my quotes", "voir mes devis", "voir mes demandes",
    "forgot password", "reset password", "mot de passe oublie",
    "reinitialiser mot de passe",
    "client portal", "portail client", "portal", "portail",
    "admin", "dashboard", "tableau de bord",
    "what can i do", "what features", "what can you do",
    "que puis-je faire", "que peux-tu faire", "fonctionnalites",
]

ENGLISH_HINTS = [
    "the", "what", "when", "where", "how", "is", "are", "you", "please",
    "hello", "hi", "want", "need", "book", "cancel", "appointment",
]

FRENCH_HINTS = [
    "le", "la", "les", "je", "veux", "vous", "etes", "quand", "ou",
    "comment", "bonjour", "svp", "s'il", "rendez", "societe",
]

RDV_ACTION_KEYWORDS = {
    "cancel": ("annuler", "supprimer", "cancel"),
    "list": ("liste", "mes rdv", "mes rendez", "my appointment", "consulter", "voir mes"),
    "dispo": ("disponible", "disponibilité", "disponibilités", "créneau", "créneaux", "creneau", "creneaux", "available", "availability", "slot"),
    "schedule": ("planifier", "programmer", "prendre", "réserver", "reserver", "re server", "rdv", "rendez-vous", "rendez vous", "book", "schedule", "appointment"),
}

BOOKING_CONFIRM = {
    "fr": (
        "### Rendez-vous\n\n"
        "Souhaitez-vous **prendre un rendez-vous** avec notre équipe ?\n"
        "*(Répondez oui ou non, ou indiquez directement la date et l'heure souhaitées)*"
    ),
    "en": (
        "### Appointment\n\n"
        "Would you like to **book an appointment** with our team ?\n"
        "*(Answer yes or no, or directly provide your preferred date and time)*"
    ),
}

RDV_PROMPTS = {
    "schedule": {
        "fr": "Bien sûr ! À quelle date et heure souhaitez-vous votre rendez-vous ?\n*(Ex : 15/03/2025 à 14h30)*",
        "en": "Sure! When would you like your appointment ?\n*(e.g. 15/03/2025 at 2:30pm)*",
    },
    "cancel": {
        "fr": "D'accord. Quel rendez-vous souhaitez-vous annuler ?\n*(Précisez la date, ex : 15/03/2025 à 14h30)*",
        "en": "OK. Which appointment would you like to cancel ?\n*(Provide the date, e.g. 15/03/2025 at 2:30pm)*",
    },
}

RDV_CANCELLED = {
    "fr": "Très bien, j'annule la demande de rendez-vous. N'hésitez pas à revenir vers moi si besoin !",
    "en": "Alright, I cancelled the appointment request. Feel free to come back if you need anything !",
}

ASK_REDIRECT_THRESHOLD = 0.8
AUTO_REDIRECT_THRESHOLD = 0.9

MESSAGES = {
    "fr": {
        "form_redirect": (
            "### Formulaire de contact\n\n"
            "Je vous redirige vers notre **formulaire de contact**.\n\n"
            "Veuillez remplir vos informations :\n"
            "- Nom\n"
            "- Email\n"
            "- Telephone\n"
            "- Votre besoin\n\n"
            "Notre equite vous recontactera rapidement."
        ),
        "ask_redirect": (
            "### Département détecté\n\n"
            "J'ai remarqué que votre question concerne le département suivant :\n"
            "**{intent}**\n\n"
            "Voulez-vous que je vous redirige vers ce département "
            "pour une assistance plus spécialisée ?\n"
            "*(Répondez oui ou non)*"
        ),
        "auto_redirect": (
            "### Département détecté\n\n"
            "J'ai remarqué que votre question concerne le département suivant :\n"
            "**{intent}**\n\n"
            "Je vous redirige vers ce département "
            "pour une assistance plus spécialisée.\n\n"
            "Je vous mets en relation avec le représentant du département **{intent}** "
            "dans la messagerie de votre espace client."
        ),
        "error": "### Une erreur est survenue\n\nDesole, une erreur est survenue lors du traitement de votre demande.\n\nVeuillez reessayer ou contacter notre equipe par formulaire.\n\n`Erreur: {error}`",
    },
    "en": {
        "form_redirect": (
            "### Contact Form\n\n"
            "I'm redirecting you to our **contact form**.\n\n"
            "Please fill in your information :\n"
            "- Name\n"
            "- Email\n"
            "- Phone\n"
            "- Your request\n\n"
            "Our team will get back to you shortly."
        ),
        "ask_redirect": (
            "### Department detected\n\n"
            "I noticed your question concerns the following department :\n"
            "**{intent}**\n\n"
            "Would you like me to redirect you to that department "
            "for more specialized help ?\n"
            "*(Answer yes or no)*"
        ),
        "auto_redirect": (
            "### Department detected\n\n"
            "I noticed your question concerns the following department :\n"
            "**{intent}**\n\n"
            "Redirecting you to that department "
            "for more specialized help.\n\n"
            "I'm connecting you with the **{intent}** representative "
            "in your client portal's chat."
        ),
        "error": "### An error occurred\n\nSorry, an error occurred while processing your request.\n\nPlease try again or contact our team through the form.\n\n`Error: {error}`",
    },
}

_word_re_cache = {}


def _compile_keyword_pattern(keywords):
    key = tuple(keywords)
    if key not in _word_re_cache:
        escaped = sorted((re.escape(kw) for kw in keywords), key=len, reverse=True)
        pattern = r"(?:%s)" % "|".join(escaped)
        _word_re_cache[key] = re.compile(pattern, re.IGNORECASE)
    return _word_re_cache[key]


def contains_keyword(query: str, keywords) -> bool:
    return _compile_keyword_pattern(keywords).search(query) is not None


def is_rdv_query(query: str) -> bool:
    return contains_keyword(query, RDV_KEYWORDS)


def is_form_query(query: str) -> bool:
    return contains_keyword(query, FORM_KEYWORDS)


def is_general_info_query(query: str) -> bool:
    return contains_keyword(query, GENERAL_INFO_KEYWORDS)


def is_app_navigation_query(query: str) -> bool:
    return contains_keyword(query, APP_NAVIGATION_KEYWORDS)


def detect_language(query: str) -> str:
    try:
        from langdetect import detect
        lang = detect(query)
        if lang.startswith("fr"):
            return "fr"
        if lang.startswith("en"):
            return "en"
    except Exception:
        pass

    q = query.lower()
    fr_score = sum(1 for w in FRENCH_HINTS if re.search(rf"\b{re.escape(w)}\b", q))
    en_score = sum(1 for w in ENGLISH_HINTS if re.search(rf"\b{re.escape(w)}\b", q))

    if re.search(r"[àâäéèêëîïôöùûüç]", q):
        fr_score += 2

    return "en" if en_score > fr_score else "fr"


def detect_rdv_action(query: str):
    q = query.lower()
    for action, keywords in RDV_ACTION_KEYWORDS.items():
        if any(kw in q for kw in keywords):
            return action
    return None


def _supports_lang_param(func) -> bool:
    try:
        return "lang" in inspect.signature(func).parameters
    except (TypeError, ValueError):
        return False


def call_generate_response(query: str, context, lang: str) -> str:
    if _supports_lang_param(generate_response):
        return generate_response(query, context, lang=lang)
    return generate_response(query, context)


def call_rdv_method(method_name: str, query: str, lang: str) -> str:
    method = getattr(rdv_manager, method_name)
    if _supports_lang_param(method):
        return method(query, lang=lang)
    return method(query)


def load_conversation_state() -> dict:
    try:
        if os.path.exists(STATE_FILE):
            with open(STATE_FILE, 'r', encoding='utf-8') as f:
                state = json.load(f)
                if 'timestamp' in state:
                    import time
                    if time.time() - state['timestamp'] > 1800:
                        return {"pending_rdv_action": None}
                return state
    except Exception:
        pass
    return {"pending_rdv_action": None}

def save_conversation_state(state: dict):
    try:
        import time
        state['timestamp'] = time.time()
        with open(STATE_FILE, 'w', encoding='utf-8') as f:
            json.dump(state, f, ensure_ascii=False)
    except Exception:
        pass


conversation_state = load_conversation_state()


def _rdv_prompt(action: str, lang: str) -> str:
    return RDV_PROMPTS.get(action, RDV_PROMPTS["schedule"])[lang]


def handle_rdv_query(query: str, lang: str) -> str:
    pending = conversation_state.get("pending_rdv_action")

    if pending:
        if is_negation(query, lang):
            conversation_state["pending_rdv_action"] = None
            save_conversation_state(conversation_state)
            return RDV_CANCELLED.get(lang, RDV_CANCELLED["en"])

        date_time = rdv_manager.extract_date_time(query)
        if date_time is not None:
            conversation_state["pending_rdv_action"] = None
            save_conversation_state(conversation_state)
            if pending == "schedule":
                return call_rdv_method("schedule_rdv", query, lang)
            if pending == "cancel":
                return call_rdv_method("cancel_rdv", query, lang)
            return call_rdv_method("manage_rdvs", query, lang)

        new_action = detect_rdv_action(query)
        if new_action:
            if new_action != pending:
                conversation_state["pending_rdv_action"] = new_action
                save_conversation_state(conversation_state)
            return _rdv_prompt(new_action, lang)
        if not is_rdv_query(query):
            conversation_state["pending_rdv_action"] = None
            save_conversation_state(conversation_state)
            return None
        return _rdv_prompt(pending, lang)

    action = detect_rdv_action(query)

    return call_rdv_method("manage_rdvs", query, lang)


NEGATION_WORDS = {
    "fr": ["non", "non merci", "pas", "ne", "n'", "aucun", "jamais"],
    "en": ["no", "no thanks", "no thank you", "not", "none", "never", "don't", "dont"],
}


def is_negation(query: str, lang: str) -> bool:
    q = query.lower().strip().rstrip(".,!?;:")
    negs = NEGATION_WORDS.get(lang, NEGATION_WORDS["en"])
    return q in negs or any(q.startswith(w) for w in negs)


def process_query(query: str, lang: str = None) -> str:
    if lang is None:
        lang = detect_language(query)
    msgs = MESSAGES[lang]

    try:
        if is_rdv_query(query) and not is_negation(query, lang):
            if conversation_state.get("pending_rdv_action"):
                return handle_rdv_query(query, lang)

            action = detect_rdv_action(query)
            if action in ("list", "dispo", "cancel"):
                return handle_rdv_query(query, lang)

            conversation_state["pending_rdv_action"] = "schedule"
            if rdv_manager.extract_date_time(query) is not None:
                conversation_state["pending_rdv_action"] = None
                save_conversation_state(conversation_state)
                return call_rdv_method("schedule_rdv", query, lang)
            save_conversation_state(conversation_state)
            return BOOKING_CONFIRM.get(lang, BOOKING_CONFIRM["en"])

        if conversation_state.get("pending_rdv_action"):
            result = handle_rdv_query(query, lang)
            if result is not None:
                return result
            # pending RDV flow abandoned — continue with normal handling

        if is_form_query(query) and not is_negation(query, lang):
            return msgs["form_redirect"]

        if is_general_info_query(query):
            context = build_context({"intent": "Aucun departement approprie", "confiance": 0.0})
            return call_generate_response(query, context, lang)

        if is_app_navigation_query(query) and not is_negation(query, lang):
            context = build_context({"intent": "Aucun departement approprie", "confiance": 0.0})
            return call_generate_response(query, context, lang)

        intent = classify_intent(query, lang=lang) or {}
        confiance = intent.get("confiance", 0) or intent.get("confidence", 0) or 0
        raw_name = intent.get("intent", "")

        context_key = resolve_department_key(raw_name)
        if context_key:
            intent["intent_fr"] = context_key

        intent_name = resolve_department_name(raw_name, lang) or ""

        context = build_context(intent)
        response = call_generate_response(query, context, lang)

        if is_negation(query, lang):
            return response

        if not intent_name or confiance <= 0:
            return response

        if confiance < ASK_REDIRECT_THRESHOLD:
            return response

        if confiance < AUTO_REDIRECT_THRESHOLD:
            return response + "\n\n" + msgs["ask_redirect"].format(intent=intent_name)

        auto_redirect = msgs["auto_redirect"].format(intent=intent_name)
        return response + "\n\n---\n\n" + auto_redirect

    except Exception as e:
        return msgs["error"].format(error=str(e))


if __name__ == "__main__":
    if len(sys.argv) > 1:
        query = sys.argv[1]
        lang = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] in ("fr", "en") else None
        print(process_query(query, lang=lang))
    else:
        while True:
            query = input(">>> ")
            if query.strip().lower() == "exit":
                break
            print(process_query(query))
