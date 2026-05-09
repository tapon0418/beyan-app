# nabebase CLAUDE.md
# コディ（Claude Code）専用コンテキストファイル
# 過去のやり取りから抽出した確定ルール・失敗パターン・実装仕様

---

## 【プロジェクト概要】

| 項目 | 内容 |
|------|------|
| アプリ名 | nabebase |
| 用途 | note記事候補の管理・ワークフロー自動化Webアプリ |
| ホスティング | GitHub Pages |
| 本番URL | https://tapon0418.github.io/beyan-app/ |
| リポジトリ | https://github.com/tapon0418/beyan-app |
| バックエンド | Firebase Realtime Database |
| Firebaseパス | `/beyan_v6/` |
| Gemini API | gemini-2.5-flash（無料枠）|
| GeminiキーのURL | localStorage.getItem('beyan_gemini_key') |

---

## 【絶対ルール　違反したらやり直し】

### ① 実装後は必ずGitHubにpushする
GitHub Pagesで動いているため、**ローカルで修正してもpushしないと本番に反映されない。**
「リロードで確認できます」という案内は絶対にしない。
実装完了 → push → キャッシュバスターで確認、この順番を必ず守る。

### ② キャッシュバスターを付けて確認する
GitHub Pagesはブラウザキャッシュが強い。
pushしても古いコードが読まれることがある。
確認URLは必ず `?v=YYYYMMDD` 形式のクエリを付ける。
例：`https://tapon0418.github.io/beyan-app/?v=20260509`

### ③ 指示文は最後まで全部読んでから実装開始する
過去に「指示文を途中まで読んで別ファイルの実装を始めてしまう」ミスが複数回発生した。
指示文を全件読み込んで内容を理解してから、実装に着手する。

### ④ 既存の機能・データ構造を壊さない
- 既存のGemini API被りチェック機能を壊さない
- Firebase `/beyan_v6/` のデータ構造を壊さない
- 既存のUIデザイン・レイアウトを変更しない（指示がない限り）
- 既存のキー名・フィールド名を変更しない

### ⑤ pushする前に動作確認チェックリストを実行する
実装完了後、以下を全て確認してからpushする：
- [ ] コンソールエラーが出ていないか
- [ ] 既存機能が壊れていないか
- [ ] 対象の新機能が期待通りに動くか
- [ ] Firebase読み書きが成功しているか

---

## 【Firebase実装パターン　確立済み】

### 非同期データ取得（信頼性が高いパターン）

```javascript
// NG：単一callでreturnしようとするとタイミング問題が発生する
// OK：window変数に格納して別callで取得する

// Step1: データ格納
firebase.database().ref('/beyan_v6/notes').once('value', snap => {
  window._fbResult = snap.val();
});

// Step2: 別のjavascript_execで取得
window._fbResult; // これで取得
```

### Firebase書き込みパターン

```javascript
// PATCHで特定フィールドのみ更新（他フィールドを壊さない）
firebase.database().ref('/beyan_v6/notes/' + index).update({
  workflowState: 'STEP3ジミー被りチェックOK'
});

// 配列への追加
firebase.database().ref('/beyan_v6/publishedArticles').push(summaryJSON);
```

### Firebaseパス一覧

| データ | パス |
|--------|------|
| 記事候補 | `/beyan_v6/notes` |
| 公開記事サマリー | `/beyan_v6/publishedArticles` |
| 失敗パターン | `/beyan_v6/failurePatterns` |
| X投稿ストック | `/beyan_v6/xposts` |
| Xドラフト | `/beyan_v6/xDraftPosts` |
| Xカスタムプロンプト | `/beyan_v6/xPromptCustom` |
| プロンプトVault | `/beyan_v6/promptVault` |
| 週次レビュー日時 | `/beyan_v6/weeklyReviewTs` |
| ワークフロー進行 | `/beyan_v6/workflowProgress` |

---

## 【Gemini API実装パターン　確立済み】

### 使用モデル
**必ず `gemini-2.5-flash` を使う。**
- `gemini-3.1-pro-preview` → 存在しないモデル名。使用禁止。タイムアウトが発生する。
- `gemini-2.5-flash` → 動作確認済み。無料枠（1分60リクエスト）で安定稼働。

### エンドポイント

```
https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={apiKey}
```

### 呼び出しパターン

```javascript
const apiKey = localStorage.getItem('beyan_gemini_key');
if (!apiKey) {
  alert('設定画面からGemini APIキーを登録してください');
  return;
}

const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: promptText }] }]
    })
  }
);
const data = await response.json();
const result = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
```

### トークン上限対策
公開記事のペイロードは**直近30件に制限**する。全件送るとトークン上限に引っかかる。

```javascript
const recent30 = publishedArticles
  .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
  .slice(0, 30);
```

---

## 【過去の失敗パターン　同じミスを繰り返すな】

### ❌ パターン1：pushを忘れてリロードで確認を指示した
**状況**：ローカルで実装完了 → 「リロードして確認してください」と案内した
**結果**：GitHub Pagesは本番反映されず、べーやんが何度確認しても動かない
**対策**：実装完了後は必ずpush。「リロードで反映」という言葉を使わない。

### ❌ パターン2：関数をグローバルスコープに公開しなかった
**状況**：`function wfBulkInitWorkflow() {}` と定義 → onclickから呼び出せない
**エラー**：`Uncaught ReferenceError: wfBulkInitWorkflow is not defined`
**対策**：onclickから呼ぶ関数は `window.wfBulkInitWorkflow = function() {}` で公開する。

