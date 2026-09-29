#!/usr/bin/env python3
"""本家のデモデータ（packages/db/seed.ts・米国の医院）から、日本の動物病院のデモデータ
packages/db/seed-ja.ts を作る。

- 医院・スタッフ・飼い主・動物の名前と住所は下の表（架空。電話は 000 局番の架空番号）
- 金額はドル→円（×150、10円単位に丸める）
- 残りの文章（SOAP・診療項目・薬・メッセージなど）はローカルの gemma4 で訳し、
  jp/seed_ja_strings.json に保存する（2回目以降は訳し直さない。手で直したらそれが使われる）
- 列挙値（"checked_out" など小文字の英単語）やコードの文字列は訳さない

使い方: /usr/bin/python3 jp/scripts/make-seed-ja.py
"""
import json
import os
import re
import sys
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'packages', 'db', 'seed.ts')
DST = os.path.join(ROOT, 'packages', 'db', 'seed-ja.ts')
CACHE = os.path.join(ROOT, 'jp', 'seed_ja_strings.json')
OLLAMA = os.environ.get('OLLAMA_URL', 'http://127.0.0.1:11434') + '/api/chat'
MODEL = os.environ.get('OLLAMA_MODEL', 'gemma4:12b-it-qat')
YEN_PER_USD = 150

PRACTICE = {
    '"Neighborhood Veterinary"': '"なごみ動物病院"',
    '"320 Elm Street, Suite 101, Maplewood, NJ 07040"': '"〒000-0000 愛知県名古屋市みなと区ひかり町1-2-3（架空）"',
    '"(555) 867-5309"': '"052-000-0000"',
    '"America/New_York"': '"Asia/Tokyo"',
    '"Main Clinic"': '"本院"',
}
STAFF = {
    '"Practice Admin"': '"病院管理者"',
    '"Dr. Sarah Chen"': '"佐藤 美咲 先生"',
    '"Dr. Marcus Rivera"': '"高橋 健太 先生"',
    '"Dr. Emily Walsh"': '"田中 さくら 先生"',
    '"Jamie Torres"': '"伊藤 陽菜"',
    '"Alex Kim"': '"渡辺 翔"',
    '"Morgan Bailey"': '"山本 あおい"',
    '"Casey Reed"': '"中村 蓮"',
}
# 飼い主（姓・名・住所・市区町村・都道府県・郵便番号・電話）
OWNERS = [
    ('鈴木', '一郎'), ('田中', '恵子'), ('佐藤', '誠'), ('小林', '由美'), ('加藤', '大輔'),
    ('吉田', '真由美'), ('山田', '浩'), ('松本', '直子'), ('井上', '剛'), ('木村', '香織'),
    ('林', '拓也'), ('斎藤', '裕子'), ('清水', '哲也'), ('山口', '美穂'), ('森', '健一'),
    ('池田', '智子'), ('橋本', '亮'), ('阿部', '千尋'), ('石川', '修'), ('前田', '明美'),
    ('藤田', '隆'), ('後藤', '純子'), ('岡田', '聡'), ('長谷川', '彩'), ('村上', '悠'),
]
WARDS = ['みなと区', 'みどり区', 'あおい区', 'さくら区', 'ひかり区']
PETS = {
    'Max': 'マックス', 'Luna': 'ルナ', 'Charlie': 'チャーリー', 'Bella': 'ベラ', 'Cooper': 'クーパー',
    'Daisy': 'デイジー', 'Rocky': 'ロッキー', 'Sadie': 'さくら', 'Tucker': 'タッカー', 'Molly': 'モモ',
    'Bear': 'くま', 'Rosie': 'ロージー', 'Duke': 'デューク', 'Penny': 'ぺんぺん', 'Finn': 'フィン',
    'Zoe': 'ゾーイ', 'Gus': 'ガス', 'Buddy': 'バディ', 'Chloe': 'チロル', 'Winston': 'ウィンストン',
    'Whiskers': 'ひげまる', 'Mittens': 'ミトン', 'Shadow': 'クロ', 'Tigger': 'トラ', 'Cleo': 'クレオ',
    'Oliver': 'オリバー', 'Nala': 'ナナ', 'Simba': 'シンバ', 'Lily': 'リリー', 'Jasper': 'ジャスパー',
    'Mochi': 'もち', 'Felix': 'フェリックス', 'Oreo': 'オレオ', 'Callie': 'ミケ', 'Thumper': 'ぴょん吉',
    'Clover': 'クローバー', 'Kiwi': 'キウイ', 'Sunny': 'サニー', 'Rex': 'レックス',
}

GLOSSARY = """Patient=患者 / Owner=飼い主 / Client=飼い主 / Exam=診察 / Wellness Exam=健康診断 / Sick Visit=一般診療 /
Vaccination=ワクチン接種 / Surgery=手術 / Dental=歯科 / Follow-up=再診 / Spay=避妊手術 / Neuter=去勢手術 /
Radiograph=レントゲン / CBC/Chemistry Panel=血液検査（CBC・生化学） / Urinalysis=尿検査 / Heartworm=フィラリア /
Rabies=狂犬病 / DHPP=混合ワクチン（DHPP） / FVRCP=猫3種混合ワクチン / Flea/tick prevention=ノミ・マダニ予防 /
Medication=薬 / Preventive=予防薬 / Supplement=サプリメント / Diagnostic=検査 / Lab=検査"""
SYSTEM = f"""あなたは動物病院の電子カルテのデモデータを日本語に訳す翻訳者です。
JSON の items の英語を、同じ順番・同じ件数の日本語にして {{"items": [...]}} で返してください。
- 日本の動物病院で実際に使う言い方にする。用語: {GLOSSARY}
- 薬の商品名（Rimadyl、Apoquel、NexGard など）はカタカナにし、成分名・mg などの数字は残す。
- 体温の華氏は摂氏に直す（101.2F → 38.4℃）。ポンド（lbs）はキログラムに直す（50 lbs → 23kg）。
- ドル金額（$45）は円に直す（×150）。それ以外の数字は変えない。
- 人名が出てきたら、次の対応で置き換える: Sarah Chen=佐藤先生、Marcus Rivera=高橋先生、Emily Walsh=田中先生。
- 説明は書かない。"""


