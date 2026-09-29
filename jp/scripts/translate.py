#!/usr/bin/env python3
"""jp/messages_en.json の英語の文言を、ローカルの gemma4 で日本語に訳して
apps/web/lib/i18n/messages/ja.json に書く（済んだものは飛ばす＝何度でも再開できる）。

- 用語は GLOSSARY に固定する（動物病院で実際に使う言い方）。
- 機械検証: 数字・{name}・$・%・URL・「OpenVPM」などの固有名が訳文に残っているか。
  落ちたものは ja.json に入れず outputs/translate_rejects.json に残す（英語のまま表示される）。

使い方: /usr/bin/python3 jp/scripts/translate.py [--batch 30] [--limit N]
"""
import argparse
import json
import os
import re
import sys
import time
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'jp', 'messages_en.json')
DST = os.path.join(ROOT, 'apps', 'web', 'lib', 'i18n', 'messages', 'ja.json')
REJ = os.path.join(ROOT, 'outputs', 'translate_rejects.json')
OLLAMA = os.environ.get('OLLAMA_URL', 'http://192.168.0.3:11434') + '/api/chat'
MODEL = os.environ.get('OLLAMA_MODEL', 'gemma4:12b-it-qat')

GLOSSARY = """\
Patient=患者 / Patients=患者（動物病院の患者＝動物。括弧書きは付けない） / Client=飼い主 / Owner=飼い主 / Clients=飼い主
Appointment=予約 / Schedule=予約表 / Records=カルテ / Medical record=カルテ / SOAP note=SOAP記録
Billing=会計 / Invoice=請求書 / Estimate=見積もり / Payment=支払い / Checkout=会計 / Check In=受付 / Checked In=受付済み
Inventory=在庫 / Product=商品 / Service=診療項目 / Lab=検査 / Lab result=検査結果 / Lab Inbox=検査結果の受信箱
Recalls=再診のご案内 / Care Reminders=ケアのお知らせ / Reminder=お知らせ / Whiteboard=ホワイトボード
Controlled Substances=麻薬・向精神薬 / Controlled substance=麻薬・向精神薬
Vaccination=ワクチン接種 / Vaccine=ワクチン / Prescription=処方 / Refill=追加処方 / Dose=用量 / Medication=薬
Species=動物種 / Breed=品種 / Sex=性別 / Weight=体重 / Microchip=マイクロチップ / Allergy=アレルギー
Spayed=避妊済み / Neutered=去勢済み / Deceased=死亡 / Active=有効 / Inactive=無効
Encounter=診察 / Visit=来院 / Exam=診察 / Treatment=処置 / Procedure=処置 / Diagnosis=診断 / Problem list=問題リスト
Veterinarian=獣医師 / Doctor=獣医師 / Technician=動物看護師 / Front Desk=受付 / Staff=スタッフ
Practice=動物病院 / Clinic=動物病院 / Location=院 / Practice Admin=病院管理者 / Admin=管理者
Dashboard=ダッシュボード / Reports=レポート / Settings=設定 / Inbox=受信箱 / Agent=エージェント
Imported History=取り込んだ履歴 / Portal=飼い主ポータル / Pet Portal=飼い主ポータル / Wellness plan=ウェルネスプラン
Consent=同意書 / Discharge=退院 / Estimate=見積もり / Template=テンプレート / Audit log=操作記録
Sign in=ログイン / Sign out=ログアウト / Save=保存 / Cancel=キャンセル / Delete=削除 / Edit=編集 / New=新規
Search=検索 / Loading=読み込み中 / Retry=再試行 / Try Again=もう一度試す
"""

SYSTEM = f"""あなたは動物病院向けの業務システム（電子カルテ・予約・会計）の画面を日本語に訳す翻訳者です。
与えられた JSON 配列の英語の文言を、同じ順番・同じ件数の日本語の JSON 配列で返してください。

規則:
- 画面のボタン・見出し・説明文として自然な、丁寧すぎない日本語にする（です・ます調。ボタンや見出しは体言止め）。
- 用語は次の対応表に必ず従う:
{GLOSSARY}
- 数字、{{name}} のような波かっこ、$、%、URL、メールアドレス、記号（…、→、·、:、(、)）はそのまま残す。
- OpenVPM、SOAP、SMS、API、CSV、PDF、Stripe、IDEXX、Antech、Zoetis、MFA などの固有名・略語は訳さない。
- 文の断片（前後に数字や名前が入る部分）もあります。断片のまま訳し、勝手に文を補わない。
  先頭・末尾の空白や記号（"(", ":", "·" など）は保つ。
- 余計な説明は書かず、JSON 配列だけを返す。"""


