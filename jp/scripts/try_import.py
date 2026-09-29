"""日本語の表計算CSV（キットのひな形）を、設定→データ→取り込み の画面から試し実行する。
使い方: /usr/bin/python3 jp/scripts/try_import.py <templates_dir> <out_dir> [--commit]"""
import os
import sys
from playwright.sync_api import sync_playwright

tdir, out = sys.argv[1], sys.argv[2]
COMMIT = '--commit' in sys.argv
base = 'http://127.0.0.1:18382'
os.makedirs(out, exist_ok=True)
FILES = [('clients', '01_飼い主.csv'), ('patients', '02_患者.csv'), ('vaccinations', '03_ワクチン歴.csv'), ('soap', '04_診療記録.csv')]
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1366, 'height': 1400})
    pg.goto(base + '/login', wait_until='networkidle', timeout=180000)
    pg.fill('input[type=email]', 'admin@neighborhoodvet.example.com')
    pg.fill('input[type=password]', 'password123')
    pg.locator('button[type=submit]').click()
    pg.wait_for_url(lambda u: '/login' not in u, timeout=120000)
    pg.goto(base + '/settings?tab=data', wait_until='domcontentloaded', timeout=180000)
    pg.wait_for_timeout(10000)
    pg.screenshot(path=f'{out}/0_data.png', full_page=True)
    # 移行元の選択（select か ボタン）
    sel = pg.locator('select').filter(has=pg.locator('option[value="other"]'))
    if sel.count():
        sel.first.select_option('other')
    else:
        pg.get_by_text('Another system or spreadsheet').first.click()
    pg.wait_for_timeout(1500)
    for i, (mode, fname) in enumerate(FILES):
        btns = pg.locator('button:has(svg.lucide-upload)')
        btns.nth(i).click()
        pg.wait_for_timeout(1000)
        pg.locator('input[type=file][accept=".csv"]').first.set_input_files(os.path.join(tdir, fname))
        pg.wait_for_timeout(6000)
        pg.screenshot(path=f'{out}/{i+1}_{mode}_preview.png', full_page=True)
        body = pg.inner_text('main')
        print(f'--- {fname}')
        for line in body.splitlines():
            if any(w in line for w in ('件', 'row', 'Row', 'エラー', '行', 'インポート', '重複', '一致')):
                print('   ', line[:160])
        if COMMIT:
            btn = pg.get_by_role('button', name=lambda n: n and ('インポート' in n or 'Import' in n) and 'CSV' not in n)
            print('   commit buttons:', btn.count())
    b.close()
