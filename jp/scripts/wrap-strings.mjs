#!/usr/bin/env node
// 直書きの英語の文言を tx("...") で包む一括変換（日本語化キット用）。
//
// 対象（apps/web の .tsx。テストは除く）:
//   1) JSX のテキスト            <h1>Patients</h1>            → <h1>{tx("Patients")}</h1>
//   2) 表示用の属性の文字列      placeholder="Search..."        → placeholder={tx("Search...")}
//   3) toast の第1引数           toast.error("Could not save")  → toast.error(tx("Could not save"))
//   4) 表示用のキーの値          { label: "Dashboard" }         → { label: tx("Dashboard") }
// 文言そのものを鍵にするので、訳が無ければ英語のまま表示される（docs/I18N.md の English fallback）。
//
// 使い方: node jp/scripts/wrap-strings.mjs [--dry] [--list out.json] [ファイル...]
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../..");
const WEB = path.join(ROOT, "apps/web");
const require = createRequire(path.join(WEB, "package.json"));
const ts = require("typescript");

const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const listIdx = args.indexOf("--list");
const LIST = listIdx >= 0 ? args[listIdx + 1] : null;
const explicit = args.filter((a, i) => !a.startsWith("--") && !(listIdx >= 0 && i === listIdx + 1));

const ATTRS = new Set([
  "placeholder", "title", "label", "aria-label", "alt", "description", "emptyMessage",
  "helperText", "tooltip", "confirmLabel", "cancelLabel", "confirmText", "cancelText",
  "heading", "subtitle", "emptyTitle", "emptyDescription", "submitLabel", "actionLabel",
]);
const PROP_KEYS = new Set(["label", "title", "description", "placeholder", "emptyMessage", "subtitle", "heading", "helperText", "tooltip"]);
const TOAST = new Set(["toast", "success", "error", "info", "warning", "message", "loading"]);
const SKIP_TAGS = new Set(["code", "pre", "kbd", "style", "script", "samp"]);

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", rarr: "→", larr: "←",
  middot: "·", mdash: "—", ndash: "–", hellip: "…", rsquo: "’", lsquo: "‘", ldquo: "“", rdquo: "”", times: "×",
  bull: "•", copy: "©", reg: "®", trade: "™", deg: "°", plusmn: "±" };
function decode(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === "#") return String.fromCodePoint(e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

// 訳す価値のある英語か（コード・URL・記号だけ・1文字の略号は除く）
function isProse(s) {
  const v = s.trim();
  if (!/[A-Za-z]{2,}/.test(v)) return false;
  if (/^(https?:|mailto:|\/|#|\.\/|@)/.test(v)) return false;
  if (/[{}<>=]|=>|\(\)|;$/.test(v)) return false;
  if (/^[\w.-]+@[\w.-]+$/.test(v)) return false;          // メール
  if (/^[a-z]+[A-Z][A-Za-z]*$/.test(v)) return false;      // camelCase
  if (/^[a-z0-9_.-]+$/.test(v) && /[_.]/.test(v)) return false; // snake_case / dotted.id
  if (/^[A-Z0-9_]{2,}$/.test(v) && v.length <= 4) return false;  // MN / FS / PA などの略号
  return true;
}

function listFiles() {
  if (explicit.length) return explicit.map((f) => path.resolve(f));
  const out = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.name === "node_modules" || e.name === ".next" || e.name === "__tests__") continue;
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith(".tsx") && !/\.(test|spec)\.tsx$/.test(e.name)) out.push(p);
    }
  })(WEB);
  return out.sort();
}

function hasIdentifier(sf, name) {
  let found = false;
  (function visit(n) {
    if (found) return;
    if (ts.isIdentifier(n) && n.text === name) { found = true; return; }
    ts.forEachChild(n, visit);
  })(sf);
  return found;
}

function insideSkippedTag(node) {
  for (let p = node.parent; p; p = p.parent) {
    if (ts.isJsxElement(p)) {
      const tag = p.openingElement.tagName.getText();
      if (SKIP_TAGS.has(tag)) return true;
    }
  }
  return false;
}

const allMessages = new Map(); // message -> [file:line]

