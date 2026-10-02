import os
from pathlib import Path
import sys
import unittest


SELENIUM_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SELENIUM_DIR.parent


def main():
    os.chdir(PROJECT_ROOT)
    os.environ["SELENIUM_HEADLESS"] = "0"
    os.environ.setdefault("SELENIUM_SLOW_MO", "1.2")
    sys.path.insert(0, str(SELENIUM_DIR))

    from selenium import webdriver

    original_add_argument = webdriver.ChromeOptions.add_argument

    def add_argument_for_visible_kiosk(options, argument):
        if not argument.startswith("--headless"):
            if argument.startswith("--window-size"):
                original_add_argument(options, "--kiosk")
            else:
                original_add_argument(options, argument)

    # Garante modo imersivo e visibilidade inclusive no teste de cadastro.
    webdriver.ChromeOptions.add_argument = add_argument_for_visible_kiosk

    print("Confirme que o app esta rodando (npm run dev) antes dos testes.")
    suite = unittest.defaultTestLoader.discover(
        start_dir=str(SELENIUM_DIR),
        pattern="test_*.py",
    )
    result = unittest.TextTestRunner(verbosity=2).run(suite)
    return 0 if result.wasSuccessful() else 1


if __name__ == "__main__":
    raise SystemExit(main())
