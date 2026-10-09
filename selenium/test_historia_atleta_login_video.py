from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select

from selenium_support import SeleniumScenario


class TestHistoriaAtletaLoginBuscaVideo(SeleniumScenario):
    def test_busca_profissionais_por_categoria(self):
        self.click(
            (
                By.XPATH,
                "//button[contains(., 'Conheça os especialistas')]",
            )
        )

        result_type = self.wait.until(
            EC.visibility_of_element_located(
                (By.CSS_SELECTOR, '[data-testid="explore-result-type"]')
            )
        )
        self.assertEqual(Select(result_type).first_selected_option.text, "Profissionais")
        self.assertEqual(
            len(
                self.driver.find_elements(
                    By.CSS_SELECTOR, 'input[name="rating"]'
                )
            ),
            3,
        )
        self.click(
            (
                By.CSS_SELECTOR,
                'input[name="category"][value="Musculação"]',
            )
        )

        self.wait.until(
            EC.text_to_be_present_in_element(
                (By.CSS_SELECTOR, '[data-testid="explore-result-count"]'),
                "1 profissional encontrado",
            )
        )
        results = self.driver.find_element(
            By.CSS_SELECTOR, '[data-testid="professional-results"]'
        )
        self.assertIn("Caio Mendes", results.text)
        self.assertNotIn("Marina Lopes", results.text)

    def test_ver_perfil_do_profissional_no_video(self):
        self.click(
            (
                By.XPATH,
                "//*[@role='link' and @aria-label='Assistir vídeo: Explosão e velocidade para atletas']",
            )
        )
        self.click((By.XPATH, "//button[normalize-space()='Ver perfil']"))

        self.wait.until(
            EC.visibility_of_element_located(
                (By.XPATH, "//h1[contains(., 'Caio Mendes')]")
            )
        )
        self.assertTrue(
            self.driver.find_elements(
                By.XPATH, "//button[contains(., 'Seguir profissional')]"
            )
        )

    def test_login_pesquisa_e_assiste_video(self):
        self.click((By.CSS_SELECTOR, '[data-testid="header-login"]'))
        self.wait.until(EC.visibility_of_element_located((By.ID, "login-email")))
        self.type_text((By.ID, "login-email"), "ana.silva@wellflix.test")
        self.type_text((By.ID, "login-password"), "TreinoDemo123")
        self.click((By.CSS_SELECTOR, '[data-testid="login-submit"]'))

        self.wait.until(
            EC.text_to_be_present_in_element(
                (By.CSS_SELECTOR, '[data-testid="header-login"]'), "ana.silva"
            )
        )
        self.click((By.XPATH, "//nav//button[normalize-space()='Explorar']"))
        self.type_text((By.ID, "video-search"), "Hipertrofia inteligente")

        self.wait.until(
            EC.text_to_be_present_in_element(
                (By.CSS_SELECTOR, '[data-testid="video-result-count"]'), "1 vídeo"
            )
        )
        self.assertIn(
            "Hipertrofia inteligente",
            self.driver.find_element(By.CSS_SELECTOR, '[data-testid="video-results"]').text,
        )
        self.click(
            (
                By.XPATH,
                "//*[@role='link' and @aria-label='Assistir vídeo: Hipertrofia inteligente: peito e tríceps']",
            )
        )

        title = self.wait.until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, '[data-testid="video-title"]'))
        )
        self.assertEqual(title.text, "Hipertrofia inteligente: peito e tríceps")
        comment_box = self.wait.until(
            EC.visibility_of_element_located((By.ID, "video-comment"))
        )
        comment_box.send_keys("Excelente explicação da técnica!")
        self.click((By.CSS_SELECTOR, '[data-testid="submit-video-comment"]'))
        self.wait.until(
            EC.text_to_be_present_in_element(
                (By.CSS_SELECTOR, ".comment:last-child"), "Excelente explicação da técnica!"
            )
        )

        self.click((By.CSS_SELECTOR, '[data-testid="player-toggle"]'))
        status = self.wait.until(
            EC.text_to_be_present_in_element(
                (By.CSS_SELECTOR, '[data-testid="playback-status"]'),
                "Reproduzindo prévia",
            )
        )
        self.assertTrue(status)


if __name__ == "__main__":
    import unittest

    unittest.main(verbosity=2)