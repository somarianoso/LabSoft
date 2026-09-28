import unittest
import time

from selenium import webdriver
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


class TestHistoriaAtletaLoginBuscaVideo(unittest.TestCase):
    def setUp(self):
        self.driver = webdriver.Chrome()
        self.wait = WebDriverWait(self.driver, 10)
        self.driver.get("http://localhost:5173")
        time.sleep(2)

    def tearDown(self):
        self.driver.quit()

    def test_login_pesquisa_e_assiste_video(self):
        driver = self.driver

        # Clica no botão de login
        login_button = self.wait.until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, '[data-testid="header-login"]'))
        )
        ActionChains(driver).move_to_element(login_button).pause(0.8).click().perform()
        time.sleep(1)

        # Preenche email
        email_field = self.wait.until(
            EC.visibility_of_element_located((By.ID, "login-email"))
        )
        ActionChains(driver).move_to_element(email_field).pause(0.8).click().perform()
        email_field.clear()
        email_field.send_keys("ana.silva@wellflix.test")
        time.sleep(0.5)

        # Preenche senha
        password_field = self.driver.find_element(By.ID, "login-password")
        ActionChains(driver).move_to_element(password_field).pause(0.8).click().perform()
        password_field.clear()
        password_field.send_keys("TreinoDemo123")
        time.sleep(0.5)

        # Clica em login
        submit_button = self.wait.until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, '[data-testid="login-submit"]'))
        )
        ActionChains(driver).move_to_element(submit_button).pause(0.8).click().perform()
        time.sleep(1.5)

        # Verifica se está logado
        self.wait.until(
            EC.text_to_be_present_in_element(
                (By.CSS_SELECTOR, '[data-testid="header-login"]'), "ana.silva"
            )
        )
        time.sleep(1)

        # Clica em Explorar
        explore_button = self.wait.until(
            EC.element_to_be_clickable((By.XPATH, "//nav//button[normalize-space()='Explorar']"))
        )
        ActionChains(driver).move_to_element(explore_button).pause(0.8).click().perform()
        time.sleep(1)

        # Busca por vídeo
        search_field = self.wait.until(
            EC.visibility_of_element_located((By.ID, "video-search"))
        )
        ActionChains(driver).move_to_element(search_field).pause(0.8).click().perform()
        search_field.clear()
        search_field.send_keys("Hipertrofia inteligente")
        time.sleep(1.5)

        # Verifica resultado
        self.wait.until(
            EC.text_to_be_present_in_element(
                (By.CSS_SELECTOR, '[data-testid="video-result-count"]'), "1 vídeo"
            )
        )
        self.assertIn(
            "Hipertrofia inteligente",
            self.driver.find_element(By.CSS_SELECTOR, '[data-testid="video-results"]').text,
        )
        time.sleep(1)

        # Clica no vídeo
        video_button = self.wait.until(
            EC.element_to_be_clickable(
                (
                    By.XPATH,
                    "//button[@aria-label='Assistir vídeo: Hipertrofia inteligente: peito e tríceps']",
                )
            )
        )
        ActionChains(driver).move_to_element(video_button).pause(0.8).click().perform()
        time.sleep(1.5)

        # Verifica título
        title = self.wait.until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, '[data-testid="video-title"]'))
        )
        self.assertEqual(title.text, "Hipertrofia inteligente: peito e tríceps")
        time.sleep(1)

        # Clica para reproduzir
        player_toggle = self.wait.until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, '[data-testid="player-toggle"]'))
        )
        ActionChains(driver).move_to_element(player_toggle).pause(0.8).click().perform()
        time.sleep(1.5)

        # Verifica se está reproduzindo
        status = self.wait.until(
            EC.text_to_be_present_in_element(
                (By.CSS_SELECTOR, '[data-testid="playback-status"]'),
                "Reproduzindo prévia",
            )
        )
        self.assertTrue(status)
        time.sleep(1.5)


if __name__ == "__main__":
    import unittest

    unittest.main(verbosity=2)