"""日本語の表計算CSV（キットのひな形）を、設定→データ→取り込み の画面から取り込む。
試し実行（プレビュー）の結果を表示し、--commit なら「取り込みを確定」まで押す。
使い方: /usr/bin/python3 jp/scripts/try_import.py <base> <email> <password> <templates_dir> <out_dir> [--commit]"""
import os
import sys
from playwright.sync_api import sync_playwright

base, email, pw, tdir, out = sys.argv[1:6]
COMMIT = '--commit' in sys.argv
os.makedirs(out, exist_ok=True)
FILES = ['01_飼い主.csv', '02_患者.csv', '03_ワクチン歴.csv', '04_診療記録.csv']


def summary(pg):
    text = pg.inner_text('main')
    keep = [ln.strip() for ln in text.splitlines()
            if any(w in ln for w in ('件', '行', 'エラー', '重複', '一致', '取り込', 'インポート', '変更', '確定'))]
    return [ln for ln in keep if len(ln) < 200][-12:]


with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1366, 'height': 1600})
    pg.goto(base + '/login', wait_until='networkidle', timeout=180000)
    pg.fill('input[type=email]', email)
    pg.fill('input[type=password]', pw)
    pg.locator('button[type=submit]').click()
    pg.wait_for_url(lambda u: '/login' not in u, timeout=120000)
    pg.goto(base + '/settings?tab=data', wait_until='networkidle', timeout=180000)
    pg.wait_for_timeout(4000)
    # 登録したばかりの医院は初期設定の案内（ダイアログ）が前に出る。「後で完了する」で閉じる
    for _ in range(3):
        if not pg.locator('[role=dialog]').count():
            break
        later = pg.locator('[role=dialog] button').filter(has_text='後で')
        if later.count():
            later.first.click()
        else:
            pg.keyboard.press('Escape')
        pg.wait_for_timeout(1500)
    sel = pg.locator('select').filter(has=pg.locator('option[value="other"]'))
    if sel.count():
        sel.first.select_option('other')
    else:
        pg.locator('button').filter(has_text='他のシステム').first.click()
    pg.wait_for_timeout(1500)
    for i, fname in enumerate(FILES):
        pg.locator('button:has(svg.lucide-upload)').filter(has_text=f'{i + 1}. ').first.click()
        pg.wait_for_timeout(1000)
        pg.locator('input[type=file][accept=".csv"]').first.set_input_files(os.path.join(tdir, fname))
        pg.wait_for_timeout(5000)
        pg.screenshot(path=f'{out}/{i + 1}_preview.png', full_page=True)
        print(f'--- {fname}（試し実行）')
        for ln in summary(pg):
            print('   ', ln)
        if COMMIT:
            btn = pg.locator('button:has(svg.lucide-check):enabled')
            if btn.count():
                btn.last.click()
                pg.wait_for_timeout(6000)
                pg.screenshot(path=f'{out}/{i + 1}_done.png', full_page=True)
                print(f'--- {fname}（確定後）')
                for ln in summary(pg):
                    print('   ', ln)
            else:
                print('    確定ボタンが押せない（取り込む行が0件）')
    b.close()
