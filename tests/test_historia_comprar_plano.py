import unittest
import time

from selenium import webdriver
from selenium.webdriver.common.action_chains import ActionChains
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait


class TestHistoriaCompraPlano(unittest.TestCase):
    def setUp(self):
        self.driver = webdriver.Chrome()
        self.wait = WebDriverWait(self.driver, 10)
        self.driver.get("http://localhost:5173")
        time.sleep(2)

    def tearDown(self):
        self.driver.quit()

    def test_compra_plano_pro(self):
        driver = self.driver

        # Clica em Planos
        planos_button = self.wait.until(
            EC.element_to_be_clickable((By.XPATH, "//nav//button[normalize-space()='Planos']"))
        )
        ActionChains(driver).move_to_element(planos_button).pause(0.8).click().perform()
        time.sleep(1.5)

        # Clica em "Escolher Plano Pro"
        pro_button = self.wait.until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, '[data-testid="choose-plan-pro"]'))
        )
        ActionChains(driver).move_to_element(pro_button).pause(0.8).click().perform()
        time.sleep(1.5)

        # Verifica resumo do pedido
        self.wait.until(
            EC.visibility_of_element_located(
                (By.XPATH, "//aside[@aria-label='Resumo do pedido']//h2[.='Pro']")
            )
        )
        time.sleep(1)

        # Preenche nome
        name_field = self.wait.until(
            EC.visibility_of_element_located((By.ID, "checkout-name"))
        )
        ActionChains(driver).move_to_element(name_field).pause(0.8).click().perform()
        name_field.clear()
        name_field.send_keys("Ana Silva")
        time.sleep(0.5)

        # Preenche cartão
        card_field = self.driver.find_element(By.ID, "checkout-card")
        ActionChains(driver).move_to_element(card_field).pause(0.8).click().perform()
        card_field.clear()
        card_field.send_keys("4242424242424242")
        time.sleep(0.5)

        # Preenche validade
        expiry_field = self.driver.find_element(By.ID, "checkout-expiry")
        ActionChains(driver).move_to_element(expiry_field).pause(0.8).click().perform()
        expiry_field.clear()
        expiry_field.send_keys("12/30")
        time.sleep(0.5)

        # Preenche CVC
        cvc_field = self.driver.find_element(By.ID, "checkout-cvc")
        ActionChains(driver).move_to_element(cvc_field).pause(0.8).click().perform()
        cvc_field.clear()
        cvc_field.send_keys("123")
        time.sleep(0.5)

        # Clica em confirmar pagamento
        submit_button = self.wait.until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, '[data-testid="checkout-submit"]'))
        )
        ActionChains(driver).move_to_element(submit_button).pause(0.8).click().perform()
        time.sleep(1.5)

        # Verifica feedback
        feedback = self.wait.until(
            EC.visibility_of_element_located(
                (By.CSS_SELECTOR, '[data-testid="checkout-feedback"]')
            )
        )
        self.assertEqual(feedback.text, "Pagamento aprovado. Plano Pro ativado.")
        time.sleep(1.5)


if __name__ == "__main__":
    import unittest

    unittest.main(verbosity=2)