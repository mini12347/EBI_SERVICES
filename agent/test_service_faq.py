import unittest

from service_faq import get_service_faq_response


class ServiceFaqTests(unittest.TestCase):
    def test_recruitment_question_is_answered_without_external_ai(self):
        response = get_service_faq_response(
            "Quels services proposez-vous en recrutement IT et préqualification de candidats ?"
        )

        self.assertIn("recrutement IT", response)
        self.assertIn("préqualification des candidats", response)
        self.assertIn("formulaire de contact", response)

    def test_software_question_uses_the_development_catalog(self):
        response = get_service_faq_response(
            "Tell me about your Software Development services and custom ERP solutions.",
            "en",
        )

        self.assertIn("custom web and business applications", response)
        self.assertIn("system integration", response)

    def test_non_service_question_is_left_to_the_ai_agent(self):
        self.assertIsNone(get_service_faq_response("Bonjour, comment allez-vous ?"))


if __name__ == "__main__":
    unittest.main()
