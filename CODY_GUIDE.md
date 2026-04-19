# nabebase 開発ガイド（コディ用）

> このファイルを最初に読む。index.htmlの全文読み込みは禁止。
> 必要なセクションだけを `view_range` で読むこと。

---

## ファイル構成

```
beyan-app/
├── index.html          # 全コード（CSS + HTML + JS が1ファイル）
└── CODY_GUIDE.md       # このファイル
```

---

## index.html セクション地図

`view` ツールの `view_range` を使って必要な行だけ読む。

| セクション | 行範囲（目安） | 内容 |
|---|---|---|
| CSS | 1〜550 | スタイル定義（触らない） |
| HTML構造 | 551〜1100 | モーダル・ナビ・セクション骨格 |
| STATE・Firebase初期化 | 1101〜1250 | `S` オブジェクト、`save()`、`initFirebase()` |
| レンダリング関数 | 1251〜1600 | `renderNotes()`, `renderXPosts()`, `renderArchive()` |
| 作業フローモーダル | 1601〜1800 | `openWork()`, `genChatGPT()`, `saveManualClaudeResult()` |
| 記事編集モーダル | 1801〜1950 | `openEditModal()`, `me-save` イベント |
| 設定モーダル | 1951〜2050 | `openSettings()`, `saveGeminiTmpl()`, `saveClaudeTmpl()` |
| Claude API連携 | 2051〜2200 | `fetchClaudeApi()`, `runClaude()` |
| ツール・JSON出力 | 2201〜2350 | `generateClaudeContext()`, `copyJimmyJSON()`, `importJSON()` |
| X投稿作成 | 2351〜2550 | `generateXPosts()`, `xgenSave()`, `renderXManage()` |
| 楽天カード生成 | 2551〜2650 | `genRakutenCard()` |
| publishedArticles | 2651〜2750 | `getPublishedArticles()`, `setPublishedArticles()` |
| プロンプト見直し・失敗パターン | 2751〜2900 | `renderPromptReviews()`, `renderFailurePatterns()` |
| ワークフローナビゲーター | 2901〜3050 | `openWorkflowNav()`, `WF_STEPS`, `renderWorkflowNav()` |
| 初期化 | 3051〜末尾 | `initSec()`, `renderAll()`, `initFirebase()` の呼び出し |

---

## 開発ルール（必ず守る）

```
1. Firebase上のデータを変更するときは必ず app_version を更新する
2. 新しいキーはファイル先頭の定数セクションで宣言してから使う
3. localStorage を新たに使うことは禁止。必ずFirebaseを使う
4. 関数を削除・置き換えるときは必ずgrepで呼び出し箇所を確認してから削除する
```

---

## よくある作業パターン

### 新機能を追加する場合
1. `view index.html 1101 1250`（STATE定数を確認）
2. `view index.html 551 1100`（HTML構造の挿入箇所を確認）
3. 該当セクションの行範囲だけ読んで実装する

### 既存関数を修正する場合
1. 関数名でgrepして行番号を特定する
2. その行の前後50行だけ読む

### Firebase連携を追加する場合
1. `view index.html 1101 1250`（既存キー名を確認）
2. 新キーを `X_POSTS_KEY` などの定数として先頭に追加する
3. `app_version` を更新する

---

## 主要な定数・変数（すぐ参照できるよう抜粋）

```javascript
// Firebaseキー定数
const X_POSTS_KEY            = 'xPosts';
const X_DRAFT_POSTS_KEY      = 'xDraftPosts';
const X_PROMPT_KEY           = 'xPrompt';
const PUBLISHED_ARTICLES_KEY = 'publishedArticles';
const PUBLISHED_POSTS_KEY    = 'publishedPosts';
const PROMPT_REVIEWS_KEY     = 'beyan_promptReviews';
const FAILURE_PATTERNS_KEY   = 'beyan_failurePatterns';
const GEMINI_TMPL_KEY        = 'beyan_gemini_tmpl';
const CLAUDE_TMPL_KEY        = 'beyan_claude_tmpl';
const GEMINI_KEY_STORAGE     = 'beyan_gemini_key';
const CLAUDE_API_KEY_STORAGE = 'beyan_claude_api_key';

// Firebaseプロジェクト
// databaseURL: https://nabebase-896b6-default-rtdb.firebaseio.com

// グローバル状態
let S = { ... }    // メインデータ（notes, xposts, neta など）
let _fbRef = null  // Firebase参照
let curId = null   // 現在開いている記事ID

// セクション開閉状態
const secState = {axis, notes, xposts, xprompt, xwrite, archive, tools, import, promptreviews, failurepatterns}

// データ保存
save()   // S をFirebaseに書き込む（変更後は必ず呼ぶ）
```

---

## NG行動

- `view index.html` を範囲指定なしで実行する → 全文読み込みになってトークン爆発
- 同一セクションを何度も読み直す → 最初に必要な範囲をまとめて読む
- CSSセクション（1〜550行）を読む → デザイン変更でない限り不要

---

## セクション境界マーカー（index.html内）

以下の文字列でgrepすると各セクション先頭が見つかる：

```
// ================================================================
// STATE
// ================================================================
→ STATE・Firebase初期化セクション

// ================================================================
// NOTE LIST
// ================================================================
→ renderNotes()

// ================================================================
// X POSTS
// ================================================================
→ renderXPosts()

// ================================================================
// 機能①②③：ツールタブ
// ================================================================
→ ツール・JSON出力セクション

// ================================================================
// X投稿 データ操作
// ================================================================
→ publishedArticles・X投稿操作セクション
```
