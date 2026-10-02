from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC

from selenium_support import SeleniumScenario


class TestHistoriaCompraPlano(SeleniumScenario):
    def test_plano_basico_seleciona_duas_categorias(self):
        self.click((By.XPATH, "//nav//button[normalize-space()='Planos']"))
        self.click((By.CSS_SELECTOR, '[data-testid="choose-plan-basico"]'))
        self.wait.until(
            EC.visibility_of_element_located(
                (By.XPATH, "//aside[@aria-label='Resumo do pedido']//h2[.='Básico']")
            )
        )

        options = self.driver.find_elements(
            By.CSS_SELECTOR, 'input[name="checkout-category"]'
        )
        self.assertEqual(len(options), 6)
        for category in options[:2]:
            self.click(
                (
                    By.CSS_SELECTOR,
                    f'input[name="checkout-category"][value="{category.get_attribute("value")}"]',
                )
            )

        self.assertEqual(
            self.driver.find_element(
                By.CSS_SELECTOR, '[data-testid="checkout-category-count"]'
            ).text,
            "2 de 2 selecionadas",
        )
        self.assertEqual(
            len(
                self.driver.find_elements(
                    By.CSS_SELECTOR, 'input[name="checkout-category"]:checked'
                )
            ),
            2,
        )
        self.assertEqual(
            len(
                self.driver.find_elements(
                    By.CSS_SELECTOR, 'input[name="checkout-category"]:disabled'
                )
            ),
            4,
        )

    def test_compra_plano_pro(self):
        self.click((By.XPATH, "//nav//button[normalize-space()='Planos']"))
        self.click((By.CSS_SELECTOR, '[data-testid="choose-plan-pro"]'))
        self.wait.until(
            EC.visibility_of_element_located(
                (By.XPATH, "//aside[@aria-label='Resumo do pedido']//h2[.='Pro']")
            )
        )
        self.assertEqual(
            self.driver.find_element(
                By.CSS_SELECTOR, '[data-testid="checkout-category-count"]'
            ).text,
            "0 de 6 selecionadas",
        )
        for category in self.driver.find_elements(
            By.CSS_SELECTOR, 'input[name="checkout-category"]'
        ):
            self.click(
                (
                    By.CSS_SELECTOR,
                    f'input[name="checkout-category"][value="{category.get_attribute("value")}"]',
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
        self.assertEqual(
            feedback.text,
            "Pagamento aprovado. Plano Pro ativado. Categorias selecionadas: "
            "Musculação, Yoga, Basquete, Nutrição, Recuperação, Lesões.",
        )


if __name__ == "__main__":
    import unittest

    unittest.main(verbosity=2)