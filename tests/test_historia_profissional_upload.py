import unittest
import time
from pathlib import Path
import tempfile

from selenium import webdriver
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait, Select


class TestHistoriaProfissionalUpload(unittest.TestCase):
    def setUp(self):
        self.driver = webdriver.Chrome()
        self.wait = WebDriverWait(self.driver, 10)
        self.driver.get("http://localhost:5173")
        time.sleep(2)
        
        self.video_path = Path(tempfile.gettempdir()) / "wellflix-video-demo.mp4"
        self.video_path.write_bytes(b"WellFlix demonstration video")

    def tearDown(self):
        self.driver.quit()
        self.video_path.unlink(missing_ok=True)

    def test_profissional_envia_video_para_aprovacao(self):
        driver = self.driver

        # Clica no seletor de usuário
        user_selector = self.wait.until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, '[aria-label="Selecionar tipo de usuário"]'))
        )
        ActionChains(driver).move_to_element(user_selector).pause(0.8).click().perform()
        time.sleep(1.5)

        # Clica em Profissional
        professional_button = self.wait.until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Profissional')]"))
        )
        ActionChains(driver).move_to_element(professional_button).pause(0.8).click().perform()
        time.sleep(1.5)

        # Verifica se entrou no Estúdio do criador
        self.wait.until(
            EC.visibility_of_element_located(
                (By.XPATH, "//h1[normalize-space()='Estúdio do criador']")
            )
        )
        time.sleep(1)

        # Upload do vídeo
        video_input = self.wait.until(
            EC.presence_of_element_located((By.ID, "video-file"))
        )
        video_input.send_keys(str(self.video_path))
        time.sleep(1.5)

        # Preenche título
        title_field = self.wait.until(
            EC.visibility_of_element_located((By.ID, "video-title"))
        )
        ActionChains(driver).move_to_element(title_field).pause(0.8).click().perform()
        title_field.clear()
        title_field.send_keys("Mobilidade para corrida")
        time.sleep(0.5)

        # Seleciona categoria
        category_select = Select(self.driver.find_element(By.ID, "video-category"))
        category_select.select_by_visible_text("Prevenção")
        time.sleep(1)

        # Preenche descrição
        description_field = self.driver.find_element(By.ID, "video-description")
        ActionChains(driver).move_to_element(description_field).pause(0.8).click().perform()
        description_field.clear()
        description_field.send_keys(
            "Sequência de mobilidade para preparar o corpo antes da corrida."
        )
        time.sleep(0.5)

        # Clica em enviar
        submit_button = self.wait.until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, '[data-testid="upload-submit"]'))
        )
        ActionChains(driver).move_to_element(submit_button).pause(0.8).click().perform()
        time.sleep(1.5)

        # Verifica feedback
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
        time.sleep(1.5)


if __name__ == "__main__":
    import unittest

    unittest.main(verbosity=2)