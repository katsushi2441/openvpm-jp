"""新しい動物病院を登録する（国=日本）。本番構成の確認用。
使い方: /usr/bin/python3 jp/scripts/try_register.py <base> <email> <password> <out_dir>"""
import os
import sys
from playwright.sync_api import sync_playwright

base, email, pw, out = sys.argv[1:5]
os.makedirs(out, exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1280, 'height': 1000})
    pg.goto(base + '/register', wait_until='networkidle', timeout=120000)
    for step in range(10):
        pg.screenshot(path=f'{out}/reg_{step}.png', full_page=True)
        filled = False
        for sel, val in (('#practiceName', 'テスト動物病院'), ('#email', email), ('#password', pw)):
            loc = pg.locator(sel)
            if loc.count() and loc.first.is_visible() and not loc.first.input_value():
                loc.first.fill(val); filled = True
        for inp in pg.locator('input[type=text]:visible, input:not([type]):visible').all():
            if not inp.input_value():
                n = (inp.get_attribute('name') or inp.get_attribute('id') or '')
                inp.fill('小嶋' if 'last' in n.lower() else '篤' if 'first' in n.lower() else 'テスト'); filled = True
        c = pg.locator('#country')
        if c.count() and c.first.is_visible():
            c.first.select_option('JP'); filled = True
        for cb in pg.locator('input[type=checkbox]:visible').all():
            if not cb.is_checked():
                cb.check(); filled = True
        btn = pg.locator('button[type=submit]:visible')
        if not btn.count():
            btn = pg.locator('button:visible')
        if not btn.count():
            break
        btn.last.click()
        pg.wait_for_timeout(6000)
        print(step, pg.url)
        if '/register' not in pg.url:
            break
    pg.screenshot(path=f'{out}/reg_done.png', full_page=True)
    print('final:', pg.url)
    b.close()