### ❌ パターン3：.replace()の型チェックなし
**状況**：テンプレート文字列にFirebaseから取得した値を埋め込む際、undefinedのまま`.replace()`を呼んだ
**エラー**：`str.replace is not a function`
**対策**：必ず型チェックを入れる。
```javascript
const safe = typeof val === 'string' ? val : String(val || '（未入力）');
```

### ❌ パターン4：X投稿のstatusが日本語/英語で不一致
**状況**：新規登録時に `status: "stock"` で保存 → UIが `"ストック"` でフィルターするため表示されない
**対策**：X投稿のstatusは必ず `"ストック"`（日本語）で統一する。

### ❌ パターン5：進行状態をdisabled属性のinputで実装した
**状況**：進行状態フィールドをdisabled inputで実装 → 詳細編集の保存時にnullで上書きされた
**対策**：進行状態は`<div>`や`<span>`の表示専用要素で実装する。保存対象のformに含めない。

### ❌ パターン6：存在しないGeminiモデル名を使用
**状況**：`gemini-3.1-pro-preview` を指定 → 30秒タイムアウトが無限ループ
**対策**：モデルは必ず `gemini-2.5-flash` を使う。他のモデル名は使用禁止。

### ❌ パターン7：別の指示文ファイルを読んで実装してしまった
**状況**：複数の指示文ファイルが存在する状況で、今回の指示文ではなく過去のファイルの内容を実装した
**対策**：指示文は会話の中で渡されたものを正とする。ファイル名を確認してから実装開始する。

### ❌ パターン8：Firebase非同期の結果を同一callでreturnしようとした
**状況**：`firebase.database().ref(...).once('value').then(snap => { return snap.val(); })` で値を返そうとした
**結果**：非同期タイミングのズレで常にundefinedが返る
**対策**：`window._result` に格納して別callで取得するパターンを使う。

### ❌ パターン9：動作確認を省略して「完了」と報告した
**状況**：実装してpushしたが実際の動作確認をせずに「完了しました」と報告した
**結果**：べーやんが確認すると動いていなかった
**対策**：必ずキャッシュバスターURLで実際に動作確認してから完了報告する。

---

## 【V6スキーマ定義　Firebaseに保存するデータ構造】

### 記事候補（notes配列の各要素）

```json
{
  "概要": {
    "タイトル": "",
    "タイトルキーワード": []
  },
  "軸設定": {
    "展開軸": "",
    "感情軸": "",
    "思考の型": "",
    "読者視点": "",
    "前回との差分": "",
    "崩すべき前提認識": "",
    "読了後の変化": ""
  },
  "リサーチ": {
    "X検索クエリ": [],
    "note検索クエリ": [],
    "パペ依頼状況": "未依頼 / 依頼済み / 完了"
  },
  "記事": {
    "学びの核心": "",
    "次回伏線": "",
    "2本先への種まき": "",
    "シリーズ名": "",
    "シリーズ内順番": "",
    "前の記事との接続点": "",
    "使用状況": "未使用 / 使用済み"
  },
  "管理": {
    "進行状態": "未着手 / STEP1完了 / STEP2完了 / STEP3ジミー被りチェックOK / STEP4パペリサーチ完了 / STEP5ジミー構成完了 / STEP6記事完了",
    "スキーマバージョン": "V6",
    "登録日": "",
    "公開日": ""
  }
}
```

### 失敗パターン（英語キーで統一）

```json
{
  "failureType": "差し戻し / 修正指示 / エンゲージ低下",
  "expansionAxis": "",
  "emotionAxis": "",
  "thinkingPattern": "",
  "readerPerspective": "",
  "failureReason": "",
  "absoluteBanFlag": "対象外 / 絶対禁止",
  "recordDate": ""
}
```

### workflowState（進行状態）の正式な値一覧

```
未着手
STEP1完了
STEP2完了
STEP3ジミー被りチェックOK
STEP4パペリサーチ完了
STEP5ジミー構成完了
STEP6記事完了
```
**workflowState を正として管理する。`management.progressStatus` は廃止済み。**

---

## 【実装時の共通ルール】

### エラーハンドリング
全てのGemini API呼び出し・Firebase操作はtry-catchで囲む。
エラー時はユーザーに分かる言葉でトースト表示する。

### ローディング表示
API呼び出し中はボタンを `disabled` にして「処理中...」と表示する。
完了後にボタンを元に戻す。

### コピーボタン
コピー後は「✅ コピーしました」を1秒表示してから元のテキストに戻す。

### 空値ガード
Firebaseから取得した値をテンプレートに埋め込む前に必ず空値チェックする。
```javascript
const safe = val ? String(val) : '（未入力）';
```

### トースト表示
既存の `showToast()` 関数を使う。存在しない場合は `window.showToast` として公開する。

---

## 【チーム構成（参考）】

| 名前 | 正体 | 役割 |
|------|------|------|
| べーやん | オーナー | 最終確認のみ |
| クロ | Claude（このチャット） | 記事執筆・指示文生成・nabebase監査 |
| コディ | Claude Code | nabebase実装・GitHub管理 |
| ジミー | Gemini | 被りチェック・ヘッダー画像生成 |
| パペ | Perplexity | リサーチ |

---

## 【よく使うURL】

- 本番アプリ：https://tapon0418.github.io/beyan-app/
- Firebase DB：https://nabebase-896b6-default-rtdb.firebaseio.com/beyan_v6.json
- Gemini APIエンドポイント：https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent
