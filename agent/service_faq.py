import re
import unicodedata


def _normalize(text):
    normalized = unicodedata.normalize("NFKD", text.lower())
    return "".join(char for char in normalized if not unicodedata.combining(char))


def get_service_faq_response(query, lang="fr"):
    normalized = _normalize(query)
    is_service_question = re.search(
        r"\b(service|services|proposez|proposes|offrez|offer|offers|"
        r"recrutement|recruitment|recruiting|recruter|candidat|candidates?|"
        r"prequalification|prequalifier|profil|talent|sourcing|"
        r"developpement|development|software|logiciel|application|erp|"
        r"teleservices|tele-services|support|back.office|appel|calls?)\b",
        normalized,
    )
    if not is_service_question:
        return None

    if re.search(
        r"\b(recrutement|recruitment|recruiting|recruter|candidat|candidates?|"
        r"prequalification|prequalifier|profil|talent|sourcing|rh|hr)\b",
        normalized,
    ):
        if lang == "en":
            return (
                "EBI Services supports IT recruitment with **candidate search and "
                "selection**, **IT recruitment**, **recruitment outsourcing**, "
                "**initial candidate prequalification**, and **HR support**. "
                "To discuss your hiring needs, submit a request through the "
                "**Contact** form."
            )
        return (
            "EBI Services vous accompagne dans le **recrutement IT** : "
            "**recherche et sélection de profils**, **préqualification des "
            "candidats**, **externalisation du recrutement** et "
            "**accompagnement RH**. Pour préciser vos critères de recrutement, "
            "transmettez votre besoin via le **formulaire de contact**."
        )

    if re.search(
        r"\b(developpement|development|software|logiciel|application|erp|"
        r"web|integration|maintenance)\b",
        normalized,
    ):
        if lang == "en":
            return (
                "EBI Services provides **custom web and business applications**, "
                "**tailored software solutions**, **system integration**, and "
                "**corrective and evolutionary maintenance**. Send your project "
                "requirements through the **Contact** form to get started."
            )
        return (
            "EBI Services propose la **conception d’applications web et métier**, "
            "des **solutions logicielles sur mesure**, l’**intégration** et la "
            "**maintenance évolutive et corrective**. Décrivez votre projet via "
            "le **formulaire de contact** pour échanger avec notre équipe."
        )

    if re.search(
        r"\b(teleservices|tele-services|support|back.office|appel|calls?|"
        r"administratif|client|demande)\b",
        normalized,
    ):
        if lang == "en":
            return (
                "EBI Services offers **customer relations and support**, "
                "**administrative assistance**, **call management**, "
                "**request processing**, and **back-office services**. "
                "Submit your needs through the **Contact** form."
            )
        return (
            "EBI Services propose un **centre de relation client**, du "
            "**support client**, de l’**assistance administrative**, la "
            "**gestion des appels**, le **traitement des demandes** et des "
            "prestations de **back-office**. Vous pouvez détailler votre besoin "
            "via le **formulaire de contact**."
        )

    if lang == "en":
        return (
            "EBI Services works across **custom software development**, "
            "**IT recruitment**, and **tele-services and customer support**. "
            "Use the **Contact** form to describe the service you need."
        )
    return (
        "EBI Services intervient en **développement logiciel sur mesure**, "
        "**recrutement IT**, et **téléservices et support client**. Utilisez le "
        "**formulaire de contact** pour préciser le service recherché."
    )
