---
description: "Use when running, debugging, or editing WellFlix Selenium browser tests. Covers the Vite server, Python dependencies, test discovery, and moderator exclusion."
applyTo: ["selenium/**/*.py", "selenium/README.md"]
---

# WellFlix Selenium Tests

- Run commands from the repository root. Start the app in a separate terminal with `npm run dev`; tests default to `http://localhost:5173`.
- Install dependencies with `python -m pip install -r selenium/requirements.txt`. Chrome is required; Selenium Manager may need internet access on its first run to obtain the driver.
- Run all Selenium flows with `python -m unittest discover -s selenium -p 'test_*.py' -v`. This includes the three `test_historia_*.py` stories and `test_wellflix_signup.py`.
- To run only the three history stories, use `python -m unittest discover -s selenium -p 'test_historia_*.py' -v`.
- Do not run `tests/test_moderator.py` as part of this Selenium suite; it is a separate test.
- `WELLFLIX_URL` overrides the app URL. `SELENIUM_HEADLESS=0` opens Chrome visibly and requires a graphical session. `SELENIUM_SLOW_MO` controls story pacing in seconds per action.
- Do not commit `.venv/`, `__pycache__/`, or the `selenium/pcs3643_Risco/` reference clone.