function processFile(file) {
  const src = fs.readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  // すでに @/lib/i18n から取り込んでいればその名前を使う（2回目以降の実行で別名にしない）
  const existing = src.match(/import \{([^}]*)\} from "@\/lib\/i18n";/);
  const bound = existing && existing[1].split(",").map((x) => x.trim()).find((x) => x === "tx" || x === "tx as txUi");
  const fn = bound ? (bound === "tx" ? "tx" : "txUi") : hasIdentifier(sf, "tx") ? "txUi" : "tx";
  if (fn === "txUi" && hasIdentifier(sf, "txUi")) throw new Error(`name clash in ${file}`);
  const edits = []; // {start, end, text}
  const call = (msg) => `${fn}(${JSON.stringify(msg)})`;
  const note = (msg, node) => {
    const line = sf.getLineAndCharacterOfPosition(node.getStart()).line + 1;
    const rel = path.relative(ROOT, file) + ":" + line;
    if (!allMessages.has(msg)) allMessages.set(msg, []);
    allMessages.get(msg).push(rel);
  };

  function visit(node) {
    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && ["tx", "txUi", "txv"].includes(node.expression.text)) return;
    // 1) JSX テキスト
    if (ts.isJsxText(node) && !insideSkippedTag(node)) {
      const raw = node.getFullText();
      const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      const text = decode(lines.join(" "));
      if (isProse(text)) {
        const lead = raw.match(/^\s*/)[0];
        const trail = raw.match(/\s*$/)[0];
        const keepLead = lead.length > 0 && !/\n/.test(lead);
        const keepTrail = trail.length > 0 && !/\n/.test(trail);
        const rep = (keepLead ? '{" "}' : "") + `{${call(text)}}` + (keepTrail ? '{" "}' : "");
        edits.push({ start: node.getFullStart(), end: node.getEnd(), text: rep });
        note(text, node);
      }
    }
    // 2) 表示用の属性
    if (ts.isJsxAttribute(node) && node.initializer && ts.isStringLiteral(node.initializer)) {
      const name = node.name.getText();
      const v = decode(node.initializer.text);
      if (ATTRS.has(name) && isProse(v)) {
        edits.push({ start: node.initializer.getStart(), end: node.initializer.getEnd(), text: `{${call(v)}}` });
        note(v, node);
      }
    }
    // 3) toast("...") / toast.error("...")
    if (ts.isCallExpression(node) && node.arguments.length > 0) {
      const callee = node.expression;
      const nm = ts.isIdentifier(callee) ? callee.text
        : ts.isPropertyAccessExpression(callee) && ts.isIdentifier(callee.expression) && callee.expression.text === "toast" ? callee.name.text : null;
      const a0 = node.arguments[0];
      if (nm && TOAST.has(nm) && (ts.isIdentifier(callee) ? nm === "toast" : true)
          && (ts.isStringLiteral(a0) || ts.isNoSubstitutionTemplateLiteral(a0)) && isProse(a0.text)) {
        edits.push({ start: a0.getStart(), end: a0.getEnd(), text: call(a0.text) });
        note(a0.text, a0);
      }
    }
    // 5) JSX の子の式に出てくる文字列: {loading ? "Signing in..." : "Sign in"} / {x || "Not documented"}
    //    表示用の属性の式も同じ: placeholder={a ? "..." : "..."}
    if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) && isProse(node.text)) {
      let p = node.parent;
      // 三項・論理演算・かっこだけをさかのぼる
      while (p && (ts.isConditionalExpression(p) || ts.isParenthesizedExpression(p)
             || (ts.isBinaryExpression(p) && [ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken, ts.SyntaxKind.AmpersandAmpersandToken].includes(p.operatorToken.kind)))) {
        if (ts.isConditionalExpression(p) && p.condition === node) { p = null; break; }
        if (ts.isBinaryExpression(p) && p.left === node && p.operatorToken.kind === ts.SyntaxKind.AmpersandAmpersandToken) { p = null; break; }
        p = p.parent;
      }
      const inChild = p && ts.isJsxExpression(p) && p.parent && (ts.isJsxElement(p.parent) || ts.isJsxFragment(p.parent));
      const inAttr = p && ts.isJsxExpression(p) && p.parent && ts.isJsxAttribute(p.parent) && ATTRS.has(p.parent.name.getText());
      if (node.parent !== p && (inChild || inAttr) && !insideSkippedTag(node)) {
        edits.push({ start: node.getStart(), end: node.getEnd(), text: call(node.text) });
        note(node.text, node);
      } else if (node.parent === p && inChild) {
        // {"literal"} そのもの
        edits.push({ start: node.getStart(), end: node.getEnd(), text: call(node.text) });
        note(node.text, node);
      }
    }
    // 6) 英語の複数形の語尾 {n !== 1 ? "s" : ""} / `${n} month${n !== 1 ? "s" : ""}` → tx("s")（日本語は空）
    if (ts.isStringLiteral(node) && (node.text === "s" || node.text === "es") && ts.isConditionalExpression(node.parent)) {
      const c = node.parent;
      const holder = c.parent && ts.isParenthesizedExpression(c.parent) ? c.parent.parent : c.parent;
      if (holder && (ts.isJsxExpression(holder) || ts.isTemplateSpan(holder))) {
        edits.push({ start: node.getStart(), end: node.getEnd(), text: call(node.text) });
        note(node.text, node);
      }
    }
    // 7) 経路→画面名の対応表 { "/patients": "Patients" }
    if (ts.isPropertyAssignment(node) && ts.isStringLiteral(node.name) && node.name.text.startsWith("/")
        && ts.isStringLiteral(node.initializer) && isProse(node.initializer.text)) {
      edits.push({ start: node.initializer.getStart(), end: node.initializer.getEnd(), text: call(node.initializer.text) });
      note(node.initializer.text, node);
    }
    // 8) {tab.label} / {item.title} をそのまま表示している所（as const の配列など）→ {txv(tab.label)}
    if (ts.isJsxExpression(node) && node.expression && ts.isPropertyAccessExpression(node.expression)
        && ["label", "title"].includes(node.expression.name.text)
        && node.parent && (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent))) {
      const e = node.expression;
      edits.push({ start: e.getStart(), end: e.getEnd(), text: `txv(${e.getText()})`, needsTxv: true });
    }
    // 4) { label: "..." } など表示用のキー
    if (ts.isPropertyAssignment(node) && (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name))
        && PROP_KEYS.has(node.name.text) && ts.isStringLiteral(node.initializer) && isProse(node.initializer.text)) {
      // 型の位置（interface の既定値など）ではなく値の位置だけ。as const の配列は型に使われることがあるので除く
      let asConst = false;
      for (let p = node.parent; p && !ts.isSourceFile(p); p = p.parent) {
        if (ts.isAsExpression(p) && p.type.getText() === "const") { asConst = true; break; }
      }
      if (!asConst) {
        edits.push({ start: node.initializer.getStart(), end: node.initializer.getEnd(), text: call(node.initializer.text) });
        note(node.initializer.text, node);
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sf);
  if (!edits.length) return 0;

  // import を足す（最後の import の後。無ければ "use client" などの指示文の後）
  let insertAt = 0;
  for (const st of sf.statements) {
    if (ts.isImportDeclaration(st)) insertAt = st.getEnd();
    else if (ts.isExpressionStatement(st) && ts.isStringLiteral(st.expression) && insertAt === 0) insertAt = st.getEnd();
  }
  const wantTxv = edits.some((e) => e.needsTxv);
  const names = [fn === "tx" ? "tx" : "tx as txUi"].concat(wantTxv ? ["txv"] : []);
  const imp = `import { ${names.join(", ")} } from "@/lib/i18n";`;
  const already = /from "@\/lib\/i18n"/.test(src);

  edits.sort((a, b) => b.start - a.start);
  let out = src;
  for (const e of edits) out = out.slice(0, e.start) + e.text + out.slice(e.end);
  if (!already) out = out.slice(0, insertAt) + (insertAt ? "\n" : "") + imp + (insertAt ? "" : "\n") + out.slice(insertAt);
  else if (wantTxv && !/import \{[^}]*\btxv\b[^}]*\} from "@\/lib\/i18n"/.test(out)) {
    out = out.replace(/import \{([^}]*)\} from "@\/lib\/i18n";/, (m, inner) => `import {${inner.trimEnd()}, txv } from "@/lib/i18n";`);
  }
  if (!DRY) fs.writeFileSync(file, out);
  return edits.length;
}

let files = 0, total = 0;
for (const f of listFiles()) {
  const n = processFile(f);
  if (n) { files++; total += n; }
}
console.log(`${DRY ? "[dry] " : ""}${files} files, ${total} strings wrapped, ${allMessages.size} unique messages`);
if (LIST) {
  const obj = Object.fromEntries([...allMessages.entries()].sort((a, b) => a[0].localeCompare(b[0])));
  fs.writeFileSync(LIST, JSON.stringify(obj, null, 2) + "\n");
  console.log(`message list -> ${LIST}`);
}
