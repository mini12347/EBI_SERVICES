import re
import sys
from datetime import datetime, timedelta
from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "")

DAY_NAMES_FR = {
    "Monday": "Lundi",
    "Tuesday": "Mardi",
    "Wednesday": "Mercredi",
    "Thursday": "Jeudi",
    "Friday": "Vendredi",
    "Saturday": "Samedi",
    "Sunday": "Dimanche",
}

_RDV_MSG = {
    "schedule_no_date": {
        "fr": "Je n'ai pas pu reconnaître une date valide. Veuillez préciser le jour et l'heure (ex : 15/03/2025 à 14h30).",
        "en": "I could not recognize a valid date. Please provide the day and time (e.g. 15/03/2025 at 2:30pm).",
    },
    "slot_taken": {
        "fr": "Le créneau du {date} est déjà réservé. Veuillez en choisir un autre.",
        "en": "The slot on {date} is already booked. Please choose another one.",
    },
    "slot_unavailable": {
        "fr": "Le créneau du {date} n'est pas disponible.",
        "en": "The slot on {date} is not available.",
    },
    "confirmed": {
        "fr": "Votre rendez-vous a été confirmé pour le {date}.",
        "en": "Your appointment has been confirmed for {date}.",
    },
    "service_unavailable": {
        "fr": "Service de rendez-vous temporairement indisponible. Veuillez réessayer plus tard.",
        "en": "The appointment service is temporarily unavailable. Please try again later.",
    },
    "cancel_no_date": {
        "fr": "Je n'ai pas pu reconnaître une date valide dans votre message. Veuillez préciser le jour et l'heure (ex : 15/03/2025 à 14h30).",
        "en": "I could not recognize a valid date in your message. Please provide the day and time (e.g. 15/03/2025 at 2:30pm).",
    },
    "cancel_not_found": {
        "fr": "Aucun rendez-vous trouvé pour le {date}.",
        "en": "No appointment found for {date}.",
    },
    "cancel_confirmed": {
        "fr": "Votre rendez-vous du {date} a été annulé.",
        "en": "Your appointment on {date} has been cancelled.",
    },
    "list_empty": {
        "fr": "Vous n'avez aucun rendez-vous planifié.",
        "en": "You have no scheduled appointments.",
    },
    "list_title": {
        "fr": "Vos rendez-vous :",
        "en": "Your appointments:",
    },
    "dispo_empty": {
        "fr": "Aucun créneau disponible pour le moment. Veuillez revenir plus tard ou nous contacter directement.",
        "en": "No slots available right now. Please come back later or contact us directly.",
    },
    "dispo_title": {
        "fr": "## Créneaux disponibles (7 prochains jours)",
        "en": "## Available slots (next 7 days)",
    },
    "no_understand": {
        "fr": "Je n'ai pas compris votre demande. Veuillez préciser si vous voulez planifier, annuler, ou consulter les rendez-vous.",
        "en": "I did not understand your request. Please specify whether you want to book, cancel, or view your appointments.",
    },
}


def _rdv_msg(key: str, lang: str = "fr", **kwargs) -> str:
    return _RDV_MSG.get(key, {}).get(lang, _RDV_MSG[key]["fr"]).format(**kwargs)


def _format_dt(date_time: datetime, lang: str = "fr") -> str:
    if lang == "fr":
        return date_time.strftime("%d/%m/%Y à %H:%M")
    return date_time.strftime("%d/%m/%Y at %H:%M")


def _format_day(date_time: datetime, lang: str = "fr") -> str:
    if lang == "fr":
        return DAY_NAMES_FR.get(date_time.strftime("%A"), date_time.strftime("%A"))
    return date_time.strftime("%A")


