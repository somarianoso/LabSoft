from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from selenium_support import SeleniumScenario


class TestHistoriaAtletaLoginBuscaVideo(SeleniumScenario):
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
                "//button[@aria-label='Assistir vídeo: Hipertrofia inteligente: peito e tríceps']",
            )
        )

        title = self.wait.until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, '[data-testid="video-title"]'))
        )
        self.assertEqual(title.text, "Hipertrofia inteligente: peito e tríceps")
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