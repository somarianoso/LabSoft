import os
import unittest

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


URL_APP = os.environ.get("WELLFLIX_URL", "http://localhost:5173")


class TestCadastroWellFlix(unittest.TestCase):
    def setUp(self):
        options = webdriver.ChromeOptions()
        options.add_argument("--headless=new")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--window-size=1440,1000")
        self.driver = webdriver.Chrome(options=options)
        self.wait = WebDriverWait(self.driver, 10)
        self.driver.get(URL_APP)

        self.wait.until(
            EC.element_to_be_clickable(
                (By.XPATH, "//button[contains(., 'Começar grátis')]")
            )
        ).click()
        self.wait.until(
            EC.visibility_of_element_located((By.ID, "signup-name"))
        )

    def tearDown(self):
        if hasattr(self, "driver"):
            self.driver.quit()

    def test_cadastro_valido_exibe_confirmacao(self):
        self.driver.find_element(By.ID, "signup-name").send_keys("Ana Silva")
        self.driver.find_element(By.ID, "signup-email").send_keys(
            "ana@example.com"
        )
        self.driver.find_element(By.ID, "signup-password").send_keys("Senha123!")
        self.driver.find_element(
            By.CSS_SELECTOR, '[data-testid="signup-submit"]'
        ).click()

        feedback = self.wait.until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, '[role="status"]'))
        )
        self.assertEqual(
            feedback.text, "Cadastro realizado com sucesso para Ana Silva."
        )

    def test_campos_vazios_exibem_validacao(self):
        self.driver.find_element(
            By.CSS_SELECTOR, '[data-testid="signup-submit"]'
        ).click()

        feedback = self.wait.until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, '[role="alert"]'))
        )
        self.assertEqual(feedback.text, "Preencha todos os campos obrigatórios.")
        for field_id in ("signup-name", "signup-email", "signup-password"):
            self.assertEqual(
                self.driver.find_element(By.ID, field_id).get_attribute(
                    "aria-invalid"
                ),
                "true",
            )

    def test_email_invalido_exibe_validacao(self):
        self.driver.find_element(By.ID, "signup-name").send_keys("Ana Silva")
        self.driver.find_element(By.ID, "signup-email").send_keys("email-invalido")
        self.driver.find_element(By.ID, "signup-password").send_keys("Senha123!")
        self.driver.find_element(
            By.CSS_SELECTOR, '[data-testid="signup-submit"]'
        ).click()

        feedback = self.wait.until(
            EC.visibility_of_element_located((By.CSS_SELECTOR, '[role="alert"]'))
        )
        self.assertEqual(feedback.text, "Informe um e-mail válido.")
        self.assertEqual(
            self.driver.find_element(By.ID, "signup-email").get_attribute(
                "aria-invalid"
            ),
            "true",
        )


if __name__ == "__main__":
    unittest.main(verbosity=2)