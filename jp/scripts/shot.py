"""デモ医院にログインして主要画面を撮る（日本語化の前後比較用）。
使い方: /usr/bin/python3 jp/scripts/shot.py <出力ディレクトリ> [base=http://127.0.0.1:18382]"""
import os
import sys
from playwright.sync_api import sync_playwright

out = sys.argv[1]
base = sys.argv[2] if len(sys.argv) > 2 else 'http://127.0.0.1:18382'
os.makedirs(out, exist_ok=True)
PAGES = ['/', '/schedule', '/clients', '/patients', '/records', '/billing', '/inventory', '/settings']
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1366, 'height': 900})
    pg.goto(base + '/login', wait_until='networkidle', timeout=180000)
    pg.fill('input[type=email]', 'admin@neighborhoodvet.example.com')
    pg.fill('input[type=password]', 'password123')
    pg.locator('button[type=submit]').click()
    pg.wait_for_url(lambda u: '/login' not in u, timeout=120000)
    pg.wait_for_timeout(3000)
    print('after login:', pg.url)
    for path in PAGES:
        pg.goto(base + path, wait_until='domcontentloaded', timeout=120000)
        pg.wait_for_timeout(12000)
        name = path.strip('/').replace('/', '_') or 'home'
        pg.screenshot(path=os.path.join(out, f'{name}.png'))
        print(path, '->', pg.url, pg.title())
    b.close()
