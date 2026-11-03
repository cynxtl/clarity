import os
import subprocess

PAGES = ['overview', 'repositories', 'scanner', 'studio', 'search', 'integrations', 'settings']
THEMES = ['dark', 'light']

os.makedirs('screenshots', exist_ok=True)
chrome_path = "C:/Program Files/Google/Chrome/Application/chrome.exe"

print("--- Capturing Desktop 1440x900 ---")
for page in PAGES:
    for theme in THEMES:
        out_path = os.path.abspath(f"screenshots/{page}_{theme}.png")
        url = f"http://127.0.0.1:5173/?tab={page}&theme={theme}"
        cmd = [
            chrome_path,
            "--headless=new",
            "--disable-gpu",
            "--window-size=1440,900",
            "--virtual-time-budget=2000",
            f"--screenshot={out_path}",
            url
        ]
        subprocess.run(cmd, check=True)
        print(f"Captured desktop {page} ({theme}): {os.path.getsize(out_path)} bytes")

print("--- Capturing Tablet 820x1080 ---")
for page in PAGES:
    for theme in THEMES:
        out_path = os.path.abspath(f"screenshots/{page}_tablet_{theme}.png")
        url = f"http://127.0.0.1:5173/?tab={page}&theme={theme}"
        cmd = [
            chrome_path,
            "--headless=new",
            "--disable-gpu",
            "--window-size=820,1080",
            "--virtual-time-budget=2000",
            f"--screenshot={out_path}",
            url
        ]
        subprocess.run(cmd, check=True)
        print(f"Captured tablet {page} ({theme}): {os.path.getsize(out_path)} bytes")

print("All screenshots captured successfully.")