class RDVManager:
    def __init__(self):
        self._client = None
        self._db = None
        self._rdvs = None
        self._disponibilites = None

    def _ensure_connected(self):
        if self._client is None:
            try:
                self._client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
                self._db = self._client.get_database()
                self._rdvs = self._db["rdvs"]
                self._disponibilites = self._db["disponibilites"]
                self._refresh_disponibilites()
            except Exception:
                self._client = None
                raise

    def _refresh_disponibilites(self):
        """Expire past slots and ensure default available slots for the next 14 weekdays (09:00-17:00)."""
        try:
            now = datetime.now()
            self._disponibilites.update_many(
                {"date": {"$lt": now.isoformat()}, "disponible": True},
                {"$set": {"disponible": False}},
            )
            created = 0
            for offset in range(14):
                day = now + timedelta(days=offset)
                if day.weekday() >= 5:
                    continue
                for hour in range(9, 18):
                    slot = day.replace(hour=hour, minute=0, second=0, microsecond=0)
                    result = self._disponibilites.update_one(
                        {"date": slot.isoformat()},
                        {"$setOnInsert": {"date": slot.isoformat(), "disponible": True}},
                        upsert=True,
                    )
                    if result.upserted_id:
                        created += 1
            if created:
                print(f"[RDVManager] Seeded {created} new default available slots.", file=sys.stderr)
        except Exception as e:
            print(f"[RDVManager] Availability refresh failed: {e}", file=sys.stderr)

    def extract_date_time(self, message: str):
        patterns = [
            r"(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})\s*(?:à|a|@)?\s*(\d{1,2})[h:](\d{2})?",
            r"(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})",
            r"(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})",
        ]
        for pattern in patterns:
            m = re.search(pattern, message)
            if m:
                groups = m.groups()
                if len(groups) == 5:
                    day, month, year, hour, minute = groups
                    minute = minute or "00"
                elif len(groups) == 3:
                    day, month, year = groups
                    hour, minute = "09", "00"
                else:
                    continue
                year = int(year)
                if year < 100:
                    year += 2000
                return datetime(year, int(month), int(day), int(hour), int(minute))
        return None

    def _db_operation(self, func, *args, **kwargs):
        try:
            self._ensure_connected()
            return func(*args, **kwargs)
        except Exception as e:
            return f"Service de rendez-vous temporairement indisponible. Veuillez réessayer plus tard. ({str(e)})"

    def _db_list_operation(self, func, *args, **kwargs):
        try:
            self._ensure_connected()
            return func(*args, **kwargs)
        except Exception:
            return []

    def is_slot_available(self, date_time: datetime) -> bool:
        def _check():
            return self._disponibilites.find_one(
                {"date": date_time.isoformat(), "disponible": True}
            ) is not None
        return self._db_operation(_check)

    def schedule_rdv(self, message: str, user_id: str = None, lang: str = "fr") -> str:
        date_time = self.extract_date_time(message)
        if not date_time:
            return _rdv_msg("schedule_no_date", lang)

        try:
            self._ensure_connected()
        except Exception:
            return _rdv_msg("service_unavailable", lang)

        existing = self._rdvs.find_one({"date": date_time.isoformat()})
        if existing:
            return _rdv_msg("slot_taken", lang, date=_format_dt(date_time, lang))

        if not self.is_slot_available(date_time):
            return _rdv_msg("slot_unavailable", lang, date=_format_dt(date_time, lang))

        rdv = {
            "user_id": user_id,
            "date": date_time.isoformat(),
            "statut": "confirmé",
            "cree_le": datetime.now().isoformat(),
        }
        self._rdvs.insert_one(rdv)
        self._disponibilites.update_one(
            {"date": date_time.isoformat()},
            {"$set": {"disponible": False}},
        )

        return _rdv_msg("confirmed", lang, date=_format_dt(date_time, lang))

    def cancel_rdv(self, message: str, user_id: str = None, lang: str = "fr") -> str:
        date_time = self.extract_date_time(message)
        if not date_time:
            return _rdv_msg("cancel_no_date", lang)

        try:
            self._ensure_connected()
        except Exception:
            return _rdv_msg("service_unavailable", lang)

        result = self._rdvs.delete_one(
            {"date": date_time.isoformat(), "statut": "confirmé"}
            if not user_id
            else {"date": date_time.isoformat(), "user_id": user_id, "statut": "confirmé"}
        )

        if result.deleted_count == 0:
            return _rdv_msg("cancel_not_found", lang, date=_format_dt(date_time, lang))

        self._disponibilites.update_one(
            {"date": date_time.isoformat()},
            {"$set": {"disponible": True}},
        )

        return _rdv_msg("cancel_confirmed", lang, date=_format_dt(date_time, lang))

    def list_rdvs(self, user_id: str = None) -> list:
        try:
            self._ensure_connected()
        except Exception:
            return []
        query = {"statut": "confirmé"}
        if user_id:
            query["user_id"] = user_id
        return list(self._rdvs.find(query, {"_id": 0}).sort("date", 1))

    def list_disponibilites(self) -> list:
        try:
            self._ensure_connected()
        except Exception:
            return []
        return list(
            self._disponibilites.find({"disponible": True}, {"_id": 0}).sort("date", 1)
        )

    def format_list_rdvs(self, user_id: str = None, lang: str = "fr") -> str:
        rdvs = self.list_rdvs(user_id)
        if not rdvs:
            return _rdv_msg("list_empty", lang)
        lines = [_rdv_msg("list_title", lang)]
        for r in rdvs:
            dt = datetime.fromisoformat(r["date"])
            if lang == "fr":
                lines.append(f"- {_format_day(dt, lang)} {dt.strftime('%d/%m/%Y')} à {dt.strftime('%H:%M')}")
            else:
                lines.append(f"- {_format_day(dt, lang)} {dt.strftime('%d/%m/%Y')} at {dt.strftime('%H:%M')}")
        return "\n".join(lines)

    def format_disponibilites(self, lang: str = "fr") -> str:
        dispo = self.list_disponibilites()
        if not dispo:
            return _rdv_msg("dispo_empty", lang)
        seen = set()
        grouped = []
        for d in dispo:
            dt = datetime.fromisoformat(d["date"])
            date_str = dt.strftime("%d/%m/%Y")
            time_str = dt.strftime("%H:%M")
            if date_str not in seen:
                if len(seen) >= 7:
                    break
                seen.add(date_str)
                grouped.append({"date": date_str, "day": _format_day(dt, lang), "times": []})
            grouped[-1]["times"].append(time_str)
        header = "| Jour | Date | Créneaux |" if lang == "fr" else "| Day | Date | Slots |"
        separator = "|------|------|----------|"
        rows = "\n".join(f"| {g['day']} | {g['date']} | {', '.join(g['times'])} |" for g in grouped)
        return f"{_rdv_msg('dispo_title', lang)}\n\n{header}\n{separator}\n{rows}"

    def manage_rdvs(self, message: str, lang: str = "fr", rdv_list: list = None, disponibility_calender: list = None) -> str:
        msg_lower = message.lower()
        if any(kw in msg_lower for kw in ("annuler", "supprimer", "cancel")):
            return self.cancel_rdv(message, lang=lang)
        if any(kw in msg_lower for kw in ("liste", "mes rdv", "mes rendez", "my appointment", "consulter", "voir mes")):
            return self.format_list_rdvs(lang=lang)
        if any(kw in msg_lower for kw in ("disponible", "disponibilité", "disponibilités", "créneau", "créneaux", "creneau", "creneaux", "available", "availability", "slot")):
            return self.format_disponibilites(lang=lang)
        if any(kw in msg_lower for kw in ("planifier", "programmer", "prendre", "réserver", "reserver", "re server", "rdv", "rendez-vous", "rendez vous", "book", "schedule", "appointment")):
            return self.schedule_rdv(message, lang=lang)
        return _rdv_msg("no_understand", lang)