def call(batch):
    body = {
        'model': MODEL, 'stream': False, 'think': False, 'format': 'json',
        'options': {'temperature': 0.1, 'num_predict': 6000, 'num_ctx': 8192},
        'messages': [
            {'role': 'system', 'content': SYSTEM},
            {'role': 'user', 'content': json.dumps({'items': batch}, ensure_ascii=False)
             + '\n\n{"items": [...訳文...]} の形で、items に同じ件数の訳文を入れて返してください。'},
        ],
    }
    req = urllib.request.Request(OLLAMA, data=json.dumps(body).encode(), headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=600) as r:
        out = json.loads(r.read())
    txt = out['message']['content']
    data = json.loads(txt)
    items = data.get('items') if isinstance(data, dict) else data
    if not isinstance(items, list) or len(items) != len(batch):
        raise ValueError(f'件数が合わない: {len(batch)} → {len(items) if isinstance(items, list) else type(items)}')
    return [str(x) for x in items]


KEEP = re.compile(r'\{\w+\}|\$|%|\d+(?:[.,]\d+)?|https?://\S+|[\w.+-]+@[\w.-]+|OpenVPM|SOAP|SMS|API|CSV|PDF|Stripe|MFA')


def check(en, ja):
    """訳文が壊れていないか。問題があれば理由を返す。"""
    if not ja.strip():
        return '空'
    extra = set(re.findall(r'\{\w+\}', ja)) - set(re.findall(r'\{\w+\}', en))
    if extra:
        return f'英語に無い {"".join(sorted(extra))} を足した'
    for tok in KEEP.findall(en):
        if tok not in ja:
            return f'「{tok}」が消えた'
    if not re.search(r'[぀-ヿ一-鿿]', ja) and re.search(r'[A-Za-z]{3,}', en):
        # 固有名だけの文言（例: "OpenVPM Guides" は "OpenVPM ガイド"）以外で英語のまま返したもの
        return '訳されていない'
    for ch in ('(', ')', ':', '·'):
        if en.startswith(ch) and not ja.startswith(ch):
            return f'先頭の「{ch}」が消えた'
        if en.endswith(ch) and not ja.rstrip().endswith((ch, '）' if ch == ')' else ch, '：' if ch == ':' else ch)):
            return f'末尾の「{ch}」が消えた'
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--batch', type=int, default=30)
    ap.add_argument('--limit', type=int, default=0)
    a = ap.parse_args()
    src = list(json.load(open(SRC, encoding='utf-8')).keys())
    ja = json.load(open(DST, encoding='utf-8')) if os.path.exists(DST) else {}
    rej = json.load(open(REJ, encoding='utf-8')) if os.path.exists(REJ) else {}
    todo = [m for m in src if m not in ja]
    if a.limit:
        todo = todo[:a.limit]
    print(f'全 {len(src)} 件・訳済み {len(ja)} 件・今回 {len(todo)} 件', flush=True)
    t0 = time.time()
    for i in range(0, len(todo), a.batch):
        batch = todo[i:i + a.batch]
        for attempt in range(3):
            try:
                out = call(batch)
                break
            except Exception as e:  # noqa: BLE001
                print(f'  再試行 {attempt + 1}: {e}', flush=True)
                time.sleep(3)
        else:
            print(f'  {i}: 3回失敗、飛ばす', flush=True)
            continue
        ok = 0
        for en, jp in zip(batch, out):
            why = check(en, jp)
            if why:
                rej[en] = {'ja': jp, 'why': why}
            else:
                ja[en] = jp
                rej.pop(en, None)
                ok += 1
        # 毎回書く（途中で止まっても再開できる）
        json.dump(dict(sorted(ja.items())), open(DST, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
        os.makedirs(os.path.dirname(REJ), exist_ok=True)
        json.dump(rej, open(REJ, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
        done = i + len(batch)
        el = time.time() - t0
        print(f'  {done}/{len(todo)} 合格 {ok}/{len(batch)}（{el/60:.1f}分・残り約{el/done*(len(todo)-done)/60:.0f}分）', flush=True)
    print(f'完了: 訳済み {len(ja)} 件・差し戻し {len(rej)} 件')


if __name__ == '__main__':
    sys.exit(main())
