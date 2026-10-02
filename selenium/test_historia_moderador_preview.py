from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from selenium_support import SeleniumScenario


class TestHistoriaModeradorPreview(SeleniumScenario):
    def test_moderador_pre_visualiza_video_pendente(self):
        self.click((By.CSS_SELECTOR, '[aria-label="Selecionar tipo de usuário"]'))
        self.click((By.XPATH, "//button[normalize-space()='Moderador']"))

        preview = self.wait.until(
            EC.element_to_be_clickable(
                (
                    By.CSS_SELECTOR,
                    '[aria-label="Pré-visualizar Agachamento Búlgaro Avançado: Técnica, Força e Execução Perfeita"]',
                )
            )
        )
        preview.click()

        title = self.wait.until(
            EC.visibility_of_element_located(
                (By.CSS_SELECTOR, '[data-testid="video-title"]')
            )
        )
        self.assertEqual(
            title.text,
            "Agachamento Búlgaro Avançado: Técnica, Força e Execução Perfeita",
        )
        self.assertIn(
            "MUSCULAÇÃO",
            self.driver.find_element(By.CLASS_NAME, "video-meta").text,
        )


if __name__ == "__main__":
    import unittest

    unittest.main(verbosity=2)
