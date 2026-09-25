import unittest
import time

from selenium import webdriver
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


class ModeratorFlowTest(unittest.TestCase):
    def setUp(self):
        self.driver = webdriver.Chrome()
        self.wait = WebDriverWait(self.driver, 10)
        self.driver.get("http://localhost:5173")

    def tearDown(self):
        self.driver.quit()

    def test_aprova_video_e_remove_da_fila(self):
        driver = self.driver

        time.sleep(2.5)

        # Abre o seletor de perfil e entra no painel do moderador.
        seletor_perfil = self.wait.until(
            EC.element_to_be_clickable(
                (By.CSS_SELECTOR, 'button[aria-label="Selecionar tipo de usuário"]')
            )
        )
        ActionChains(driver).move_to_element(seletor_perfil).pause(0.8).click().perform()
        time.sleep(1.5)

        opcao_moderador = self.wait.until(
            EC.element_to_be_clickable(
                (By.XPATH, "//button[normalize-space()='Moderador']")
            )
        )
        ActionChains(driver).move_to_element(opcao_moderador).pause(0.8).click().perform()
        time.sleep(1.5)

        self.wait.until(
            EC.visibility_of_element_located(
                (By.XPATH, "//h1[normalize-space()='Aprovação de Vídeos']")
            )
        )

        # Encontra o botão Aprovar no cartão do vídeo escolhido.
        video_card = self.wait.until(
            EC.visibility_of_element_located(
                (
                    By.XPATH,
                    "//article[contains(@class, 'review-card')]"
                    "[.//h3[contains(., 'Agachamento Búlgaro Avançado')]]",
                )
            )
        )
        time.sleep(1.5)
        botao_aprovar = video_card.find_element(
            By.XPATH, ".//button[normalize-space()='Aprovar']"
        )
        ActionChains(driver).move_to_element(botao_aprovar).pause(0.8).click().perform()
        time.sleep(1.5)

        notice = self.wait.until(
            EC.visibility_of_element_located(
                (By.CLASS_NAME, "moderator-notice")
            )
        )
        self.assertEqual(notice.text, "Vídeo aprovado e publicado.")

        self.wait.until(EC.invisibility_of_element(video_card))

        time.sleep(1.5)


if __name__ == "__main__":
    unittest.main()