def call(batch):
    body = {'model': MODEL, 'stream': False, 'think': False, 'format': 'json',
            'options': {'temperature': 0.1, 'num_predict': 8000, 'num_ctx': 12288},
            'messages': [{'role': 'system', 'content': SYSTEM},
                         {'role': 'user', 'content': json.dumps({'items': batch}, ensure_ascii=False)}]}
    req = urllib.request.Request(OLLAMA, data=json.dumps(body).encode(), headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=900) as r:
        items = json.loads(json.loads(r.read())['message']['content'])['items']
    if len(items) != len(batch):
        raise ValueError('件数が合わない')
    return [str(x) for x in items]


def yen(m):
    v = round(float(m.group(2)) * YEN_PER_USD / 10) * 10
    return f'{m.group(1)}: "{max(v, 10)}.00"'


def main():
    s = open(SRC, encoding='utf-8').read()
    for a, b in {**PRACTICE, **STAFF}.items():
        s = s.replace(a, b)
    # 医院の国・通貨・税率
    s = s.replace('      timezone: "Asia/Tokyo",\n      subscriptionTier: "cloud",',
                  '      timezone: "Asia/Tokyo",\n      country: "JP",\n      currency: "jpy",\n      taxRatePercent: "10.00",\n      subscriptionTier: "cloud",', 1)
    # 電話の内線表記
    s = re.sub(r'"\(555\) 867-5309 x(\d+)"', lambda m: f'"052-000-0000（内線{m.group(1)}）"', s)
    # 飼い主の行を丸ごと差し替え
    rows = re.findall(r'^    \{ firstName: "[^"]+", lastName: .*$', s, re.M)
    assert len(rows) == len(OWNERS), (len(rows), len(OWNERS))
    for i, (row, (last, first)) in enumerate(zip(rows, OWNERS)):
        email = re.search(r'email: "([^"]+)"', row).group(1)
        new = (f'    {{ firstName: "{first}", lastName: "{last}", address: "{i + 1}-{(i * 7) % 20 + 1}-{(i * 3) % 9 + 1}", '
               f'city: "名古屋市{WARDS[i % len(WARDS)]}（架空）", state: "愛知県", zip: "000-00{i:02d}", '
               f'phone: "090-0000-{1001 + i}", email: "{email}" }},')
        s = s.replace(row, new, 1)
    # 動物の名前
    s = re.sub(r'name: "([A-Za-z]+)", species:', lambda m: f'name: "{PETS.get(m.group(1), m.group(1))}", species:', s)
    # ドル→円
    s = re.sub(r'(defaultPrice|unitPrice|costPrice|price|amount|fee|totalAmount): "(\d+\.\d{2})"', yen, s)

    # 請求の小計（ドルの乱数）と税率（米国8%）を円・消費税10%に
    s = s.replace('const subtotal = (50 + Math.floor(Math.random() * 400)).toFixed(2);',
                  'const subtotal = (Math.round((50 + Math.random() * 400) * 15) * 10).toFixed(2);', 1)
    s = s.replace('const tax = (parseFloat(subtotal) * 0.08).toFixed(2);',
                  'const tax = Math.floor(parseFloat(subtotal) * 0.10).toFixed(2);', 1)

    # 残りの文言（データ部分だけ）を訳す
    start = s.index('async function seed()')
    body = s[start:]
    lits = sorted(set(re.findall(r'"((?:[^"\\]|\\.)*)"', body)))

    def wants(t):
        if not re.search(r'[A-Za-z]{3,}', t):
            return False
        if re.fullmatch(r'[a-z0-9_:.\-/]+', t):          # 列挙値・キー・パス
            return False
        if re.search(r'@|https?://|^#|\$\{|^[A-Z0-9_\-]+$', t):  # メール・URL・色・コード
            return False
        if t.startswith(('SELECT', 'INSERT', 'UPDATE')):
            return False
        return True
    todo = [t for t in lits if wants(t)]
    cache = json.load(open(CACHE, encoding='utf-8')) if os.path.exists(CACHE) else {}
    need = [t for t in todo if t not in cache]
    print(f'訳す候補 {len(todo)} 件・未訳 {len(need)} 件', flush=True)
    for i in range(0, len(need), 20):
        batch = need[i:i + 20]
        for attempt in range(3):
            try:
                out = call([json.loads(f'"{t}"', strict=False) for t in batch])
                break
            except Exception as e:  # noqa: BLE001
                print('  再試行', e, flush=True)
        else:
            continue
        for en, ja in zip(batch, out):
            cache[en] = ja
        json.dump(dict(sorted(cache.items())), open(CACHE, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
        print(f'  {i + len(batch)}/{len(need)}', flush=True)
    for en in sorted(todo, key=len, reverse=True):
        if en in cache:
            body = body.replace(f'"{en}"', json.dumps(cache[en], ensure_ascii=False))
    s = s[:start] + body
    s = ('// 日本語のデモデータ（jp/scripts/make-seed-ja.py で seed.ts から生成。直接編集しない）\n' + s)
    open(DST, 'w', encoding='utf-8').write(s)
    print('書き出し:', DST)


if __name__ == '__main__':
    sys.exit(main())
