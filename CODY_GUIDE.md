# nabebase 開発ガイド（コディ用）

> このファイルを最初に読む。index.html / app.js の全文読み込みは禁止。
> 必要なセクションだけを `view_range` で読むこと。

---

## ファイル構成

```
beyan-app/
├── index.html          # HTML構造・CSS・外部スクリプト参照（~2543行）
├── app.js              # アプリケーションロジック全体（~4729行）
├── CODY_GUIDE.md       # このファイル
└── index_backup.html   # index.htmlのバックアップ（JS分離前）
```

**重要：JSの編集はすべて `app.js` を対象とする。index.htmlにJSは含まれていない。**

---

## index.html セクション地図（HTML/CSS）

| セクション | 行範囲（目安） | 内容 |
|---|---|---|
| CSS | 1〜1433 | スタイル定義（触らない） |
| HTML構造 | 1434〜2540 | ヘッダー・ナビ・モーダル・セクション骨格 |
| 外部スクリプト参照 | 2541 | `<script src="app.js"></script>` |

---

## app.js セクション地図

`view` ツールの `view_range` を使って必要な行だけ読む。

| セクション | 行範囲（目安） | 内容 |
|---|---|---|
| STATE | 1〜123 | `S` オブジェクト、`save()`、`initFirebase()` |
| CONSTANTS | 124〜157 | ステータスラベル・カラー・URL定数 |
| INIT | 158〜514 | DOMContentLoaded・初期化処理 |
| NOTE LIST | 515〜984 | `renderNotes()`, `buildNoteSteps()`, `toggleNoteCard()` |
| 軸の使用状況 | 985〜1091 | `renderAxisStats()` |
| X POSTS | 1092〜1137 | `renderXPosts()` |
| アーカイブ | 1138〜1993 | `renderArchive()` |
| ツール・JSON出力 | 1994〜3553 | `generateClaudeContext()`, `generateJimmyJSON()`, `importJSON()` |
| X投稿プロンプト | 3554〜3725 | X投稿プロンプト保管庫 |
| プロンプト見直し | 3726〜3808 | `renderPromptReviews()`, `openPromptReviewModal()` |
| 失敗パターン | 3809〜3898 | `renderFailurePatterns()`, `openFailurePatternModal()` |
| X投稿データ操作 | 3899〜4435 | `getPublishedArticles()`, `setPublishedArticles()` |
| ワークフローナビ | 4436〜末尾 | `openWorkflowNav()`, `WF_STEPS`, `renderWorkflowNav()` |

---

## 開発ルール（必ず守る）

```
1. Firebase上のデータを変更するときは必ず app_version を更新する
2. 新しいキーはapp.jsファイル先頭の定数セクションで宣言してから使う
3. localStorage を新たに使うことは禁止。必ずFirebaseを使う
4. 関数を削除・置き換えるときは必ずgrepで呼び出し箇所を確認してから削除する
5. 変更後は必ず node test_full.js を実行する（合格ライン: ok 11 / NG 0）
```

---

## よくある作業パターン

### 新機能を追加する場合
1. `grep -n "対象関数名" app.js` で行番号を特定する
2. 該当セクションの行範囲だけ読んで実装する

### 既存関数を修正する場合
1. 関数名でgrepして行番号を特定する
2. その行の前後50行だけ読む

### Firebase連携を追加する場合
1. `view app.js 1 123`（既存キー名を確認）
2. 新キーを `X_POSTS_KEY` などの定数として先頭に追加する
3. `app_version` を更新する

---

## 主要な定数・変数（すぐ参照できるよう抜粋）

```javascript
// Firebaseキー定数（app.js先頭付近）
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

- `view app.js` を範囲指定なしで実行する → 全文読み込みになってトークン爆発
- `view index.html` でJSを探す → JSはapp.jsにある
- 同一セクションを何度も読み直す → 最初に必要な範囲をまとめて読む
- CSSセクション（index.html 1〜1433行）を読む → デザイン変更でない限り不要

---

## セクション境界マーカー（app.js内）

以下の文字列でgrepすると各セクション先頭が見つかる：

```
// ================================================================
// STATE
// ================================================================
→ STATE・Firebase初期化セクション（app.js 1行目）

// ================================================================
// NOTE LIST
// ================================================================
→ renderNotes()（app.js ~515行目）

// ================================================================
// X POSTS
// ================================================================
→ renderXPosts()（app.js ~1092行目）

// ================================================================
// 機能①②③：ツールタブ
// ================================================================
→ ツール・JSON出力セクション（app.js ~1994行目）

// ================================================================
// X投稿 データ操作
// ================================================================
→ publishedArticles・X投稿操作セクション（app.js ~3899行目）

// ================================================================
// 執筆ワークフローナビゲーター
// ================================================================
→ WF_STEPS・openWorkflowNav()（app.js ~4436行目）
```
