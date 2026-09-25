from pathlib import Path
import tempfile

from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from selenium_support import SeleniumScenario


class TestHistoriaProfissionalUpload(SeleniumScenario):
    def setUp(self):
        super().setUp()
        self.video_path = Path(tempfile.gettempdir()) / "wellflix-video-demo.mp4"
        self.video_path.write_bytes(b"WellFlix demonstration video")

    def tearDown(self):
        super().tearDown()
        self.video_path.unlink(missing_ok=True)

    def test_profissional_envia_video_para_aprovacao(self):
        self.click((By.CSS_SELECTOR, '[aria-label="Selecionar tipo de usuário"]'))
        self.click((By.XPATH, "//button[contains(., 'Profissional')]"))
        self.wait.until(
            EC.visibility_of_element_located(
                (By.XPATH, "//h1[normalize-space()='Estúdio do criador']")
            )
        )

        self.upload_file((By.ID, "video-file"), self.video_path)
        self.type_text((By.ID, "video-title"), "Mobilidade para corrida")
        self.select_option((By.ID, "video-category"), "Prevenção")
        self.type_text(
            (By.ID, "video-description"),
            "Sequência de mobilidade para preparar o corpo antes da corrida.",
        )
        self.click((By.CSS_SELECTOR, '[data-testid="upload-submit"]'))

        feedback = self.wait.until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, '[role="status"]'))
        )
        self.assertEqual(
            feedback.text, "Mobilidade para corrida enviado para aprovação."
        )
        self.assertEqual(
            self.driver.find_element(By.CSS_SELECTOR, '[data-testid="upload-state"]').text,
            "Em análise",
        )


if __name__ == "__main__":
    import unittest

    unittest.main(verbosity=2)