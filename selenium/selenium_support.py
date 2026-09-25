import os
import time
import unittest

from selenium import webdriver
from selenium.webdriver import ActionChains
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select, WebDriverWait


URL_APP = os.environ.get("WELLFLIX_URL", "http://localhost:5173")


class SeleniumScenario(unittest.TestCase):
    def setUp(self):
        self.step_delay = float(os.environ.get("SELENIUM_SLOW_MO", "0.8"))
        options = webdriver.ChromeOptions()
        if os.environ.get("SELENIUM_HEADLESS", "1").lower() not in {
            "0",
            "false",
            "no",
        }:
            options.add_argument("--headless=new")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")
        options.add_argument("--window-size=1440,1000")
        self.driver = webdriver.Chrome(options=options)
        self.wait = WebDriverWait(self.driver, 15)
        self.driver.get(URL_APP)
        self.install_click_pointer()
        self.pause()

    def tearDown(self):
        if hasattr(self, "driver"):
            self.driver.quit()

    def pause(self, multiplier=1):
        time.sleep(self.step_delay * multiplier)

    def install_click_pointer(self):
        self.driver.execute_script(
            """
            if (!document.getElementById('selenium-click-pointer')) {
              const pointer = document.createElement('div');
              pointer.id = 'selenium-click-pointer';
              pointer.setAttribute('aria-hidden', 'true');
              pointer.innerHTML = '<span></span>';
              Object.assign(pointer.style, {
                position: 'fixed', left: '-40px', top: '-40px', width: '28px',
                height: '28px', border: '2px solid #d7ff5e', borderRadius: '50%',
                boxShadow: '0 0 0 4px #07100db3, 0 0 18px #d7ff5e99',
                pointerEvents: 'none', zIndex: '2147483647',
                transform: 'translate(-50%, -50%)',
                transition: 'left 70ms linear, top 70ms linear, scale 100ms ease',
                opacity: '0.95'
              });
              const dot = pointer.firstElementChild;
              Object.assign(dot.style, {
                position: 'absolute', left: '50%', top: '50%', width: '5px',
                height: '5px', borderRadius: '50%', background: '#d7ff5e',
                transform: 'translate(-50%, -50%)'
              });
              document.documentElement.appendChild(pointer);
              document.addEventListener('mousemove', event => {
                pointer.style.left = `${event.clientX}px`;
                pointer.style.top = `${event.clientY}px`;
              }, true);
              document.addEventListener('mousedown', () => {
                pointer.style.scale = '0.72';
              }, true);
              document.addEventListener('mouseup', () => {
                pointer.style.scale = '1';
              }, true);
            }
            """
        )

    def click(self, locator):
        element = self.wait.until(EC.element_to_be_clickable(locator))
        ActionChains(self.driver).move_to_element(element).pause(
            self.step_delay / 2
        ).click().perform()
        self.pause()
        return element

    def type_text(self, locator, value):
        element = self.wait.until(EC.visibility_of_element_located(locator))
        ActionChains(self.driver).move_to_element(element).pause(
            self.step_delay / 2
        ).click().perform()
        element.clear()
        character_delay = min(0.08, self.step_delay / 6)
        for character in value:
            element.send_keys(character)
            time.sleep(character_delay)
        self.pause()
        return element

    def select_option(self, locator, label):
        element = self.wait.until(EC.element_to_be_clickable(locator))
        ActionChains(self.driver).move_to_element(element).pause(
            self.step_delay / 2
        ).perform()
        Select(element).select_by_visible_text(label)
        self.pause()

    def upload_file(self, locator, path):
        element = self.wait.until(EC.presence_of_element_located(locator))
        element.send_keys(str(path))
        self.pause()