from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from selenium_support import SeleniumScenario


class TestHistoriaCompraPlano(SeleniumScenario):
    def test_compra_plano_pro(self):
        self.click((By.XPATH, "//nav//button[normalize-space()='Planos']"))
        self.click((By.CSS_SELECTOR, '[data-testid="choose-plan-pro"]'))
        self.wait.until(
            EC.visibility_of_element_located(
                (By.XPATH, "//aside[@aria-label='Resumo do pedido']//h2[.='Pro']")
            )
        )

        self.type_text((By.ID, "checkout-name"), "Ana Silva")
        self.type_text((By.ID, "checkout-card"), "4242424242424242")
        self.type_text((By.ID, "checkout-expiry"), "12/30")
        self.type_text((By.ID, "checkout-cvc"), "123")
        self.click((By.CSS_SELECTOR, '[data-testid="checkout-submit"]'))

        feedback = self.wait.until(
            EC.visibility_of_element_located(
                (By.CSS_SELECTOR, '[data-testid="checkout-feedback"]')
            )
        )
        self.assertEqual(feedback.text, "Pagamento aprovado. Plano Pro ativado.")


if __name__ == "__main__":
    import unittest

    unittest.main(verbosity=2)