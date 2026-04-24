// ================================================================
// STATE
// ================================================================
const KEY = 'beyan_v6';
const SHARE_STATS_KEY = 'beyan_share_stats';
// X新データモデル（INIT前に必要なため先頭で宣言）
const X_POSTS_KEY            = 'xPosts';
const X_DRAFT_POSTS_KEY      = 'xDraftPosts';
const X_PROMPT_KEY           = 'xPrompt';
const PUBLISHED_ARTICLES_KEY = 'publishedArticles';
const PUBLISHED_POSTS_KEY    = 'publishedPosts';
const PROMPT_REVIEWS_KEY     = 'beyan_promptReviews';
const FAILURE_PATTERNS_KEY   = 'beyan_failurePatterns';
let _xManageTab    = 'stock';
let _xManageFilter = 'all';
let _overlapResults = {};
const DEFAULT_X_PROMPT =
`あなたはX（Twitter）投稿文の専門家です。
以下の素材をもとに、投稿文を作成できる限り多く生成してください。
素材に含まれるネタを一つも無駄にせず、全て使い切ってください。

【素材】
\${materialText}

【投稿タイプ】
\${type}

【発信者プロフィール】
・39歳・女性ではなく男性
・3交代勤務（日勤・準夜勤・夜勤）の会社員
・スクールの残債あり・一軒家持ち
・副業に取り組んでいる現在進行形
※この情報は毎回そのまま使わない。伝え方を毎回変えること。同じ表現の繰り返し禁止。

【読者層】
3交代勤務や夜勤をこなしながら副業に取り組んでいる人。
時間・体力・お金の制約がある。スキルよりリアルな体験談に反応する。

【タイプ別構成ルール】
タイプA（朝7時・拡散）：
・冒頭1文目：失敗・停滞・時間ロスの具体的な事実
・中盤：状況の描写（時間・数字・場面）
・末尾：余韻・問いかけ・次への期待感
・note誘導は入れない

タイプB（夜21時・note誘導なし）：
・冒頭：問題提起または意外な事実
・中盤：なぜそうなるかの原因を1つだけ
・末尾：余韻で締める（note誘導は入れない）

【絵文字ルール】
・本文中に最大4個まで使用可
・冒頭に同じ絵文字を連続して使わない
・絵文字は感情や状況を補強する位置に置く

【文体ルール】
・一人称は「私」
・語尾は「〜でした」「〜してます」の淡々とした事実ベースと感情を乗せた表現のハイブリッド
・煽り・教訓・抽象論で終わらない

【絶対禁止】
・「頑張ったら報われた」「諦めなければ大丈夫」系
・「〇つのポイント」「〇ステップ」系の構成
・ハッシュタグ
・冒頭に同じ絵文字を使う投稿を複数生成する
・数字をリサーチ結果からそのまま引用する
・文章構造が似た投稿を複数生成する
・言葉を入れ替えただけの投稿を複数生成する
・存在しないnote記事への誘導

【出力ルール】
・140字以内
・投稿文の本文のみ
・各投稿文の前に「【タイプA】」または「【タイプB】」を明記
・説明・補足・かっこ書きは不要`;
let _fromLocalStorage = false; // Firebase移行済みフラグ
let S = (() => {
  const s6 = JSON.parse(localStorage.getItem('beyan_v6') || 'null');
  if (s6) { _fromLocalStorage = true; if(!s6.weeklyReviews) s6.weeklyReviews=[]; if(!s6.neta) s6.neta=[]; return s6; }
  // v5からの移行
  const s5 = JSON.parse(localStorage.getItem('beyan_v5') || 'null');
  if (s5) { _fromLocalStorage = true; return { ...s5, weeklyReviews: [], neta: [] }; }
  // v4 / v2 からの移行
  const old = JSON.parse(localStorage.getItem('beyan_v4') || localStorage.getItem('beyan_v2') || 'null');
  return {
    xf: 'all',
    weeklyReviews: [],
    neta: [],
    xposts: old?.xposts || [
      {id:1,type:'A',content:'✨副業ライター始める前「実績ないし無理かも」って思ってた。\n実際やってみたら、実績より提案文の書き方だった。\n実績ゼロで2件受注できた。\n始める前の不安って、案外ただの思い込み。',status:'stock',createdAt:'2026-03-10'},
      {id:2,type:'B',content:'📝提案文47件送って返信2件。\nでもその2件が今につながってる。\n実績ゼロから案件取るまでの全過程をnoteにまとめた。\n同じ状況の人が前に進むきっかけになれば✨',status:'stock',createdAt:'2026-03-10'},
    ],
    notes: [
    { id:101, title:'副業ライターが「腱鞘炎」で詰んだ話→楽天で揃えた神ガジェット5選', type:'ハウツー(B)', cat:'ライティング', status:'done', publishDate:'10月', rakuten:true, memo:'エルゴノミクスマウス、リストレスト。健康×仕事。', prevLink:'', nextLink:'体を大事にする', researchNote:'ジミー：腱鞘炎対策グッズ' },
    { id:102, title:'noteとクラウドワークス、どっちで稼ぐべきか　1年検証の結論', type:'エッセイ(A)', cat:'ライティング', status:'done', publishDate:'10月', rakuten:false, memo:'', prevLink:'', nextLink:'どっちで稼ぐべきか3ヶ月検証の1年版', researchNote:'' },
    { id:103, title:'有料楽天経済圏×副業ライター【入門編】年間10万円ポイント獲得の全財', type:'エッセイ(A)', cat:'ライティング', status:'done', publishDate:'11月', rakuten:true, memo:'', prevLink:'', nextLink:'', researchNote:'' },
    { id:104, title:'副業ライター1年目の総まとめ　0部から→1部に変えた全記録', type:'エッセイ(A)', cat:'振り返り', status:'done', publishDate:'11月', rakuten:false, memo:'', prevLink:'', nextLink:'', researchNote:'' },
    { id:105, title:'副業ライター1年目、楽天経済圏で暮らしてて気がついたこと', type:'タイプ', cat:'カテゴリ', status:'done', publishDate:'2月', rakuten:true, memo:'', prevLink:'', nextLink:'', researchNote:'' },
    { id:106, title:'note、ノウハウより人柄が大事だと言われた話　戦略を変えてみる', type:'エッセイ(A)', cat:'副業', status:'done', publishDate:'3月', rakuten:false, memo:'戦略を変えてみる：ノウハウより人柄が大事', prevLink:'', nextLink:'', researchNote:'' },
    { id:107, title:'副業ライター、1週間の振り返り　やってよかったこと・失敗したこと', type:'エッセイ(A)', cat:'楽天', status:'done', publishDate:'3月', rakuten:true, memo:'副業ライター1週間振り返り：成功と失敗', prevLink:'', nextLink:'', researchNote:'' },
    { id:108, title:'副業と本業、どうバランス取ってる？　1週間のリアルなスケジュール公開', type:'エッセイ(A)', cat:'楽天', status:'done', publishDate:'3月', rakuten:true, memo:'副業と本業のバランス：リアルなスケジュール', prevLink:'', nextLink:'', researchNote:'' },
    { id:109, title:'ChatGPTとClaudeを1週間使い分けてみた　気づいた3つの違い', type:'AI活用', cat:'楽天', status:'done', publishDate:'3月', rakuten:true, memo:'ChatGPT vs Claude：1週間使い分けの3つの違い', prevLink:'', nextLink:'', researchNote:'' },
    { id:110, title:'Aiに投げて失敗した記事、5本振り返ってみる', type:'エッセイ(A)', cat:'楽天', status:'idea', publishDate:'3月', rakuten:true, memo:'AIで失敗した記事5本の振り返り', prevLink:'', nextLink:'', researchNote:'' },
    { id:111, title:'note記事、公開1週間の数字をまとめてみた　予想と違った3つのこと', type:'エッセイ(A)', cat:'楽天', status:'idea', publishDate:'3月', rakuten:true, memo:'公開1週間の数字：予想外の3つのこと', prevLink:'', nextLink:'', researchNote:'' },
    { id:112, title:'300円vs500円vs980円のnote、どれが一番売れた？　note価格テスト全記録', type:'エッセイ(A)', cat:'ライティング', status:'idea', publishDate:'3月', rakuten:true, memo:'note価格テスト：300円/500円/980円の比較', prevLink:'', nextLink:'', researchNote:'' },
    { id:113, title:'索引記事：副業ライター×AI活用、30本の記事どれから読む？', type:'AI活用', cat:'ライティング', status:'idea', publishDate:'3月', rakuten:true, memo:'索引記事：30本の記事ロードマップ', prevLink:'', nextLink:'', researchNote:'' },
    { id:114, title:'副業ライター、2週間の振り返り　数字と気持ちの記録', type:'エッセイ(A)', cat:'楽天', status:'idea', publishDate:'3月', rakuten:true, memo:'副業ライター2週間振り返り：数字とメンタル', prevLink:'', nextLink:'', researchNote:'' },
    { id:115, title:'副業ライター提案文テンプレ作ってみた　通過率が上がった書き方', type:'ハウツー(B)', cat:'楽天', status:'idea', publishDate:'3月', rakuten:true, memo:'提案文テンプレ：通過率アップの書き方', prevLink:'', nextLink:'', researchNote:'' },
    { id:116, title:'情報を読みすぎて助けなかった私、環境を変えるようになった話', type:'エッセイ(A)', cat:'ライティング', status:'idea', publishDate:'4月', rakuten:true, memo:'環境改善グッズで変わった体験。情報過多からの脱却。', prevLink:'「情報を読みすぎて…」の解決編', nextLink:'', researchNote:'ジミー：集中力を高める環境改善グッズ' },
    { id:117, title:'クラウドワークスの報酬、楽天銀行で受け取る3ステップ', type:'ハウツー(B)', cat:'楽天', status:'idea', publishDate:'4月', rakuten:true, memo:'振込手数料の最適化、図解多め。1500文字以内。', prevLink:'「月3万円のロードマップ」の実務編', nextLink:'', researchNote:'ジミー：楽天銀行ハッピープログラム最新情報' },
    { id:118, title:'確定申告で詰んだ→楽天マネーフォワード連携で解決', type:'ハウツー(B)', cat:'楽天', status:'idea', publishDate:'5月', rakuten:true, memo:'失敗談→解決策。楽天カード・銀行の連携で自動化。', prevLink:'「副業ライターのリアルな思考ログ」の延長', nextLink:'', researchNote:'ジミー：マネーフォワード連携方法' },
    { id:119, title:'「いつか始める」をやめて、今すぐ動くために買った3つのもの', type:'エッセイ(A)', cat:'楽天', status:'idea', publishDate:'6月', rakuten:true, memo:'タイマー、タスク管理ツール、環境改善グッズ。', prevLink:'「いつか始める、はなぜ永遠に来ないのか」の解決編', nextLink:'', researchNote:'ジミー：行動を促すための楽天グッズ' },
    { id:120, title:'文字単価0.5円から2円→3円に上げるために投資した楽天の書籍・ツール10選', type:'ハウツー(B)', cat:'楽天', status:'idea', publishDate:'6月', rakuten:true, memo:'回収シミュレーション付き。投資の正当化。', prevLink:'「単価0.5円から抜け出した」の続き', nextLink:'', researchNote:'ジミー：ライター向けスキルアップ書籍' },
    { id:121, title:'AIに依存しすぎると実力が落ちる、は本当か？1年間使い続けて分かったこと', type:'エッセイ(A)', cat:'AI活用', status:'idea', publishDate:'8月', rakuten:true, memo:'AI学習用の書籍紹介。1年の振り返り。', prevLink:'「AIに依存しすぎると…」の1年後レビュー', nextLink:'', researchNote:'' },
    { id:122, title:'副業ライターの防災マニュアル　月5万円の経費を実質ゼロにする全手順', type:'ハウツー(B)', cat:'楽天', status:'idea', publishDate:'9月', rakuten:true, memo:'ポータブル電源、モバイルWi-Fi。高額ガジェット狙い。', prevLink:'「何でも書けます、をやめた日」の流れ', nextLink:'', researchNote:'' },
    { id:123, title:'売れなかった理由はプロンプトだった、その0部→20部に変えた全記録', type:'エッセイ(A)', cat:'AI活用', status:'idea', publishDate:'10月', rakuten:true, memo:'プロンプト改善の具体例。ライティング書籍の紹介。', prevLink:'「売れなかった理由はプロンプトだった」の続編', nextLink:'', researchNote:'' },
    { id:124, title:'有料楽天経済圏×副業ライター　月5万円の経費を実質ゼロにする全手順', type:'有料note', cat:'楽天', status:'idea', publishDate:'11月', rakuten:true, memo:'体系化＋独自ノウハウ。価格680円。', prevLink:'第1サイクルの総まとめ', nextLink:'', researchNote:'ジミー：SPU最大化の方法' },
    { id:125, title:'副業ライター半年の振り返り　失敗10本から学んだこと', type:'エッセイ(A)', cat:'振り返り', status:'idea', publishDate:'12月', rakuten:false, memo:'半年間の成長記録。次のステージへの布石。', prevLink:'「0部記事を5部に変えた」の延長', nextLink:'', researchNote:'なし' },
    { id:126, title:'楽天ポイントを使った「自己投資の回し方」　ライター業の複利効果', type:'エッセイ(A)', cat:'楽天', status:'idea', publishDate:'13月', rakuten:true, memo:'ポイントを書籍に再投資→スキルアップ。', prevLink:'「時間がない人ほど…」の応用編', nextLink:'', researchNote:'ジミー：楽天ポイント活用術' },
    { id:127, title:'提案文150件送って刻達した、文字単価3円に到達した声', type:'エッセイ(A)', cat:'ライティング', status:'idea', publishDate:'14月', rakuten:false, memo:'成長の軌跡の最新版。単価3円到達までの道。', prevLink:'「提案文60件」の続編', nextLink:'', researchNote:'' },
  
    ],
  };
})();
// ================================================================
// FIREBASE
// ================================================================
const _fbConfig = {
  apiKey: "AIzaSyD1FiWdKMiXzi1f8eQRzVDBSBU8tYCu5aQ",
  authDomain: "nabebase-896b6.firebaseapp.com",
  databaseURL: "https://nabebase-896b6-default-rtdb.firebaseio.com",
  projectId: "nabebase-896b6",
  storageBucket: "nabebase-896b6.firebasestorage.app",
  messagingSenderId: "480593835008",
  appId: "1:480593835008:web:29e0e7c57a9976a32e14e5"
};
let _fbRef = null;
let _fbWritePending = false;

const save = () => {
  if (_fbRef) {
    // Firebase メイン保存
    _fbWritePending = true;
    _fbRef.set(JSON.parse(JSON.stringify(S)));
    setTimeout(() => { _fbWritePending = false; }, 700);
  } else {
    // Firebase未接続時はlocalStorageにフォールバック
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch(e) {}
  }
};

function _fbEnsureFields(data) {
  if (!data.weeklyReviews) data.weeklyReviews = [];
  if (!data.neta) data.neta = [];
  if (!data.snapshot) data.snapshot = { updatedAt: '', projects: [], pending: '' };
  // localStorage→Firebase 一括移行（初回のみ実行）
  let _migrated = false;
  function _lsMigrate(field, lsKey, defaultVal, parse) {
    if (data[field] === undefined || data[field] === null) {
      const raw = localStorage.getItem(lsKey);
      if (raw) {
        try { data[field] = parse ? JSON.parse(raw) : raw; } catch(e) { data[field] = defaultVal; }
        localStorage.removeItem(lsKey);
        _migrated = true;
      } else {
        data[field] = defaultVal;
      }
    }
  }
  _lsMigrate('publishedArticles', PUBLISHED_ARTICLES_KEY, null, true);
  _lsMigrate('publishedPosts',    PUBLISHED_POSTS_KEY,    [], true);
  _lsMigrate('failurePatterns',   FAILURE_PATTERNS_KEY,   [], true);
  _lsMigrate('xPostsNew',         X_POSTS_KEY,            [], true);
  _lsMigrate('xDraftPosts',       X_DRAFT_POSTS_KEY,      [], true);
  _lsMigrate('xPromptCustom',     X_PROMPT_KEY,           null, false);
  _lsMigrate('promptReviews',     PROMPT_REVIEWS_KEY,     [], true);
  _lsMigrate('shareStats',        SHARE_STATS_KEY,        {}, true);
  _lsMigrate('claudeTmpl',        CLAUDE_TMPL_KEY,        null, false);
  _lsMigrate('promptVault',       PROMPT_VAULT_KEY,       [], true);
  _lsMigrate('xpromptVault',      XPROMPT_KEY,            null, true);
  _lsMigrate('weeklyReviewTs',    'beyan_weekly_review',  null, false);
  if (!data.workflowProgress) {
    const wfData = {};
    const toRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('workflow_progress_')) {
        try { wfData[k.slice('workflow_progress_'.length)] = JSON.parse(localStorage.getItem(k)); toRemove.push(k); } catch(e) {}
      }
    }
    toRemove.forEach(k => localStorage.removeItem(k));
    data.workflowProgress = wfData;
    if (toRemove.length > 0) _migrated = true;
  }
  if (!data.imggenPrompt) {
    const raw = localStorage.getItem('nabebase_imggen_prompt');
    if (raw) { data.imggenPrompt = raw; _migrated = true; }
    else data.imggenPrompt = null;
  }
  return _migrated;
}

// ================================================================
// バックアップ・エクスポート・インポート
// ================================================================
function downloadBackup() {
  const data = { beyan_v6: S };
  // APIキーはlocalStorageに残留（セキュリティのため）
  const gk = localStorage.getItem(GEMINI_KEY_STORAGE);
  if (gk) data[GEMINI_KEY_STORAGE] = gk;
  const ck = localStorage.getItem(CLAUDE_API_KEY_STORAGE);
  if (ck) data[CLAUDE_API_KEY_STORAGE] = ck;
  if (_geminiTmpl !== null) data['_cache_gemini_tmpl'] = _geminiTmpl;
  const json = JSON.stringify(data, null, 2);
  _downloadFile(json, `nabebase_backup_${new Date().toISOString().slice(0,10)}.json`, 'application/json');
  toast('✅ バックアップをダウンロードしました');
}
function _downloadFile(content, filename, mime) {
  const blob = new Blob([content], {type: mime || 'text/plain'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
function exportGeminiTmpl() {
  const content = (_geminiTmpl !== null && _geminiTmpl !== undefined) ? _geminiTmpl : getDefaultGeminiTmpl();
  _downloadFile(content, `gemini_tmpl_${new Date().toISOString().slice(0,10)}.txt`, 'text/plain');
  toast('⬇️ Geminiテンプレートをエクスポートしました');
}
function importGeminiTmpl(event) {
  const file = event.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const val = e.target.result;
    document.getElementById('settings-gemini-tmpl').value = val;
    saveGeminiTmpl();
    toast('✅ Geminiテンプレートをインポートしました');
  };
  reader.readAsText(file, 'utf-8');
  event.target.value = '';
}
function _updateGeminiTsDisplay() {
  const el = document.getElementById('settings-gemini-ts');
  if (!el) return;
  el.textContent = _geminiTmplUpdatedAt
    ? '最終更新: ' + new Date(_geminiTmplUpdatedAt).toLocaleString('ja-JP')
    : '';
}

function renderAll() {
  renderTopDashboard();
  renderNotes();
  renderXPosts();
  renderArchive();
  renderNetaList();
  renderXPromptList();
  renderPromptReviews();
  renderFailurePatterns();
}


// ── システム診断 ──
async function resetImggenPatterns() {
  if (typeof firebase === 'undefined' || !firebase.database) {
    alert('Firebase未接続のため削除できません。');
    return;
  }
  await firebase.database().ref('imggen_patterns').remove();
  alert('パターンをリセットしました。次回の画像生成時にstep0が自動実行されます。');
}

async function runSystemDiagnosis() {
  const lines = [];
  lines.push(`APP_VERSION: ${APP_VERSION}`);
  lines.push(_fbRef ? '🟢 Firebase: 接続中' : '🔴 Firebase: 未接続');

  if (_fbRef) {

    // app_version
    try {
      const s2 = await _fbRef.child('app_version').once('value');
      const sv = s2.val() || '未設定';
      lines.push(sv === APP_VERSION ? `✅ app_version: ${sv}` : `⚠️ app_version: Firebase=${sv} / 現在=${APP_VERSION}`);
    } catch(e) { lines.push('⚠️ app_version: 読み取り失敗'); }

    // beyan_img_keywords
    try {
      const s3 = await _fbRef.child('beyan_img_keywords').once('value');
      const kw = s3.val();
      lines.push(kw ? `✅ beyan_img_keywords: ${JSON.stringify(kw).slice(0,60)}` : '⚪ beyan_img_keywords: 未設定');
    } catch(e) { lines.push('⚠️ beyan_img_keywords: 読み取り失敗'); }
  }

  // Geminiテンプレート更新日
  lines.push(_geminiTmplUpdatedAt
    ? `✅ Geminiテンプレート更新: ${_geminiTmplUpdatedAt.slice(0,10)}`
    : '⚪ Geminiテンプレート: 未更新');

  // APIキー
  lines.push(localStorage.getItem(GEMINI_KEY_STORAGE) ? '✅ Gemini APIキー: 設定済み' : '⚠️ Gemini APIキー: 未設定');
  lines.push(localStorage.getItem(CLAUDE_API_KEY_STORAGE) || localStorage.getItem('beyan_claude_key')
    ? '✅ Claude APIキー: 設定済み' : '⚠️ Claude APIキー: 未設定');

  alert(lines.join('\n'));
}

function initFirebase() {
  try {
    if (typeof firebase === 'undefined' || !firebase.initializeApp) return;
    firebase.initializeApp(_fbConfig);
    const db = firebase.database();
    _fbRef = db.ref('beyan_v6');

    // バージョンチェック：変わっていたらテンプレートをリセット
    _fbRef.child('app_version').once('value').then(snap => {
      const savedVersion = snap.val() || '0';
      if (savedVersion !== APP_VERSION) {
        _fbRef.child('app_version').set(APP_VERSION);
        console.log(`[nabebase] バージョン更新 ${savedVersion}→${APP_VERSION} テンプレートリセット済み`);
      }
    });

    // ローカルデータがない場合のみローディング表示
    const loadEl = document.getElementById('fb-loading');
    if (loadEl && !_fromLocalStorage) loadEl.style.display = 'flex';

    let firstLoad = true;
    _fbRef.on('value', snap => {
      const data = snap.val();

      if (firstLoad) {
        firstLoad = false;

        if (!data) {
          // Firebase空 → 現在のSをFirebaseに書き込む（移行 or デフォルト）
          _fbRef.set(JSON.parse(JSON.stringify(S)));
          if (_fromLocalStorage) {
            ['beyan_v6','beyan_v5','beyan_v4','beyan_v2'].forEach(k => localStorage.removeItem(k));
            _fromLocalStorage = false;
            setTimeout(() => toast('✅ データをFirebaseに移行しました'), 1000);
          }
          if (loadEl) loadEl.style.display = 'none';
          return;
        }

        // Firebaseにデータあり
        const _didMigrate = _fbEnsureFields(data);
        if (_fromLocalStorage) {
          ['beyan_v6','beyan_v5','beyan_v4','beyan_v2'].forEach(k => localStorage.removeItem(k));
          _fromLocalStorage = false;
        }
        S = data;
        renderAll();
        // [TEMP] workflowState未設定の記事を出力
        { const noWS = (S.notes || []).filter(x => !x.workflowState); console.log('[beyan] workflowState未設定の記事:', noWS.length, '件', noWS.map(x => x.title)); }
        if (_didMigrate) {
          save();
          setTimeout(() => toast('📤 ローカルデータをFirebaseに移行しました'), 800);
        }
        if (loadEl) loadEl.style.display = 'none';
        return;
      }

      // 2回目以降：他端末からのリアルタイム更新
      if (_fbWritePending) return;
      if (!data) return;
      if (JSON.stringify(data) === JSON.stringify(S)) return;
      _fbEnsureFields(data);
      S = data;
      renderAll();
      toast('📱 他の端末からデータが同期されました');

    }, err => {
      console.warn('[Firebase] onValue error:', err.message);
      if (loadEl) loadEl.style.display = 'none';
    });

    // ─── Geminiテンプレート: 移行対応 + 同期 ───
    {
      let _gmFirst = true;
      const _gmLocalBak = _geminiTmpl; // script初期化時のlocalStorage値
      db.ref(GEMINI_TMPL_KEY).on('value', snap => {
        const fbVal = snap.val();
        if (_gmFirst) {
          _gmFirst = false;
          if (fbVal === null && _gmLocalBak !== null) {
            // Firebase空・localStorage有 → 移行
            db.ref(GEMINI_TMPL_KEY).set(_gmLocalBak);
            db.ref(GEMINI_TMPL_KEY + '_ts').set(new Date().toISOString());
            localStorage.removeItem(GEMINI_TMPL_KEY);
            toast('📤 Geminiテンプレートをクラウドに移行しました');
            return; // 次のonValueで値が入ってくる
          }
          if (fbVal !== null && _gmLocalBak !== null) {
            // 両方あり → 長い方（カスタムが多い）を採用
            const winner = _gmLocalBak.length >= fbVal.length ? _gmLocalBak : fbVal;
            if (_gmLocalBak.length > fbVal.length) {
              db.ref(GEMINI_TMPL_KEY).set(_gmLocalBak);
              db.ref(GEMINI_TMPL_KEY + '_ts').set(new Date().toISOString());
            }
            _geminiTmpl = winner;
            localStorage.removeItem(GEMINI_TMPL_KEY);
          } else {
            _geminiTmpl = fbVal; // Firebaseのみ or 両方null
          }
        } else {
          _geminiTmpl = fbVal;
        }
        const ta = document.getElementById('settings-gemini-tmpl');
        if (ta && document.getElementById('settings-modal')?.style.display !== 'none') {
          ta.value = _geminiTmpl !== null ? _geminiTmpl : getDefaultGeminiTmpl();
        }
      });
      db.ref(GEMINI_TMPL_KEY + '_ts').on('value', snap => {
        _geminiTmplUpdatedAt = snap.val();
        _updateGeminiTsDisplay();
      });
    }


    // 接続状態インジケーター
    db.ref('.info/connected').on('value', snap => {
      const el = document.getElementById('fb-sync-status');
      if (!el) return;
      el.textContent = snap.val() ? '🟢 同期中' : '🔴 オフライン';
    });

  } catch(e) {
    console.warn('[Firebase] init error:', e.message);
    const loadEl = document.getElementById('fb-loading');
    if (loadEl) loadEl.style.display = 'none';
  }
}

const XPROMPT_KEY = 'beyan_xprompt_vault';
const CLAUDE_PROJECT_URL = 'https://claude.ai/project/019d15e5-152e-7206-b84e-01aa427212aa';

const SL = {idea:'📝 アイデア',writing:'✍️ 執筆中',review:'🔍 確認中',xprep:'📣 X準備中',done:'✅ 公開済み'};
const SC = {idea:'var(--text3)',writing:'var(--yellow)',review:'var(--blue)',xprep:'var(--orange)',done:'var(--green)'};
const SCL = {idea:'s-idea',writing:'s-writing',review:'s-review',xprep:'s-xprep',done:'s-done'};

let curId = null;       // 現在開いている記事ID
let workType = 'A';     // 作業モーダルのXタイプ
let mxType = 'A';       // X追加モーダルのXタイプ
let nf = 'all';         // noteフィルター
let nfMonth = '';       // 月別フィルター（サイドバー）
let nfCat   = '';       // カテゴリフィルター（サイドバー）
let xfilt = 'all';      // Xフィルター

// ================================================================
// UTILS
// ================================================================
const toast = msg => {
  const e = document.getElementById('toast');
  e.textContent = msg; e.classList.add('show');
  setTimeout(() => e.classList.remove('show'), 2200);
};
const openOverlay = id => document.getElementById(id).classList.add('open');
const closeOverlay = id => {
  document.getElementById(id).classList.remove('open');
};
document.querySelectorAll('.overlay').forEach(o =>
  o.addEventListener('click', e => { if (e.target === o) closeOverlay(o.id); })
);
const cp = id => navigator.clipboard.writeText(document.getElementById(id).textContent.trim())
  .then(() => toast('コピーしました ✓'));

// ================================================================
// SECTION COLLAPSE
// ================================================================
const secState = {axis:false, notes:true, xposts:true, xprompt:true, xwrite:true, archive:false, tools:false, import:false, promptreviews:false, failurepatterns:false};
function toggleSec(name, forceOpen) {
  if (forceOpen !== undefined) {
    secState[name] = forceOpen;
  } else {
    secState[name] = !secState[name];
  }
  const body = document.getElementById('body-'+name);
  const chev = document.getElementById('chev-'+name);
  if (secState[name]) {
    body.style.maxHeight = '99999px';
    chev.classList.add('open');
  } else {
    body.style.maxHeight = '0';
    body.style.overflow = 'hidden';
    chev.classList.remove('open');
  }
}
function initSec() {
  Object.entries(secState).forEach(([k, open]) => {
    const body = document.getElementById('body-'+k);
    const chev = document.getElementById('chev-'+k);
    if (open) { body.style.maxHeight = '9999px'; chev.classList.add('open'); }
    else { body.style.maxHeight = '0'; chev.classList.remove('open'); }
  });
}
function setNavActive(key) {
  document.querySelectorAll('.bnav-btn').forEach(b => b.classList.remove('active'));
  const bn = document.getElementById('bn-' + key);
  if (bn) bn.classList.add('active');
}

function scrollToSec(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const name = id.replace('sec-','');
  if (!secState[name]) toggleSec(name);
  setNavActive(name);
  setTimeout(() => el.scrollIntoView({behavior:'smooth', block:'start'}), 80);
}

// ================================================================
// STATS
// ================================================================
function updateStats() {
  // 未使用候補カウンター（機能⑤）
  const unusedCnt = S.notes.filter(n =>
    n.status !== 'done' &&
    (!n.management?.usageStatus || n.management?.usageStatus === '未使用')
  ).length;
  const notesCntEl = document.getElementById('notes-count-label');
  if (notesCntEl) {
    notesCntEl.innerHTML = `全${S.notes.length}本`;
  }
  const unusedEl = document.getElementById('notes-unused-label');
  if (unusedEl) {
    const isLow = unusedCnt < 5;
    unusedEl.style.color = isLow ? 'var(--orange)' : 'var(--text3)';
    unusedEl.style.fontWeight = isLow ? '700' : '400';
    unusedEl.textContent = `未使用候補 ${unusedCnt}本${unusedCnt === 0 ? '（ネタ切れ注意）' : ''}`;
  }
  // 機能⑤：ダッシュボードストックカード更新
  _updateStockCard(unusedCnt);
  const stk = S.xposts.filter(p=>p.status==='stock').length;
  document.getElementById('xposts-count-label').textContent = `ストック${stk}本`;
  renderWipBanner();
  renderWipPickup();
}

function renderWipPickup() {
  const el = document.getElementById('wip-pickup');
  if (!el) return;
  const wip = S.notes.filter(n => n.status === 'writing');
  if (!wip.length) { el.innerHTML = ''; return; }
  el.innerHTML = `
    <div style="background:linear-gradient(135deg,rgba(58,102,80,.12),rgba(58,102,80,.06));border:1.5px solid rgba(58,102,80,.3);border-radius:12px;padding:12px 14px">
      <div style="font-size:11px;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:.6px;margin-bottom:8px">✍️ 執筆中 — ${wip.length}本</div>
      ${wip.map(n => `
        <div onclick="openWork(${n.id})" style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--bg2);border-radius:8px;margin-bottom:6px;cursor:pointer;border:1px solid var(--border)">
          <div style="flex:1;min-width:0">
            <div style="font-size:13px;font-weight:600;color:var(--text);overflow:hidden;white-space:nowrap;text-overflow:ellipsis">${n.title}</div>
            <div style="font-size:11px;color:var(--text3);margin-top:2px">${n.cat||''} ${n.researchDone?'✅リサーチ済':'⬜リサーチ未'}</div>
          </div>
          <div style="font-size:11px;color:var(--accent);font-weight:700;flex-shrink:0">開く →</div>
        </div>
      `).join('')}
    </div>`;
}

// ================================================================
// NOTE LIST
// ================================================================
function renderNotes() {
  updateStats();
  const counts = {all:S.notes.length};
  Object.keys(SL).forEach(k => counts[k] = S.notes.filter(n=>n.status===k).length);

  document.getElementById('filter-bar').innerHTML =
    [['all','作業中'],['idea','アイデア'],['writing','執筆中'],['review','確認中'],['xprep','X準備中']]
      .map(([v,l]) => {
        const cnt = v === 'all' ? S.notes.filter(n=>n.status!=='done').length : (counts[v]||0);
        return `<button class="chip${nf===v?' active':''}" onclick="setNf('${v}')">${l} ${cnt}</button>`;
      })
      .join('');

  const q = (document.getElementById('note-search')?.value||'').toLowerCase();
  let list = [...S.notes].filter(n => n.status !== 'done');
  if (nf !== 'all') list = list.filter(n => n.status === nf);
  if (q) list = list.filter(n => (n.title+' '+(n.memo||'')).toLowerCase().includes(q));
  // サイドバーフィルター
  if (nfMonth) list = list.filter(n => (n.publishDate||'').includes(nfMonth));
  if (nfCat)   list = list.filter(n => (n.category || n.cat) === nfCat);

  document.getElementById('note-list').innerHTML = list.length === 0
    ? `<div style="text-align:center;padding:20px;color:var(--text3);font-size:13px">該当する記事がありません</div>`
    : list.map((n, idx) => {
      const monthEditRow = `
  <div class="month-edit-row" id="mer-${n.id}" style="display:none" onclick="event.stopPropagation()">
    <input class="month-edit-input" id="mei-${n.id}" type="text" placeholder="例: 3月" value="${n.publishDate||''}"
      onkeydown="if(event.key==='Enter')saveNoteMonth(${n.id})" maxlength="10">
    <button class="month-edit-ok" onclick="saveNoteMonth(${n.id})">保存</button>
    <button class="month-edit-cancel" onclick="closeMonthEdit(${n.id})">✕</button>
  </div>`;
      return `
      <div class="note-item ${SCL[n.status]||'s-idea'}" id="ni-${n.id}">
        <!-- ヘッダー：常時表示 -->
        <div class="ni-header" onclick="toggleNoteCard(${n.id},event)">
          <div class="note-bar" style="width:3px;border-radius:2px;align-self:stretch;min-height:24px;flex-shrink:0"></div>
          <div style="min-width:22px;text-align:right;font-size:11px;color:var(--text3);flex-shrink:0;line-height:1;">${idx+1}</div>
          <div class="ni-title-wrap">
            <div class="ni-title">${n.title}</div>
            <div class="ni-progress">${buildNoteSteps(n)}</div>
          </div>
          <!-- PCホバーアクション -->
          <div class="ni-hover-btns" onclick="event.stopPropagation()">
            ${(n.status==='review'||n.status==='done')?`<button class="ni-hover-btn" onclick="event.stopPropagation();openFinishModal(${n.id})">🎯 仕上げ</button>`:''}
            <button class="ni-hover-btn" onclick="event.stopPropagation();window.open(CLAUDE_PROJECT_URL,'_blank')">✍ クロ</button>
            <button class="ni-hover-btn" onclick="event.stopPropagation();openWork(${n.id})">✍ 執筆開始</button>
          </div>
          <button class="ni-work-mobile" onclick="event.stopPropagation();openWork(${n.id})">✍ 執筆開始</button>
          <button class="note-del-btn" id="ndb-${n.id}" onclick="deleteNote(${n.id},event)" title="削除" style="position:static;margin-left:0;flex-shrink:0">🗑</button>
          <svg class="ni-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="flex-shrink:0"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <!-- 詳細：展開時に表示 -->
        <div class="ni-detail">
          <div class="ni-detail-inner">
            <div id="ni-steps-${n.id}"></div>
            ${(n.concept?.coreProblem||n.memo)?`<div class="note-memo" style="margin-bottom:8px">📌 ${n.concept?.coreProblem||n.memo}</div>`:''}
            <div class="note-meta" style="margin-bottom:8px">
              <span class="badge" style="background:${SC[n.status]||'var(--text3)'};color:#fff;opacity:.9">${SL[n.status]||'アイデア'}</span>
              ${n.type?`<span class="badge badge-type">${n.type}</span>`:''}
              <span class="badge badge-date" onclick="toggleMonthEdit(${n.id},event)">📅 ${n.publishDate||'月未設定'}</span>
              ${n.rakuten?'<span class="badge badge-rakuten">楽天</span>':''}
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-bottom:10px">
              <button class="research-btn${n.researchDone?' done':''}" onclick="toggleResearch(${n.id},event)" style="margin-top:0">
                ${n.researchDone?`✅ リサーチ済み <span style="font-size:9px;opacity:.8">${n.researchDate||''}</span>`:'🔬 リサーチ未依頼'}
              </button>
              ${n.status!=='done'?`<button class="research-btn done" style="margin-top:0;background:rgba(122,154,106,.18);color:var(--green);border:1px solid rgba(122,154,106,.35);font-size:10px;padding:3px 10px;border-radius:20px;cursor:pointer;font-family:inherit;font-weight:600" onclick="markNoteDone(${n.id},event)">✅ 執筆完了にする</button>`:`<span style="font-size:10px;color:var(--green);font-weight:700">✅ 公開済み</span>`}
            </div>
            <div class="ni-actions">
              <button class="ni-action-btn primary" onclick="event.stopPropagation();openWork(${n.id})">✍ 執筆開始</button>
              <button class="ni-action-btn" onclick="event.stopPropagation();openNoteEditModal(${n.id})">📝 詳細編集</button>
              <button class="ni-action-btn" onclick="event.stopPropagation();openWorkflowNav(${n.id})" style="background:var(--bg3);color:var(--text2)">📋 ワークフロー</button>
              <button class="ni-action-btn" onclick="event.stopPropagation();openOverlay('modal-howto')" style="background:var(--bg3);color:var(--text2)">📖 使い方</button>
              ${(n.status==='review'||n.status==='done')?`<button class="ni-action-btn finish" onclick="event.stopPropagation();openFinishModal(${n.id})">🎯 仕上げ</button>`:''}
            </div>
            ${_buildOverlapBtn(n)}
            <div id="overlap-result-${n.id}">${_overlapResults[n.id] || ''}</div>
          </div>
          ${monthEditRow}
        </div>
      </div>`;
    }).join('');

  // セクション高さを再計算
  const body = document.getElementById('body-notes');
  if (secState.notes) { body.style.maxHeight = '99999px'; body.style.overflow = 'visible'; }
  // サイドバーを更新
  renderNotesSidebars();
  // 軸集計を更新
  renderAxisStats();
}
function buildNoteSteps(n) {
  const statusIdx = {idea:0,writing:1,review:2,xprep:3,done:4};
  const cur = statusIdx[n.status] ?? 0;
  const labels = ['リサーチ','執筆','楽天アフィ','X投稿'];
  return labels.map((lbl,i) => {
    const cls = i < cur ? 'done' : i === cur ? 'active' : 'future';
    const sep = i < labels.length-1 ? '<span class="ni-arr">▶</span>' : '';
    return `<span class="ni-stp ${cls}">${lbl}</span>${sep}`;
  }).join('');
}
function toggleNoteCard(id, e) {
  if (e) e.stopPropagation();
  const el = document.getElementById('ni-' + id);
  if (!el) return;
  el.classList.toggle('expanded');
  if (el.classList.contains('expanded')) {
    const area = document.getElementById('ni-steps-' + id);
    if (area && !area.dataset.built) {
      const n = S.notes.find(x => x.id === id);
      if (n) { area.innerHTML = _buildNiStepCard(n); area.dataset.built = '1'; }
    }
  }
}

const HUMAN_TECH_LIST = [
  { key:'感情の矛盾',       desc:'相反する気持ちが同一文に共存しているか' },
  { key:'自己ツッコミ',     desc:'自分の行動や感情に自分でツッコんでいるか' },
  { key:'超短文',           desc:'5〜10文字の短文が意図的に入っているか' },
  { key:'当時の心の声',     desc:'当時の頭の中の言葉を直接引用しているか' },
  { key:'数字と固有名詞',   desc:'「ある時期」などの曖昧表現がゼロか' },
  { key:'括弧補足',         desc:'本文の流れを切らずに補足が入っているか' },
  { key:'未解決段落',       desc:'答えを出さずに終わる段落が1つあるか' },
  { key:'問いを投げる',     desc:'読者に問いかけて答えを出さない箇所があるか' },
  { key:'文末バラバラ',     desc:'段落末尾の3文の語尾が揃っていないか' },
  { key:'言いかけて止める', desc:'「…」で終わる文が1〜2箇所あるか' },
];
const AI_CHECK_LIST = [
  { key:'禁止ワードなし',     desc:'そして / また / さらに / つまり / 重要なのは / ぜひ〜してみてください 等が含まれていないか' },
  { key:'均等段落構造なし',   desc:'均等段落構造・対称構造になっていないか' },
  { key:'完璧解決オチなし',   desc:'完璧解決オチになっていないか' },
  { key:'感情フラットなし',   desc:'感情がフラットになっていないか' },
  { key:'抽象体験描写なし',   desc:'抽象的な体験描写になっていないか' },
];

let _finishNoteId = null;

function openFinishModal(id) {
  _finishNoteId = id;
  const n = S.notes.find(x => x.id === id);
  const titleEl = document.getElementById('modal-finish-title');
  if (titleEl && n) titleEl.textContent = n.title;

  // チェックリストを生成・復元
  const savedHuman = n?.article?.humanTechUsed || [];
  const savedAI    = n?.article?.aiChecks || [];

  const humanList = document.getElementById('finish-human-list');
  const aiList    = document.getElementById('finish-ai-list');
  if (humanList) {
    humanList.innerHTML = HUMAN_TECH_LIST.map((t, i) => `
      <label style="display:flex;align-items:flex-start;gap:8px;cursor:pointer;padding:5px 7px;border-radius:7px;background:var(--bg3);border:1px solid var(--border)">
        <input type="checkbox" id="fh-${i}" onchange="_updateFinishChecks()"
          ${savedHuman.includes(t.key) ? 'checked' : ''}
          style="margin-top:2px;flex-shrink:0;accent-color:var(--accent);width:15px;height:15px">
        <span style="font-size:.78rem;line-height:1.45">
          <span style="font-weight:700;color:var(--text)">技法${i+1}：${_escHtml(t.key)}</span>
          <span style="color:var(--text3);font-size:.72rem;display:block;margin-top:1px">${_escHtml(t.desc)}</span>
        </span>
      </label>`).join('');
  }
  if (aiList) {
    aiList.innerHTML = AI_CHECK_LIST.map((t, i) => `
      <label style="display:flex;align-items:flex-start;gap:8px;cursor:pointer;padding:5px 7px;border-radius:7px;background:var(--bg3);border:1px solid var(--border)">
        <input type="checkbox" id="fa-${i}" onchange="_updateFinishChecks()"
          ${savedAI.includes(t.key) ? 'checked' : ''}
          style="margin-top:2px;flex-shrink:0;accent-color:var(--accent);width:15px;height:15px">
        <span style="font-size:.78rem;line-height:1.45">
          <span style="font-weight:700;color:var(--text)">${_escHtml(t.key)}</span>
          <span style="color:var(--text3);font-size:.72rem;display:block;margin-top:1px">${_escHtml(t.desc)}</span>
        </span>
      </label>`).join('');
  }

  _updateFinishChecks();
  openOverlay('modal-finish');
}

function _updateFinishChecks() {
  const humanChecked = HUMAN_TECH_LIST.filter((_, i) => document.getElementById('fh-'+i)?.checked);
  const aiChecked    = AI_CHECK_LIST.filter((_, i) => document.getElementById('fa-'+i)?.checked);
  const hCount = humanChecked.length;
  const aCount = aiChecked.length;
  const hOk = hCount >= 4;
  const aOk = aCount === AI_CHECK_LIST.length;

  // バッジ更新
  const hBadge = document.getElementById('finish-human-badge');
  const aBadge = document.getElementById('finish-ai-badge');
  if (hBadge) {
    hBadge.textContent = `${hCount} / ${HUMAN_TECH_LIST.length}`;
    hBadge.style.background = hOk ? 'rgba(122,154,106,.25)' : 'var(--bg5)';
    hBadge.style.color = hOk ? 'var(--green)' : 'var(--text2)';
  }
  if (aBadge) {
    aBadge.textContent = `${aCount} / ${AI_CHECK_LIST.length}`;
    aBadge.style.background = aOk ? 'rgba(122,154,106,.25)' : 'var(--bg5)';
    aBadge.style.color = aOk ? 'var(--green)' : 'var(--text2)';
  }

  // 公開ボタン
  const btn = document.getElementById('finish-publish-btn');
  const hint = document.getElementById('finish-publish-hint');
  const allOk = hOk && aOk;
  if (btn) {
    btn.disabled = !allOk;
    btn.style.background = allOk ? 'var(--green)' : 'var(--bg5)';
    btn.style.color = allOk ? '#fff' : 'var(--text3)';
    btn.style.cursor = allOk ? 'pointer' : 'not-allowed';
  }
  if (hint) {
    if (allOk) {
      hint.textContent = '';
    } else {
      const parts = [];
      if (!hOk) parts.push(`人間らしさ技法 あと${4 - hCount}つ`);
      if (!aOk) parts.push(`AI書き癖 あと${AI_CHECK_LIST.length - aCount}項目`);
      hint.textContent = parts.join(' ／ ');
    }
  }

  // チェック状態をノートに保存（自動）
  _saveFinishProgress(humanChecked.map(t => t.key), aiChecked.map(t => t.key));
}

function _saveFinishProgress(humanKeys, aiKeys) {
  const n = S.notes.find(x => x.id === _finishNoteId);
  if (!n) return;
  if (!n.article) n.article = {};
  n.article.humanTechUsed = humanKeys;
  n.article.aiChecks      = aiKeys;
  save();
}

function finishAndPublish() {
  const n = S.notes.find(x => x.id === _finishNoteId);
  if (!n) return;
  // publishedArticlesに登録（同タイトルが既にあれば更新）
  const list = getPublishedArticles();
  const existing = list.findIndex(a => a.publishedTitle === n.title);
  const entry = {
    publishedTitle:  n.title,
    titleKeywords:   [],
    expansionAxis:   n.axis?.expansionAxis || '',
    emotionAxis:     n.axis?.emotionAxis   || '',
    thinkingPattern: n.article?.thinkingPattern   || '',
    readerPerspective: n.article?.readerPerspective || '',
    coreLearning:    n.concept?.coreProblem || '',
    publishedAt:     new Date().toISOString().slice(0, 10),
    headlineKeywords: { catch: '', main: '', sub: '' },
    humanTechUsed:   n.article?.humanTechUsed || [],
  };
  if (existing >= 0) list[existing] = { ...list[existing], ...entry };
  else list.unshift(entry);
  setPublishedArticles(list);
  // ステータスをdoneに
  if (n.status !== 'done') {
    n.status = 'done';
    save();
    renderNotes();
    
  }
  closeOverlay('modal-finish');
  toast('公開済みに登録しました');
}

function setNf(v) { nf = v; renderNotes(); }

// ================================================================
// noteサイドバー（3カラムレイアウト用）
// ================================================================
function setNfMonth(v) { nfMonth = (nfMonth === v) ? '' : v; renderNotes(); }
function setNfCat(v)   { nfCat   = (nfCat   === v) ? '' : v; renderNotes(); }
function resetSidebarFilters() { nfMonth = ''; nfCat = ''; renderNotes(); }

function renderNotesSidebars() {
  const lEl = document.getElementById('notes-sidebar-l');
  const rEl = document.getElementById('notes-sidebar-r');

  // 左サイドバー：月別・カテゴリフィルター
  if (lEl) {
    const activeNotes = S.notes.filter(n => n.status !== 'done');
    const months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
    const cats   = [...new Set(activeNotes.map(n => n.category||n.cat||'').filter(Boolean))].sort();
    lEl.innerHTML = `
      <div class="nsb-head">🔍 絞り込み</div>
      <div class="nsb-sec">
        <span class="nsb-label">月別</span>
        ${months.length
          ? months.map(m => `<button class="nsb-btn${nfMonth===m?' active':''}" onclick="setNfMonth('${m}')">${m}</button>`).join('')
          : '<div style="color:var(--text3);font-size:11px;padding:2px 0">データなし</div>'}
      </div>
      <div class="nsb-sec">
        <span class="nsb-label">カテゴリ</span>
        ${cats.length
          ? cats.map(c => `<button class="nsb-btn${nfCat===c?' active':''}" onclick="setNfCat('${_escHtml(c)}')">${_escHtml(c)}</button>`).join('')
          : '<div style="color:var(--text3);font-size:11px;padding:2px 0">データなし</div>'}
      </div>
      <button class="nsb-btn" onclick="resetSidebarFilters()"
        style="border-color:var(--orange);color:var(--orange);margin-top:4px">
        ↩ リセット
      </button>`;
  }

  // 右サイドバー：今月の進捗
  if (rEl) {
    const stats = JSON.parse(localStorage.getItem(SHARE_STATS_KEY) || '{}');
    const pending = S.snapshot?.pending || '';
    rEl.innerHTML = `
      <div style="background:var(--bg2);border:1px solid var(--bg5);border-radius:10px;padding:10px 12px;margin-bottom:8px;">
        <div class="nsb-head" style="margin-bottom:6px;">𝕏 パフォーマンス</div>
        <div class="nsb-stat-row"><span style="font-size:11px;color:var(--text2)">フォロワー</span><span class="nsb-stat-val">${stats.followers||'—'}</span></div>
        <div class="nsb-stat-row"><span style="font-size:11px;color:var(--text2)">週間IMP</span><span class="nsb-stat-val">${stats.impress||'—'}</span></div>
        <button onclick="openShareModal()" style="width:100%;margin-top:6px;min-height:28px;background:transparent;border:1px solid var(--bg5);border-radius:6px;color:var(--text3);font-size:.72rem;cursor:pointer;font-family:inherit;">✏️ 編集</button>
      </div>
      <div style="background:var(--bg2);border:1px solid var(--bg5);border-radius:10px;padding:10px 12px;margin-bottom:8px;">
        <div class="nsb-head" style="margin-bottom:6px;">📝 noteパフォーマンス</div>
        <div class="nsb-stat-row"><span style="font-size:11px;color:var(--text2)">全体ビュー</span><span class="nsb-stat-val">${stats.nview||'—'}</span></div>
        <div class="nsb-stat-row"><span style="font-size:11px;color:var(--text2)">全体スキ</span><span class="nsb-stat-val">${stats.nlikes||'—'}</span></div>
        <button onclick="openShareModal()" style="width:100%;margin-top:6px;min-height:28px;background:transparent;border:1px solid var(--bg5);border-radius:6px;color:var(--text3);font-size:.72rem;cursor:pointer;font-family:inherit;">✏️ 編集</button>
      </div>
      <div style="background:var(--bg2);border:1px solid var(--bg5);border-radius:10px;padding:10px 12px;">
        <div class="nsb-head" style="margin-bottom:6px;">🗒 検討中メモ</div>
        <textarea id="sidebar-pending-memo" rows="5" style="width:100%;background:var(--bg3);color:var(--text);border:1px solid var(--bg5);border-radius:6px;padding:7px;font-size:11px;font-family:inherit;resize:vertical;box-sizing:border-box;line-height:1.6;" oninput="savePendingMemo(this.value)">${_escHtml(pending)}</textarea>
      </div>`;
  }
}

// ================================================================
// スナップショット
// ================================================================
const SNAPSHOT_IDS = ['strategy','nabebase','note','x','pillar2','other'];
const SNAPSHOT_DEFAULT_NAMES = { strategy:'全体戦略', nabebase:'nabebase', note:'note', x:'X', pillar2:'第2の柱', other:'その他' };

function renderSnapshot() {
  if (!S.snapshot) S.snapshot = { updatedAt: '', projects: [], pending: '' };
  const snap = S.snapshot;
  const updEl = document.getElementById('snapshot-updated-at');
  if (updEl) updEl.textContent = snap.updatedAt ? '更新：' + snap.updatedAt : '';

  const container = document.getElementById('snapshot-cards');
  if (!container) return;

  const projectMap = {};
  (snap.projects || []).forEach(p => { projectMap[p.id] = p; });

  container.innerHTML = SNAPSHOT_IDS.map(id => {
    const p = projectMap[id];
    const name = p?.name || SNAPSHOT_DEFAULT_NAMES[id] || id;
    if (!p) {
      return `<div style="background:var(--bg2);border:1px dashed var(--bg5);border-radius:10px;padding:10px 12px;min-height:80px;display:flex;align-items:center;justify-content:center;">
        <span style="font-size:.72rem;color:var(--text3);">${_escHtml(name)}</span>
      </div>`;
    }
    return `<div style="background:var(--bg2);border:1px solid var(--bg5);border-radius:10px;padding:10px 12px;">
      <div style="font-size:.78rem;font-weight:700;color:var(--accent);margin-bottom:3px;">${_escHtml(name)}</div>
      <div style="font-size:.7rem;color:var(--text3);margin-bottom:6px;">${_escHtml(p.phase||'')}</div>
      ${p.decided ? `<div style="display:flex;gap:5px;align-items:flex-start;margin-bottom:3px;">
        <span style="color:#48bb78;font-size:8px;margin-top:4px;flex-shrink:0;">●</span>
        <span style="font-size:.72rem;color:var(--text2);line-height:1.4;">${_escHtml(p.decided)}</span>
      </div>` : ''}
      ${p.nextAction ? `<div style="display:flex;gap:5px;align-items:flex-start;">
        <span style="color:var(--orange);font-size:8px;margin-top:4px;flex-shrink:0;">●</span>
        <span style="font-size:.72rem;color:var(--text2);line-height:1.4;">${_escHtml(p.nextAction)}</span>
      </div>` : ''}
    </div>`;
  }).join('');
}

function updateSnapshot() {
  const input = document.getElementById('snapshot-paste-input');
  const msgEl = document.getElementById('snapshot-paste-msg');
  const raw = input?.value?.trim() || '';
  if (!raw) { if (msgEl) msgEl.textContent = '入力が空です'; return; }
  let parsed;
  try { parsed = JSON.parse(raw); } catch(e) {
    if (msgEl) { msgEl.style.color = '#f87171'; msgEl.textContent = 'JSONパースエラー: ' + e.message; }
    return;
  }
  const snap = parsed.snapshot || parsed;
  if (!snap.projects) { if (msgEl) { msgEl.style.color = '#f87171'; msgEl.textContent = 'projectsが見つかりません'; } return; }
  if (!S.snapshot) S.snapshot = { updatedAt: '', projects: [], pending: '' };
  if (snap.updatedAt) S.snapshot.updatedAt = snap.updatedAt;
  if (snap.pending !== undefined) S.snapshot.pending = snap.pending;
  const map = {};
  (S.snapshot.projects || []).forEach(p => { map[p.id] = p; });
  snap.projects.forEach(p => { map[p.id] = p; });
  S.snapshot.projects = Object.values(map);
  save();
  renderSnapshot();
  renderNotesSidebars();
  if (msgEl) { msgEl.style.color = 'var(--green)'; msgEl.textContent = '✅ 更新しました'; }
  if (input) input.value = '';
  const details = document.getElementById('snapshot-paste-details');
  if (details) details.removeAttribute('open');
}

function savePendingMemo(val) {
  if (!S.snapshot) S.snapshot = { updatedAt: '', projects: [], pending: '' };
  S.snapshot.pending = val;
  save();
}

// ---- 削除（2タップ確認）----
let _delPending = null, _delTimer = null;
function deleteNote(id, e) {
  e.stopPropagation();
  if (_delPending === id) {
    // 2回目：実行
    clearTimeout(_delTimer);
    _delPending = null;
    S.notes = S.notes.filter(n => n.id !== id);
    save(); renderNotes();
    toast('🗑 削除しました');
  } else {
    // 1回目：確認待ち
    if (_delPending !== null) {
      const prev = document.getElementById('ndb-'+_delPending);
      if (prev) prev.classList.remove('pending');
    }
    _delPending = id;
    const btn = document.getElementById('ndb-'+id);
    if (btn) btn.classList.add('pending');
    btn.textContent = '✕?';
    toast('もう一度タップで削除 — 3秒でキャンセル');
    _delTimer = setTimeout(() => {
      _delPending = null;
      const b = document.getElementById('ndb-'+id);
      if (b) { b.classList.remove('pending'); b.textContent = '🗑'; }
    }, 3000);
  }
}

// ---- 執筆完了 ----
function markNoteDone(id, e) {
  e.stopPropagation();
  const n = S.notes.find(x => x.id === id);
  if (!n) return;
  n.status = 'done';
  S.weeklyReviewNeeded = true;
  save(); renderNotes(); renderArchive();
  toast('✅ 公開済みに変更しました — アーカイブへ移動しました');
}

// ---- 月編集 ----
function toggleMonthEdit(id, e) {
  e.stopPropagation();
  const row = document.getElementById('mer-'+id);
  if (!row) return;
  const isOpen = row.style.display !== 'none';
  // 他の開いている編集行を閉じる
  document.querySelectorAll('[id^="mer-"]').forEach(r => { r.style.display='none'; });
  if (!isOpen) {
    row.style.display = 'flex';
    const inp = document.getElementById('mei-'+id);
    if (inp) { inp.focus(); inp.select(); }
    // セクション高さを再計算
    const body = document.getElementById('body-notes');
    if (secState.notes) body.style.maxHeight = body.scrollHeight + 4000 + 'px';
  }
}
function closeMonthEdit(id) {
  const row = document.getElementById('mer-'+id);
  if (row) row.style.display = 'none';
}
function saveNoteMonth(id) {
  const inp = document.getElementById('mei-'+id);
  if (!inp) return;
  const val = inp.value.trim();
  const n = S.notes.find(x => x.id === id);
  if (!n) return;
  n.publishDate = val;
  save(); renderNotes();
  toast(`📅 月を「${val||'未設定'}」に変更しました`);
}

// ================================================================
// TODAY
// ================================================================
// ================================================================
// 軸の使用状況
// ================================================================
function renderAxisStats() {
  const TARGET_STATUSES = ['writing','review','xprep','done'];
  const targets = S.notes.filter(n => TARGET_STATUSES.includes(n.status) && n.axis);

  // axis を新旧両形式から取得するヘルパー
  function _axisEmotion(n) {
    if (typeof n.axis === 'object' && n.axis !== null) return n.axis.emotionAxis || '';
    if (typeof n.axis === 'string') return n.axis.split('／')[0]?.trim() || '';
    return '';
  }
  function _axisExpansion(n) {
    if (typeof n.axis === 'object' && n.axis !== null) return n.axis.expansionAxis || '';
    if (typeof n.axis === 'string') return n.axis.split('／')[2]?.trim() || '';
    return '';
  }

  // 集計
  const emotionCount = {};
  const devCount     = {};

  targets.forEach(n => {
    const emotion = _axisEmotion(n);
    const develop = _axisExpansion(n);
    if (emotion) emotionCount[emotion] = (emotionCount[emotion] || 0) + 1;
    if (develop) devCount[develop]     = (devCount[develop]     || 0) + 1;
  });

  // 直近3本かつ過去60日以内の公開済み記事で被り警告
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const recentPublished = getPublishedArticles()
    .filter(a => a.publishedAt && new Date(a.publishedAt) >= sixtyDaysAgo)
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, 3);
  const consecutiveWarnings = new Set();
  if (recentPublished.length >= 3) {
    const axes = recentPublished.map(a => a.expansionAxis || '');
    if (axes[0] && axes[0] === axes[1] && axes[1] === axes[2]) {
      consecutiveWarnings.add(axes[0]);
    }
  }
  // チェック対象件数（60日以内のみカウント）
  const checkCount = recentPublished.length;

  // 警告ラベル（軸セクション）
  const warnEl = document.getElementById('axis-warn-label');
  if (warnEl) warnEl.textContent = consecutiveWarnings.size > 0 ? '⚠️ 連続使用あり' : '';
  // 機能⑤：note進捗表ヘッダーの軸警告
  const notesAxisWarn = document.getElementById('notes-axis-warn');
  if (notesAxisWarn) notesAxisWarn.style.display = consecutiveWarnings.size > 0 ? 'inline' : 'none';
  // 機能⑤：ダッシュボードストックカードの軸警告
  const dashWarn = document.getElementById('dash-stock-warn');
  if (dashWarn) {
    if (consecutiveWarnings.size > 0) {
      dashWarn.style.display = 'block';
      dashWarn.textContent = `⚠️ 展開軸が3回連続しています。次の記事では別の軸を選んでください（${[...consecutiveWarnings].join('/')}）`;
    } else {
      dashWarn.style.display = 'none';
    }
  }

  const container = document.getElementById('axis-stats-content');
  if (!container) return;

  const renderBar = (countMap, warnSet) => {
    const sorted = Object.entries(countMap).sort((a,b) => b[1]-a[1]);
    if (!sorted.length) return '<div style="color:var(--text3);font-size:12px">データなし</div>';
    const max = sorted[0][1];
    return sorted.map(([label, cnt]) => {
      const warn = warnSet?.has(label)
        ? `<span style="color:#f87171;font-size:.72rem;font-weight:700;margin-left:6px;">⚠️ 3回連続</span>`
        : '';
      const pct = Math.round((cnt / max) * 100);
      return `<div style="margin-bottom:8px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px;">
          <span style="font-size:.8rem;color:var(--text);">${_escHtml(label)}${warn}</span>
          <span style="font-size:.75rem;color:var(--text3);">${cnt}件</span>
        </div>
        <div style="height:5px;background:var(--bg5);border-radius:3px;">
          <div style="height:5px;width:${pct}%;background:var(--accent);border-radius:3px;transition:width .3s;"></div>
        </div>
      </div>`;
    }).join('');
  };

  container.innerHTML = `
    <div style="font-size:.72rem;color:var(--text3);margin-bottom:10px;">
      被り警告チェック対象：直近3本 / 過去60日以内
      <span style="margin-left:6px;color:${checkCount>=3?'var(--text2)':'var(--orange)'};">（該当${checkCount}本）</span>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">
      <div>
        <div style="font-size:.75rem;color:var(--text3);font-weight:700;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px;">展開軸</div>
        ${renderBar(devCount, consecutiveWarnings)}
      </div>
      <div>
        <div style="font-size:.75rem;color:var(--text3);font-weight:700;margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px;">感情軸</div>
        ${renderBar(emotionCount, null)}
      </div>
    </div>`;
}



// ================================================================
// X POSTS
// ================================================================
let xfEl = 'all';
function setXf(el, v) {
  xfEl = v;
  document.querySelectorAll('[data-xf]').forEach(b => b.classList.toggle('active', b.dataset.xf===v));
  renderXPosts();
}
function renderXPosts() {
  updateStats();
  const xpostListEl = document.getElementById('xpost-list');
  if (!xpostListEl) return; // 新UIに移行済みのため非表示要素
  // posted は常にアーカイブへ — メイン一覧には表示しない
  let list = [...S.xposts].filter(p => p.status !== 'posted');
  if (xfEl==='A') list = list.filter(p=>p.type==='A');
  if (xfEl==='B') list = list.filter(p=>p.type==='B');
  xpostListEl.innerHTML = list.length === 0
    ? `<div style="text-align:center;padding:20px;color:var(--text3);font-size:13px">投稿がありません</div>`
    : list.map(p => {
      const cc = p.content.replace(/\n/g,'').length;
      const ccCls = cc>140?'char-over':cc>120?'char-warn':'char-ok';
      return `<div class="xpost-item">
        <div class="xpost-type-badge ${p.type==='A'?'type-a':'type-b'}">${p.type==='A'?'タイプA — 朝7時':'タイプB — 夜21時'}</div>
        <div class="xpost-content">${p.content}</div>
        <div class="xpost-footer">
          <span class="xpost-date">${p.createdAt||''}</span>
          <span class="${ccCls}" style="font-size:11px">${cc}字</span>
          <div style="margin-left:auto;display:flex;gap:5px;flex-wrap:wrap">
            <button class="btn btn-ghost btn-sm" style="width:auto;font-weight:700" onclick="openXPost(${p.id})">𝕏 投稿する</button>
            ${p.status==='stock'
              ? `<button class="btn btn-green btn-sm" style="width:auto" onclick="markPosted(${p.id})">✅ 投稿済</button>`
              : `<span style="font-size:11px;color:var(--green);align-self:center">投稿済み</span>`}
            <button class="btn btn-ghost btn-sm" style="width:auto" onclick="editXPost(${p.id})">編集</button>
            <button class="btn btn-red btn-sm" style="width:auto" onclick="delXPost(${p.id})">削除</button>
          </div>
        </div>
      </div>`;
    }).join('');
  const body = document.getElementById('body-xposts');
  if (secState.xposts) body.style.maxHeight = '99999px';
}

function markPosted(id){const p=S.xposts.find(x=>x.id===id);if(p){p.status='posted';save();renderXPosts();renderArchive();toast('投稿済みにしました ✓ — アーカイブへ移動しました');}}
function delXPost(id){S.xposts=S.xposts.filter(x=>x.id!==id);save();renderXPosts();renderArchive();toast('削除しました');}

// ================================================================
// アーカイブ
// ================================================================
let archiveTab = 'notes';
function setArchiveTab(tab) {
  archiveTab = tab;
  document.getElementById('arc-tab-notes').classList.toggle('active', tab==='notes');
  document.getElementById('arc-tab-xposts').classList.toggle('active', tab==='xposts');
  document.getElementById('archive-notes-list').style.display = tab==='notes' ? 'block' : 'none';
  document.getElementById('archive-xposts-list').style.display = tab==='xposts' ? 'block' : 'none';
  const jw = document.getElementById('arc-jimmy-wrap');
  if (jw) jw.style.display = tab==='notes' ? 'block' : 'none';
}
function renderArchive() {
  const doneNotes  = S.notes.filter(n => n.status === 'done');
  const postedX    = S.xposts.filter(p => p.status === 'posted');
  const countLbl   = document.getElementById('archive-count-label');
  if (countLbl) countLbl.textContent = `note ${doneNotes.length}件 · X ${postedX.length}件`;

  const nl = document.getElementById('archive-notes-list');
  if (nl) nl.innerHTML = doneNotes.length === 0
    ? `<div style="text-align:center;padding:20px;color:var(--text3);font-size:13px">公開済み記事はありません</div>`
    : doneNotes.map(n => `
      <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--bg3);border-radius:10px;margin-bottom:6px;border:1px solid var(--border)">
        <div style="width:8px;height:8px;border-radius:50%;background:var(--green);flex-shrink:0"></div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:600;color:var(--text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${n.title}</div>
          <div style="font-size:11px;color:var(--text3);margin-top:2px">${n.publishDate||'月未設定'} · ${n.type||''} · ${n.cat||''}</div>
        </div>
        <button onclick="unarchiveNote(${n.id})" style="background:var(--bg5);border:1px solid var(--border2);border-radius:7px;padding:5px 10px;font-size:11px;cursor:pointer;color:var(--text2);font-family:inherit;white-space:nowrap;flex-shrink:0;min-height:36px">↩ 戻す</button>
      </div>`).join('');

  const xl = document.getElementById('archive-xposts-list');
  if (xl) xl.innerHTML = postedX.length === 0
    ? `<div style="text-align:center;padding:20px;color:var(--text3);font-size:13px">投稿済みX投稿はありません</div>`
    : postedX.map(p => `
      <div style="padding:10px 12px;background:var(--bg3);border-radius:10px;margin-bottom:6px;border:1px solid var(--border)">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
          <span style="font-size:10px;font-weight:700;padding:2px 7px;border-radius:10px;${p.type==='A'?'background:rgba(59,130,246,.2);color:#60a5fa':'background:rgba(167,139,250,.2);color:#a78bfa'}">${p.type==='A'?'タイプA 朝':'タイプB 夜'}</span>
          <span style="font-size:11px;color:var(--text3)">${p.createdAt||''}</span>
          <button onclick="unarchiveXPost(${p.id})" style="margin-left:auto;background:var(--bg5);border:1px solid var(--border2);border-radius:7px;padding:4px 10px;font-size:11px;cursor:pointer;color:var(--text2);font-family:inherit;min-height:32px">↩ 戻す</button>
        </div>
        <div style="font-size:13px;color:var(--text);white-space:pre-wrap;line-height:1.6">${p.content}</div>
      </div>`).join('');

  const body = document.getElementById('body-archive');
  if (body && secState.archive) { body.style.maxHeight = '99999px'; body.style.overflow = 'visible'; }
  // 機能③：ジミーボタン件数を常に最新化
  const jimmyBtn = document.getElementById('arc-jimmy-btn');
  if (jimmyBtn) {
    const pubCnt = getPublishedArticles().length;
    const lbl = `ジミー用 全件JSONをコピー（全${pubCnt}件）`;
    jimmyBtn.textContent = lbl;
    jimmyBtn.setAttribute('data-orig', lbl);
  }
}
function unarchiveNote(id) {
  const n = S.notes.find(x => x.id === id);
  if (!n) return;
  n.status = 'xprep';
  save(); renderNotes(); renderArchive();
  toast('↩ X準備中に戻しました');
}
function unarchiveXPost(id) {
  const p = S.xposts.find(x => x.id === id);
  if (!p) return;
  p.status = 'stock';
  save(); renderXPosts(); renderArchive();
  toast('↩ ストックに戻しました');
}
function openAddXPost(){ document.getElementById('mx-id').value=''; document.getElementById('mx-content').value=''; document.getElementById('mx-status').value='stock'; setMxType('A'); updateMxcc(); openOverlay('modal-xpost'); }
function editXPost(id){
  const p=S.xposts.find(x=>x.id===id); if(!p) return;
  document.getElementById('mx-id').value=p.id;
  document.getElementById('mx-content').value=p.content;
  document.getElementById('mx-status').value=p.status;
  setMxType(p.type); updateMxcc();
  openOverlay('modal-xpost');
}
function setMxType(t){ mxType=t; document.getElementById('mx-tpa').className='type-btn'+(t==='A'?' sel-a':''); document.getElementById('mx-tpb').className='type-btn'+(t==='B'?' sel-b':''); }
function updateMxcc(){
  const v = document.getElementById('mx-content').value.replace(/\n/g,'').length;
  const e = document.getElementById('mx-cc');
  e.textContent=`${v} / 140字`; e.className=v>140?'char-over':v>120?'char-warn':'char-ok';
}
document.getElementById('mx-save').addEventListener('click',()=>{
  const id = document.getElementById('mx-id').value;
  const content = document.getElementById('mx-content').value.trim();
  const status = document.getElementById('mx-status').value;
  if(!content){toast('内容を入力してください');return;}
  if(id){const p=S.xposts.find(x=>x.id===parseInt(id));if(p){p.content=content;p.type=mxType;p.status=status;}toast('更新しました');}
  else{S.xposts.unshift({id:Date.now(),type:mxType,content,status,createdAt:new Date().toISOString().slice(0,10)});toast('追加しました');}
  save(); renderXPosts(); closeOverlay('modal-xpost');
});

// ================================================================
// 作業フローモーダル
// ================================================================
function openWork(id) {
  const n = S.notes.find(x=>x.id===id); if(!n) return;
  curId = id;
  document.getElementById('mw-title').textContent = n.title;
  const _cat = n.category || n.cat || '';
  const _memo = n.concept?.coreProblem || n.memo || '';
  const _research = n.research?.researchPrompt || n.researchNote || '';
  document.getElementById('mw-badges').innerHTML = [
    n.type?`<span class="badge badge-type">${n.type}</span>`:'',
    _cat?`<span class="badge badge-cat">${_cat}</span>`:'',
    n.publishDate?`<span class="badge badge-date">📅 ${n.publishDate}</span>`:'',
    n.rakuten?'<span class="badge badge-rakuten">楽天</span>':'',
  ].join('');
  document.getElementById('mw-sub').textContent = [
    _memo?`📌 ${_memo}`:'',
    _research?`🔬 ${_research}`:'',
  ].filter(Boolean).join('\n');
  const sel = document.getElementById('mw-status');
  sel.innerHTML = Object.entries(SL).map(([v,l])=>`<option value="${v}"${n.status===v?' selected':''}>${l}</option>`).join('');
  // ①リサーチ：依頼文を生成してセット
  document.getElementById('mw-gemini').textContent = buildGemini(n);
  // ②執筆：保存済みリサーチ結果を復元
  const savedResult = n.geminiResult || '';
  document.getElementById('mw-gemini-result').value = savedResult;
  if (savedResult) genChatGPT();
  document.getElementById('mw-chatgpt').textContent='';
  document.getElementById('mw-chatgpt-wrap').style.display='none';
  // 保存済みClaudeResult復元
  const savedClaudeResult = n.claudeResult || '';
  if (savedClaudeResult) {
    document.getElementById('mw-claude-output').textContent = savedClaudeResult;
    document.getElementById('claude-result-section').style.display = 'block';
  } else {
    document.getElementById('mw-claude-output').textContent = '';
    document.getElementById('claude-result-section').style.display = 'none';
    document.getElementById('claude-manual-panel').style.display = 'block';
    document.getElementById('claude-manual-input').value = '';
  }
  document.getElementById('mw-xedit').value='';
  document.getElementById('mw-xbases').innerHTML = buildXBases(n);
  setWorkType('A'); updateXcc();
  loadClaudeApiKey();
  switchTabByName('gemini');
  openOverlay('modal-work');
}

function switchTab(el, name) {
  document.querySelectorAll('.ftab').forEach(t=>t.classList.toggle('active',t.dataset.tab===name));
  document.querySelectorAll('.fpanel').forEach(p=>p.classList.toggle('active',p.id==='fp-'+name));
}
function switchTabByName(name) {
  document.querySelectorAll('.ftab').forEach(t=>t.classList.toggle('active',t.dataset.tab===name));
  document.querySelectorAll('.fpanel').forEach(p=>p.classList.toggle('active',p.id==='fp-'+name));
}
function quickUpdateStatus() {
  const n = S.notes.find(x=>x.id===curId); if(!n) return;
  const newStatus = document.getElementById('mw-status').value;
  if (newStatus === 'writing' && n.status !== 'writing') {
    _showWritingCheck(() => {
      n.status = 'writing';
      save(); renderNotes(); 
      toast('ステータスを更新しました');
    }, () => {
      // キャンセル：セレクトを元に戻す
      document.getElementById('mw-status').value = n.status;
    });
    return;
  }
  n.status = newStatus;
  save(); renderNotes(); 
  toast('ステータスを更新しました');
}

function getDefaultGeminiTmpl() {
  return '━━━━━━━━━━━━━━━━━━━━━━━━━━\n【パペへのリサーチ依頼文 ver.3.0】\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n【最優先ミッション】\n読者が読後に「ためになった！」と心から思い、\nリピーターになってくれる記事を作るための\n"生きた情報"を大量に掘り出すこと\n\n【絶対厳守ルール】\n⚠️ 要約するな！深掘り情報を省くな！\n⚠️ 生々しい一次情報は「原文のまま」引用\n⚠️ サンプルは多い方がいい（最低5つ、理想10個）\n⚠️ 「これ使えそう」と思ったら全部出せ\n\n────────────────────\n【テーマ】\n「${n.title}」\n記事タイプ：${n.type||\'エッセイ\'} / カテゴリ：${n.cat||\'未設定\'}\n執筆メモ：${n.memo||\'なし\'}${n.researchNote?\'\\n特記事項：\'+n.researchNote:\'\'}\n\n────────────────────\n【Step1: 読者の本音を掘る】\n\n・このテーマで悩んでる人が「本当に知りたいこと」は何？\n・表面的な疑問じゃなくて、心の奥底にある不安・欲求を特定\n・「なぜこのテーマが気になるのか？」の深層心理\n\n────────────────────\n【Step2: 生々しい一次情報を大量発掘】\n\n必須ソース（最低5つ以上、理想10個以上）：\n□ Reddit（英語可、DeepL翻訳して原文引用）\n□ 個人note\n□ X（Twitter）\n□ はてなブログ\n□ YouTube コメント欄\n\n追加ソース（テーマに応じて選択）：\n□ Yahoo!知恵袋・教えて!goo\n□ 5ch 専門板\n□ Amebaブログ・FC2ブログ\n□ Medium 日本語記事\n□ Amazon レビュー\n□ Instagram 長文キャプション\n□ その他テーマ特化ソース\n\n検索キーワード例：\n・「〇〇 失敗」「〇〇 後悔」「〇〇 やめた」\n・「〇〇 気づいた」「〇〇 救われた」\n・「〇〇 やってみた」「〇〇 始めて」\n・「〇〇 損した」「〇〇 得した」\n\n優先条件：\n1. 個人の具体的エピソードがある\n2. 感情ワード（失敗・後悔・救われた・焦った等）が含まれる\n3. 数値・時期・状況が具体的\n4. AI生成っぽくない生きた文章\n5. スラング・汚い言葉はフィルタリング（品は保つ）\n\n出力形式：\n【ソース名】URL\n原文引用：「〇〇〇〇〇」（そのまま引用、要約しない）\n感情：失敗/後悔/救われた/気づいた 等\n数値・具体性：〇〇\n\n────────────────────\n【Step3: 「ためになる」要素を抽出】\n\n以下のうち、最低2つ以上を含む情報を優先：\n□ 誰も教えてくれなかった盲点\n□ 失敗から学んだ具体的な改善策\n□ 意外な発見・気づき\n□ 実践してすぐ使える小さなコツ\n□ 避けるべき具体的な地雷\n□ 数値で示せる before → after\n\n────────────────────\n【Step4: 対立構造の明確化】\n\n・「〇〇だと思ってたけど、実は△△だった」\n・読者の思い込みを揺さぶる構造\n・具体例を3つ以上\n\n────────────────────\n【Step5: AI感完全抹消のための特殊収集】\n\n人間の語り口パターンを収集：\n\n1. 個人ブログ・noteから「生きた表現」を抽出\n   ・感情が乗っている部分の言い回し\n   ・失敗を語るときのトーン\n   ・内省的な語尾パターン\n   ・短文と長文のリズム\n\n2. Reddit・Xから「話し言葉」を収集\n   ・「〜なんですよね」「〜だったり」\n   ・「正直〜」「意外と〜」\n   ・「〜かもしれません」\n\n3. AI感のある表現をリスト化（クロが絶対使わないように）\n   ・「効果的です」「重要です」「おすすめです」\n   ・「〜することで」「〜により」「〜するため」\n\n────────────────────\n【Step6: リピーター獲得要素】\n\n読者が読後に感じるべきこと：\n1. 「具体的に得るものがあった」（実践的価値）\n2. 「この人の考え方、好きかも」（人格・共感）\n3. 「次も読みたい」（継続欲求）\n\nそのための要素（最低3つ）：\n□ 読者がすぐ使える小さな一歩（今日できる行動）\n□ 意外な視点・気づき（「そうか！」体験）\n□ 失敗からの学び（共感 + 教訓）\n□ 書き手の人柄が伝わる語り口\n□ 読者の悩みに寄り添う温度感\n\n────────────────────\n【Step7: タイトル案×5】\n\n読者欲求（安心/成長/回避/優越）を明記\n3要素（数字・感情・具体性）を必ず含む\n\n────────────────────\n【文章品質のバランス指示】\n\n生きた人間の語り口を追求するが、以下を守る：\n□ 綺麗で読みやすい日本語\n□ スラング・汚い言葉は使わない\n□ 「親しみやすいけど、きちんとしてる」トーン\n□ 感情は乗せるが、品は保つ\n\nNG例：「マジでヤバい」「クソみたい」\nOK例：「正直、焦りました」「大きな失敗でした」\n\n────────────────────\n【出力形式（note_article_prompt.md準拠）】\n\n出力には必ずコピーボタンを付けてください。コードブロックで囲んでコピーしやすくしてください。\n\n## 30秒サマリー\n（読者が得られる具体的価値を3行で）\n\n## 読者の本音\n（このテーマで本当に知りたいこと）\n\n## 生々しい一次情報×5〜10\n（要約せず、原文引用で出せ！）\n\n1. 【ソース名】URL\n   原文引用：「〇〇〇〇〇」\n   感情：〇〇\n   数値・具体性：〇〇\n   \n2. 〜10まで続ける\n\n## 「ためになる」核心ポイント\n・盲点：\n・改善策：\n・小さなコツ：\n・避けるべき地雷：\n\n## 対立構造×3\n1. 〇〇 vs △△\n2. 〇〇 vs △△\n3. 〇〇 vs △△\n\n## 人間の語り口パターン（サンプル10個）\n（生きた表現をそのまま引用）\n\n## AI感のある表現リスト（使用禁止）\n（クロが避けるべき表現）\n\n## タイトル案×5\n【案1】（安心）〇〇〇\n【案2】（成長）〇〇〇\n【案3】（回避）〇〇〇\n【案4】（優越）〇〇〇\n【案5】（複合）〇〇〇\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n【パペの4つの掘削原則（再確認）】\n━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n1. 表面を掘るな深層を掘れ\n   → 一般論・公式見解ではなく、個人の具体的エピソード\n\n2. AIっぽい情報は捨てろ\n   → 企業サイト・まとめサイトより、個人の生の声\n\n3. 感情が乗っている情報を優先\n   → 失敗・後悔・救われた・気づいた等の感情ワード\n\n4. プラスアルファは必ず1つ以上\n   → 指示を超えた独自発掘情報を含める\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━';
}
function buildGemini(n) {
  const tmpl = (_geminiTmpl !== null && _geminiTmpl !== undefined) ? _geminiTmpl : getDefaultGeminiTmpl();
  const cat  = n.category || n.cat || '未設定';
  const memo = n.concept?.coreProblem || n.memo || 'なし';
  const research = n.research?.researchPrompt || n.researchNote || '';
  return tmpl
    .replace(/\$\{n\.title\}/g, n.title || '')
    .replace(/\$\{n\.type\|\|'エッセイ'\}/g, n.type || 'エッセイ')
    .replace(/\$\{n\.cat\|\|'未設定'\}/g, cat)
    .replace(/\$\{n\.memo\|\|'なし'\}/g, memo)
    .replace(/\$\{n\.researchNote\?'\\n特記事項：'\+n\.researchNote:''\}/g,
      research ? '\n特記事項：' + research : '');
}

// ユーティリティ: debounce
function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}
const _renderNotesD = debounce(renderNotes, 250);
const _genChatGPTD  = debounce(() => { genChatGPT(); save(); }, 450);

function genChatGPT() {
  localStorage.removeItem('beyan_img_keywords');
  const result = document.getElementById('mw-gemini-result').value.trim();
  const wrap = document.getElementById('mw-chatgpt-wrap');
  if(!result){wrap.style.display='none';return;}
  const n = S.notes.find(x=>x.id===curId); if(!n) return;
  // 手動ペースト分も含めてgeminiResultとして即時保存
  if (n.geminiResult !== result) { n.geminiResult = result; save(); }
  const isYuryou = n.type==='有料note';
  // カスタムテンプレがあればそちらを使う（変数は動的に埋め込む）
  const claudeSaved = S.claudeTmpl;
  let claudePrompt;
  if (claudeSaved !== null) {
    claudePrompt = claudeSaved
      .replace(/\$\{n\.title\}/g, n.title || '')
      .replace(/\$\{n\.memo\|\|'このテーマに関心がある人'\}/g, n.concept?.coreProblem || n.memo || 'このテーマに関心がある人')
      .replace(/\$\{isYuryou\?'有料記事（1,980円）：具体的ノウハウと再現手順を網羅':'無料記事（X導線用）：共感→気づき→有料記事への自然な導線'\}/g,
        isYuryou ? '有料記事（1,980円）：具体的ノウハウと再現手順を網羅' : '無料記事（X導線用）：共感→気づき→有料記事への自然な導線')
      .replace(/\$\{isYuryou\?'3,000〜4,000':'2,000〜2,500'\}/g,
        isYuryou ? '3,000〜4,000' : '2,000〜2,500')
      .replace(/\$\{result\}/g, result)
      .replace(/\$\{n\.nextLink\?`\n   →「\$\{n\.nextLink\}」につながるひと言を最後に入れる`:''}/g,
        (n.management?.next||n.nextLink) ? '\n   →「' + (n.management?.next||n.nextLink) + '」につながるひと言を最後に入れる' : '');
  } else {
    claudePrompt = `あなたはべーやん（3交代勤務×副業ライター）として、以下の条件でnote記事を執筆してください。

■ タイトル
「${n.title}」

■ 読者設定
・副業ライターとして活動中、または始めたい人
・${n.concept?.coreProblem||n.memo||'このテーマに関心がある人'}

■ 記事の方向性
・${isYuryou?'有料記事（1,980円）：具体的ノウハウと再現手順を網羅':'無料記事（X導線用）：共感→気づき→有料記事への自然な導線'}
・文字数：${isYuryou?'3,000〜4,000':'2,000〜2,500'}文字
・体験談ベース。具体的な数字・固有名詞を必ず入れる

■ リサーチ結果（パペ調べ）
${result}

■ 構成
1. 共感リード（「これ自分だ」と思わせる状況描写）
2. 失敗・壁（具体的なエピソード）
3. 転機・気づき（何がどう変わったか）
4. 再現可能な学び（明日から使えること）
5. まとめ＋次の記事への導線${(n.management?.next||n.nextLink)?`\n   →「${n.management?.next||n.nextLink}」につながるひと言を最後に入れる`:''}

■ 文体の絶対ルール
・ですます調。親しみやすいが馴れ馴れしすぎない
・「しみじみ思う。」「笑」など口語表現OK
・「〜が大切です」「〜を心がけましょう」などAI的な説教口調は禁止
・「まとめると」「ポイントは」系の見出しも禁止
・# ※ ** などの記号は一切使わない
・抽象論・精神論で終わらない。必ず具体で締める`;
  }
  const _kwInstruction = '\n\n【必須・最終出力】\n本文の執筆が完了したら、必ず以下のブロックを本文の直後に出力すること。省略・省略不可。\n\n【見出し画像キーワード】\nキャッチ：（12文字以内・読者の悩みや状況を一言で）\nメイン：（15文字以内・記事の核心を圧縮）\nサブ：（20文字以内・読者へのベネフィット）';
  document.getElementById('mw-chatgpt').textContent = claudePrompt + _kwInstruction;
  wrap.style.display='block';
}

function buildXBases(n) {
  const ta = `✨${n.title.slice(0,18)}…の話。\n\n${n.memo?n.memo.slice(0,40)+'…':'リアルな体験をまとめました。'}\n\n同じ状況の人に届いてほしい。`;
  const tb = `📝${n.title.slice(0,30)}…\n\n${n.memo?n.memo.slice(0,40)+'…':'詳しくnoteにまとめました。'}\n\n[noteリンク]`;
  return [['A','type-a','タイプA（朝）',ta],['B','type-b','タイプB（夜）',tb]].map(([t,cls,lbl,txt]) =>
    `<div style="background:var(--bg5);border-radius:8px;padding:10px;margin-bottom:6px;
      cursor:pointer;border:1px solid var(--border2)"
      onclick="document.getElementById('mw-xedit').value=this.querySelector('.xbase-txt').textContent;updateXcc()">
      <span class="xpost-type-badge ${cls}" style="margin-bottom:4px">${lbl}</span>
      <div class="xbase-txt" style="font-size:12px;line-height:1.6;color:var(--text2)">${txt}</div>
    </div>`
  ).join('');
}

function setWorkType(t) {
  workType = t;
  document.getElementById('mw-tpa').className='type-btn'+(t==='A'?' sel-a':'');
  document.getElementById('mw-tpb').className='type-btn'+(t==='B'?' sel-b':'');
}
function updateXcc() {
  const v = document.getElementById('mw-xedit').value.replace(/\n/g,'').length;
  const e = document.getElementById('mw-xcc');
  e.textContent=`${v} / 140字`; e.className=v>140?'char-over':v>120?'char-warn':'char-ok';
}
function saveFromWork() {
  const content = document.getElementById('mw-xedit').value.trim();
  if(!content){toast('投稿文を入力してください');return;}
  S.xposts.unshift({id:Date.now(),type:workType,content,status:'stock',
    createdAt:new Date().toISOString().slice(0,10)});
  save(); renderXPosts();
  document.getElementById('mw-xedit').value=''; updateXcc();
  toast('ストックに追加しました ✓');
}

// ================================================================
// 記事詳細編集モーダル
// ================================================================
let _editFromCard = false;
function openNoteEditModal(id) {
  curId = Number(id);
  _editFromCard = true;
  openEditModal();
}
function openEditModal() {
  const n = S.notes.find(x=>x.id===curId || x.id===Number(curId)); if(!n) return;
  document.getElementById('me-id').value=n.id;
  document.getElementById('me-title').value=n.title||'';
  document.getElementById('me-type').value=n.type||'エッセイ(A)';
  document.getElementById('me-category').value=n.category||n.cat||'ライティング';
  document.getElementById('me-status').value=n.status||'idea';
  document.getElementById('me-pubdate').value=n.publishDate||'';
  // concept
  const c=n.concept||{};
  document.getElementById('me-concept-coreProblem').value=c.coreProblem||n.memo||'';
  document.getElementById('me-concept-targetReader').value=c.targetReader||'';
  document.getElementById('me-concept-readerEmotion').value=c.readerEmotion||'';
  document.getElementById('me-concept-readerBeliefToBreak').value=c.readerBeliefToBreak||'';
  document.getElementById('me-concept-readerChangeAfterReading').value=c.readerChangeAfterReading||'';
  document.getElementById('me-concept-nextHook').value=c.nextHook||'';
  // axis（旧string形式からの移行対応）
  const ax=typeof n.axis==='object'&&n.axis!==null?n.axis:{};
  const oldAxisStr=typeof n.axis==='string'?n.axis:'';
  document.getElementById('me-axis-expansionAxis').value=ax.expansionAxis||oldAxisStr.split('／')[2]?.trim()||'';
  document.getElementById('me-axis-emotionAxis').value=ax.emotionAxis||oldAxisStr.split('／')[0]?.trim()||'';
  document.getElementById('me-axis-diffFromLast').value=ax.diffFromLast||'';
  document.getElementById('me-axis-readerBeliefToBreak').value=ax.readerBeliefToBreak||c.readerBeliefToBreak||'';
  document.getElementById('me-axis-readerChangeAfterReading').value=ax.readerChangeAfterReading||c.readerChangeAfterReading||'';
  // research
  const r=n.research||{};
  document.getElementById('me-research-researchPrompt').value=r.researchPrompt||n.researchNote||'';
  document.getElementById('me-research-blankSpace').value=r.blankSpace||'';
  document.getElementById('me-research-sourceNote').value=r.sourceNote||'';
  // article
  const ar=n.article||{};
  document.getElementById('me-article-soulSentence').value=ar.soulSentence||'';
  document.getElementById('me-article-thinkingPattern').value=ar.thinkingPattern||'';
  document.getElementById('me-article-readerPerspective').value=ar.readerPerspective||'';
  document.getElementById('me-article-affiliateContext').value=ar.affiliateContext||'';
  document.getElementById('me-article-seedingTwoAhead').value=ar.seedingTwoAhead||'';
  document.getElementById('me-article-seriesName').value=ar.seriesName||'';
  document.getElementById('me-article-seriesOrder').value=ar.seriesOrder||'';
  document.getElementById('me-article-prevConnection').value=ar.prevConnection||'';
  // management
  const m=n.management||{};
  document.getElementById('me-management-usageStatus').value=m.usageStatus||'';
  document.getElementById('me-management-connection').value=m.connection||n.prevLink||'';
  document.getElementById('me-management-next').value=m.next||n.nextLink||'';
  document.getElementById('me-management-progressStatus').value=m.progressStatus||'';
  document.getElementById('me-management-schemaVersion').value=m.schemaVersion||'V6';
  openOverlay('modal-edit');
}
document.getElementById('me-save').addEventListener('click',()=>{
  const id = parseInt(document.getElementById('me-id').value);
  const title = document.getElementById('me-title').value.trim();
  if(!title){toast('タイトルを入力してください');return;}
  const n = S.notes.find(x=>x.id===id); if(!n) return;
  const newStatus = document.getElementById('me-status').value;
  const doSave = () => {
    Object.assign(n,{
      title,
      type: document.getElementById('me-type').value,
      category: document.getElementById('me-category').value,
      status: newStatus,
      publishDate: document.getElementById('me-pubdate').value.trim(),
      concept: {
        coreProblem:              document.getElementById('me-concept-coreProblem').value.trim(),
        targetReader:             document.getElementById('me-concept-targetReader').value.trim(),
        readerEmotion:            document.getElementById('me-concept-readerEmotion').value.trim(),
        readerBeliefToBreak:      document.getElementById('me-concept-readerBeliefToBreak').value.trim(),
        readerChangeAfterReading: document.getElementById('me-concept-readerChangeAfterReading').value.trim(),
        nextHook:                 document.getElementById('me-concept-nextHook').value.trim(),
      },
      axis: {
        expansionAxis:            document.getElementById('me-axis-expansionAxis').value.trim(),
        emotionAxis:              document.getElementById('me-axis-emotionAxis').value.trim(),
        diffFromLast:             document.getElementById('me-axis-diffFromLast').value.trim(),
        readerBeliefToBreak:      document.getElementById('me-axis-readerBeliefToBreak').value.trim(),
        readerChangeAfterReading: document.getElementById('me-axis-readerChangeAfterReading').value.trim(),
      },
      research: {
        researchPrompt: document.getElementById('me-research-researchPrompt').value.trim(),
        blankSpace:     document.getElementById('me-research-blankSpace').value.trim(),
        sourceNote:     document.getElementById('me-research-sourceNote').value.trim(),
      },
      article: {
        soulSentence:      document.getElementById('me-article-soulSentence').value.trim(),
        thinkingPattern:   document.getElementById('me-article-thinkingPattern').value.trim(),
        readerPerspective: document.getElementById('me-article-readerPerspective').value.trim(),
        affiliateContext:  document.getElementById('me-article-affiliateContext').value.trim(),
        seedingTwoAhead:   document.getElementById('me-article-seedingTwoAhead').value.trim(),
        seriesName:        document.getElementById('me-article-seriesName').value.trim(),
        seriesOrder:       document.getElementById('me-article-seriesOrder').value.trim(),
        prevConnection:    document.getElementById('me-article-prevConnection').value.trim(),
      },
      management: {
        usageStatus:    document.getElementById('me-management-usageStatus').value.trim(),
        connection:     document.getElementById('me-management-connection').value.trim(),
        next:           document.getElementById('me-management-next').value.trim(),
        progressStatus: document.getElementById('me-management-progressStatus').value,
        schemaVersion:  document.getElementById('me-management-schemaVersion').value.trim() || 'V6',
      },
    });
    save(); renderNotes();  closeOverlay('modal-edit');
    if(!_editFromCard && curId===id) openWork(id);
    _editFromCard = false;
    toast('保存しました');
  };
  if (newStatus === 'writing' && n.status !== 'writing') {
    _showWritingCheck(doSave, null, id);
    return;
  }
  doSave();
});

// ================================================================
// テーマ一括登録
// ================================================================
document.getElementById('btn-paste-themes').addEventListener('click',()=>{
  const raw = document.getElementById('theme-paste-input').value.trim();
  if(!raw){toast('JSON出力を貼り付けてください');return;}
  let themes;
  try{
    const clean = raw.replace(/```json|```/g,'').trim();
    const p = JSON.parse(clean);
    themes = Array.isArray(p)?p:[p];
  }catch(e){
    document.getElementById('theme-paste-result').innerHTML='<span style="color:var(--red)">⚠️ JSON形式が正しくありません</span>';
    return;
  }
  if(!themes.length){toast('データが空です');return;}
  [...themes].reverse().forEach(t=>{
    const ax=t.axis||{};
    S.notes.unshift({
      id: Date.now()+Math.random(),
      title:    t.title    || '（未設定）',
      type:     t.type     || 'エッセイ(A)',
      category: t.category || t.cat || 'その他',
      status:   t.status   || 'idea',
      publishDate: t.publishDate || '',
      concept: {
        coreProblem:              t.concept?.coreProblem              || t.memo || '',
        targetReader:             t.concept?.targetReader             || '',
        readerEmotion:            t.concept?.readerEmotion            || '',
        readerBeliefToBreak:      t.concept?.readerBeliefToBreak      || '',
        readerChangeAfterReading: t.concept?.readerChangeAfterReading || '',
        nextHook:                 t.concept?.nextHook                 || '',
      },
      axis: {
        expansionAxis: t.axis?.expansionAxis || '',
        emotionAxis:   t.axis?.emotionAxis   || '',
        diffFromLast:  t.axis?.diffFromLast  || '',
      },
      research: {
        researchPrompt: t.research?.researchPrompt || t.researchNote || '',
        blankSpace:     t.research?.blankSpace     || '',
        sourceNote:     t.research?.sourceNote     || '',
      },
      article: {
        soulSentence:     t.article?.soulSentence     || '',
        structure:        t.article?.structure        || '',
        affiliateContext: t.article?.affiliateContext || '',
      },
      management: {
        usageStatus: t.management?.usageStatus || '',
        connection:  t.management?.connection  || t.prevLink || '',
        next:        t.management?.next        || t.nextLink || '',
      },
    });
  });
  save(); renderNotes();
  document.getElementById('theme-paste-input').value='';
  document.getElementById('theme-paste-result').innerHTML=`<span style="color:var(--green)">✅ ${themes.length}件を登録しました</span>`;
  setTimeout(()=>{document.getElementById('theme-paste-result').innerHTML='';},3000);
  toast(`${themes.length}件のテーマを登録しました`);
});
document.getElementById('btn-paste-clear').addEventListener('click',()=>{
  document.getElementById('theme-paste-input').value='';
  document.getElementById('theme-paste-result').innerHTML='';
});

// ================================================================
// GEMINI API 連携
// ================================================================
// ================================================================
// CLAUDE API 連携
// ================================================================
const CLAUDE_API_KEY_STORAGE = 'beyan_claude_api_key';

function loadClaudeApiKey() {
  const k = localStorage.getItem(CLAUDE_API_KEY_STORAGE) || '';
  const el = document.getElementById('claude-api-key');
  if (!el) return;
  if (k) {
    el.value = k;
    document.getElementById('claude-key-status').innerHTML =
      '<span style="color:var(--green)">✅ APIキー保存済み</span>';
  }
}
function onClaudeKeyInput() {
  const k = document.getElementById('claude-api-key').value.trim();
  if (k) {
    localStorage.setItem(CLAUDE_API_KEY_STORAGE, k);
    document.getElementById('claude-key-status').innerHTML =
      '<span style="color:var(--green)">✅ 自動保存済み</span>';
    // 設定モーダルにも反映
    const s = document.getElementById('settings-claude-api-key');
    if (s && !s.value) s.value = k;
  } else {
    document.getElementById('claude-key-status').textContent = '';
  }
}

// 設定モーダル・ワークモーダル共通の自動保存（iOS paste対応）
function autoSaveApiKey(type) {
  if (type === 'gemini') {
    const k = (document.getElementById('settings-gemini-api-key')?.value || '').trim();
    if (!k) return;
    localStorage.setItem(GEMINI_KEY_STORAGE, k);
    const msg = document.getElementById('settings-gemini-api-msg');
    if (msg) msg.textContent = '✅ 自動保存済み';
    // ワークモーダルにも反映
    const w = document.getElementById('gemini-api-key');
    if (w) { w.value = k; document.getElementById('key-status').innerHTML = '<span style="color:var(--green)">✅ 自動保存済み</span>'; }
  } else if (type === 'claude') {
    const k = (document.getElementById('settings-claude-api-key')?.value || '').trim();
    if (!k) return;
    localStorage.setItem(CLAUDE_API_KEY_STORAGE, k);
    const msg = document.getElementById('settings-claude-api-msg');
    if (msg) msg.textContent = '✅ 自動保存済み';
    // ワークモーダルにも反映
    const w = document.getElementById('claude-api-key');
    if (w) { w.value = k; document.getElementById('claude-key-status').innerHTML = '<span style="color:var(--green)">✅ 自動保存済み</span>'; }
  }
}
function saveClaudeApiKey() {
  const k = document.getElementById('claude-api-key').value.trim();
  if (!k) { toast('APIキーを入力してください'); return; }
  localStorage.setItem(CLAUDE_API_KEY_STORAGE, k);
  document.getElementById('claude-key-status').innerHTML =
    '<span style="color:var(--green)">✅ 保存しました</span>';
  toast('Claude APIキーを保存しました');
}

// Anthropic API呼び出し（直接→プロキシ順に試行）
async function fetchClaudeApi(apiKey, prompt) {
  const body = JSON.stringify({
    model: 'claude-sonnet-4-6',
    max_tokens: 60000,
    messages: [{ role: 'user', content: prompt }]
  });
  const headers = {
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
    'content-type': 'application/json'
  };

  // 試すエンドポイント（直接 → プロキシ1 → プロキシ2）
  const endpoints = [
    'https://api.anthropic.com/v1/messages',
    'https://corsproxy.io/?https://api.anthropic.com/v1/messages',
    'https://api.allorigins.win/post?url=' + encodeURIComponent('https://api.anthropic.com/v1/messages')
  ];

  let lastErr = null;
  for (const url of endpoints) {
    try {
      const res = await fetch(url, { method: 'POST', headers, body });
      // alloriginsはレスポンスをラップするので展開
      if (url.includes('allorigins')) {
        if (!res.ok) continue;
        const wrapper = await res.json();
        const inner = JSON.parse(wrapper.contents || '{}');
        if (inner?.content?.[0]?.text) return { ok: true, data: inner };
        continue;
      }
      return { ok: res.ok, res };
    } catch(e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error('接続できませんでした');
}

async function runClaude() {
  const typed = document.getElementById('claude-api-key').value.trim();
  if (typed) localStorage.setItem(CLAUDE_API_KEY_STORAGE, typed);
  const apiKey = localStorage.getItem(CLAUDE_API_KEY_STORAGE) || '';
  if (!apiKey) {
    toast('先にClaude APIキーを入力して保存してください');
    document.getElementById('claude-api-key').focus();
    return;
  }

  // 指示文が未生成なら生成する
  if (document.getElementById('mw-chatgpt-wrap').style.display === 'none') genChatGPT();
  const prompt = document.getElementById('mw-chatgpt').textContent.trim();
  if (!prompt) { toast('先にGeminiのリサーチ結果を入力してください'); return; }

  document.getElementById('btn-run-claude').disabled = true;
  document.getElementById('claude-loading').style.display = 'block';
  document.getElementById('claude-result-section').style.display = 'none';
  const pbar = document.getElementById('claude-pbar');
  pbar.style.width = '0%';
  let pTimer = null;
  let text = '';
  let streamOk = false;

  try {
    // ─── ストリーミング試行（直接API・CORS対応環境） ───
    try {
      const sRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 60000, stream: true, messages: [{ role: 'user', content: prompt }] })
      });
      if (!sRes.ok) {
        const sErr = await sRes.json().catch(() => ({}));
        if (sRes.status === 401 || sRes.status === 403) {
          document.getElementById('claude-key-status').innerHTML = '<span style="color:var(--red)">⚠️ APIキーが無効です。設定から確認してください</span>';
          toast('APIキーを確認してください');
          return;
        }
        throw new Error(sErr?.error?.message || `HTTP ${sRes.status}`);
      }
      streamOk = true;
      const reader = sRes.body.getReader();
      const decoder = new TextDecoder();
      let buf = '', estChars = 28000;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n'); buf = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const evData = line.slice(6).trim();
          if (evData === '[DONE]') continue;
          try {
            const ev = JSON.parse(evData);
            if (ev.type === 'content_block_delta' && ev.delta?.text) {
              text += ev.delta.text;
              pbar.style.width = Math.min(text.length / estChars * 95, 95) + '%';
            }
          } catch(_) {}
        }
      }
      if (!text) throw new Error('レスポンスが空でした');
    } catch(streamErr) {
      if (streamOk) throw streamErr; // APIエラーはそのまま再スロー
      // CORSエラー → タイマー方式 + プロキシにフォールバック
      let pct = 0;
      pTimer = setInterval(() => {
        pct = Math.min(pct + (pct < 70 ? 2 : 0.3), 90);
        pbar.style.width = pct + '%';
      }, 400);
      const result = await fetchClaudeApi(apiKey, prompt);
      clearInterval(pTimer); pTimer = null;
      if (result.data) {
        text = result.data?.content?.[0]?.text || '';
      } else {
        const { res } = result;
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          if (res.status === 401 || res.status === 403) {
            document.getElementById('claude-key-status').innerHTML = '<span style="color:var(--red)">⚠️ APIキーが無効です。設定から確認してください</span>';
            toast('APIキーを確認してください');
            return;
          }
          throw new Error(err?.error?.message || `HTTP ${res.status}`);
        }
        const data = await res.json();
        text = data?.content?.[0]?.text || '';
      }
      if (!text) throw new Error('レスポンスが空でした');
    }

    pbar.style.width = '100%';

    // 結果表示
    document.getElementById('mw-claude-output').textContent = text;
    document.getElementById('claude-result-section').style.display = 'block';
    document.getElementById('claude-key-status').innerHTML = '<span style="color:var(--green)">✅ 執筆完了</span>';

    const n = S.notes.find(x => x.id === curId);
    if (n) { n.claudeResult = text; save(); }
    toast('✅ クロの執筆完了！');

  } catch(e) {
    if (pTimer) clearInterval(pTimer);
    // フォールバック：プロンプトをURLエンコードしてClaude.aiに渡す
    document.getElementById('claude-key-status').innerHTML =
      '<span style="color:var(--yellow)">⚠️ API接続不可 → 手動モード。下に貼り付けてください</span>';
    document.getElementById('claude-manual-panel').style.display = 'block';
    const shortPrompt = prompt.length > 2000 ? prompt.slice(0, 2000) + '\n\n（続きはクリップボードから貼り付けてください）' : prompt;
    navigator.clipboard.writeText(prompt).catch(() => {});
    window.open('https://claude.ai/new?q=' + encodeURIComponent(shortPrompt), '_blank');
    toast('Claudeが開きました。回答が完成したら下に貼り付けてください');
  } finally {
    document.getElementById('claude-loading').style.display = 'none';
    document.getElementById('btn-run-claude').disabled = false;
  }
}


// ================================================================
// 自動保存（執筆中草稿）
// ================================================================

// ================================================================
// ダッシュボード：執筆中バナー
// ================================================================
function renderWipBanner() {
  const wip = S.notes.filter(n => n.status === 'writing');
  const el = document.getElementById('wip-banner');
  if (!el) return;
  if (wip.length === 0) { el.style.display = 'none'; return; }
  el.style.display = 'block';
  el.innerHTML = `
    <div class="wip-banner-head">✍️ 執筆中 <span class="wip-badge">${wip.length}本</span></div>
    <div class="wip-cards">${wip.map(n => {
      const pct = n.draftText ? Math.min(100, Math.round(n.draftText.length / 40)) : 0;
      const savedAt = n.draftSavedAt ? (() => {
        const d = new Date(n.draftSavedAt);
        return `${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}保存`;
      })() : '未保存';
      return `<div class="wip-card" onclick="openWork(${n.id})">
        <div class="wip-card-title">${n.title}</div>
        <div class="wip-card-meta">
          <span class="wip-pct">${pct}%</span>
          <div class="wip-bar"><div class="wip-bar-fill" style="width:${pct}%"></div></div>
          <span class="wip-time">${savedAt}</span>
        </div>
        <div class="wip-card-memo">${n.memo || ''}</div>
      </div>`;
    }).join('')}</div>`;
}

function pasteFromClipboardToManual() {
  navigator.clipboard.readText().then(t => {
    document.getElementById('claude-manual-input').value = t;
    toast('貼り付けました');
  }).catch(() => toast('クリップボードへのアクセスを許可してください'));
}

function saveManualClaudeResult() {
  const text = document.getElementById('claude-manual-input').value.trim();
  if (!text) { toast('Claudeの回答を貼り付けてください'); return; }
  document.getElementById('mw-claude-output').textContent = text;
  document.getElementById('claude-result-section').style.display = 'block';
  document.getElementById('claude-manual-panel').style.display = 'none';
  const n = S.notes.find(x => x.id === curId);
  if (n) { n.claudeResult = text; save(); }
  switchTabByName('rakuten');
  toast('✅ 保存して③楽天アフィへ移動しました');
}

// ================================================================
const APP_VERSION       = '4.0.0';
const GEMINI_KEY_STORAGE = 'beyan_gemini_key';
const GEMINI_TMPL_KEY = 'beyan_gemini_tmpl';
const CLAUDE_TMPL_KEY = 'beyan_claude_tmpl';
// Firebase同期テンプレートキャッシュ（null = デフォルト使用）
let _geminiTmpl = localStorage.getItem(GEMINI_TMPL_KEY); // Firebase接続前のフォールバック
let _geminiTmplUpdatedAt = null;

function getDefaultClaudeTmpl() {
  return 'あなたはべーやん（3交代勤務×副業ライター）として、以下の条件でnote記事を執筆してください。\n\n■ タイトル\n「${n.title}」\n\n■ 読者設定\n・副業ライターとして活動中、または始めたい人\n・${n.memo}\n\n■ 記事の方向性\n・文字数：2,000〜4,000文字\n・体験談ベース。具体的な数字・固有名詞を必ず入れる\n\n■ リサーチ結果（パペ調べ）\n${result}\n\n■ 構成\n1. 共感リード（「これ自分だ」と思わせる状況描写）\n2. 失敗・壁（具体的なエピソード）\n3. 転機・気づき（何がどう変わったか）\n4. 再現可能な学び（明日から使えること）\n5. まとめ＋次の記事への導線\n\n■ 文体の絶対ルール\n・ですます調。親しみやすいが馴れ馴れしすぎない\n・「しみじみ思う。」「笑」など口語表現OK\n・AI的な説教口調は禁止\n・# ※ ** などの記号は一切使わない\n・抽象論・精神論で終わらない。必ず具体で締める';
}

// ================================================================
// 執筆前チェックモーダル
// ================================================================
let _writingCheckConfirmCb = null;
let _writingCheckCancelCb  = null;
let _writingCheckNoteId    = null;

function _showWritingCheck(onConfirm, onCancel, noteId) {
  _writingCheckConfirmCb = onConfirm;
  _writingCheckCancelCb  = onCancel;
  _writingCheckNoteId    = noteId || curId || null;
  // チェックボックスをリセット
  document.querySelectorAll('#writing-check-modal input[type="checkbox"]').forEach(cb => { cb.checked = false; });
  // 渡し用テキストをリセット
  const hw = document.getElementById('wc-handoff-wrap');
  if (hw) hw.style.display = 'none';
  _wcCheckState();
  document.getElementById('writing-check-modal').style.display = 'flex';
}
function _writingCheckConfirm() {
  document.getElementById('writing-check-modal').style.display = 'none';
  if (_writingCheckConfirmCb) { _writingCheckConfirmCb(); _writingCheckConfirmCb = null; }
  _writingCheckCancelCb = null;
}
function _writingCheckCancel() {
  document.getElementById('writing-check-modal').style.display = 'none';
  if (_writingCheckCancelCb) { _writingCheckCancelCb(); _writingCheckCancelCb = null; }
  _writingCheckConfirmCb = null;
}

// ================================================================
// ユーティリティ：テキストエリアをコピー
// ================================================================
function copyEl(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.select();
  try { document.execCommand('copy'); } catch(e) { navigator.clipboard?.writeText(el.value); }
  toast('コピーしました');
}

// ================================================================
// 機能④：渡し用テキスト生成
// ================================================================
function _generateHandoffText() {
  const n = S.notes.find(x => x.id === _writingCheckNoteId);
  if (!n) { toast('記事データが見つかりません'); return; }
  const checks = [...document.querySelectorAll('#writing-check-modal input[type="checkbox"]')];
  const q = (i) => checks[i]?.checked ? 'チェック済み' : '未チェック';
  const ax = n.axis || {};
  const co = n.concept || {};
  const re = n.research || {};
  const ar = n.article || {};
  const ma = n.management || {};
  const text = `【記事制作チャット向け渡し用テキスト】

■ 記事基本情報
タイトル：${n.title || ''}
タイプ：${n.type || ''}
カテゴリ：${n.category || n.cat || ''}

■ コンセプト
解決する問題：${co.coreProblem || ''}
ターゲット読者：${co.targetReader || ''}
読者の感情状態：${co.readerEmotion || ''}
崩すべき前提認識：${co.readerBeliefToBreak || ''}
読了後の変化：${co.readerChangeAfterReading || ''}
次回への伏線：${co.nextHook || ''}

■ 軸
展開軸：${ax.expansionAxis || ''}
感情軸：${ax.emotionAxis || ''}
前回との差分：${ax.diffFromLast || ''}

■ リサーチ
リサーチプロンプト：${re.researchPrompt || ''}
空白地帯：${re.blankSpace || ''}
ソースメモ：${re.sourceNote || ''}

■ 記事設計
魂の一文：${ar.soulSentence || ''}
思考パターン：${ar.thinkingPattern || ''}
読者視点：${ar.readerPerspective || ''}
アフィリエイト文脈：${ar.affiliateContext || ''}

■ マネジメント
次の記事への引き継ぎ：${ma.next || ''}

■ 派生チェック回答（3問）
Q1回答：${q(0)}
Q2回答：${q(1)}
Q3回答：${q(2)}`;
  const out = document.getElementById('wc-handoff-out');
  const wrap = document.getElementById('wc-handoff-wrap');
  if (out) out.value = text;
  if (wrap) wrap.style.display = 'block';
}

// ================================================================
// 機能①②③：ツールタブ / JSONインポート / コンテキスト出力
// ================================================================
let _toolTab   = 'ctx';
let _importTab = 'article';

function setToolTab(tab) {
  _toolTab = tab;
  ['ctx','jimmy'].forEach(t => {
    document.getElementById('tool-tab-'+t)?.classList.toggle('active', t === tab);
    const p = document.getElementById('tool-panel-'+t);
    if (p) p.style.display = t === tab ? 'block' : 'none';
  });
}

const _importHints = {
  article:   'スキーマ: title / type / category / status / concept{} / axis{} / research{} / article{} / management{}',
  published: 'スキーマ: publishedTitle / titleKeywords[] / expansionAxis / emotionAxis / thinkingPattern / readerPerspective / coreLearning / publishedAt',
  posts:     'スキーマ: postSummary / keywords[] / emotionAxis / angle / publishedAt',
};

function setImportTab(tab) {
  _importTab = tab;
  ['article','published','posts'].forEach(t => {
    document.getElementById('imp-tab-'+t)?.classList.toggle('active', t === tab);
  });
  const hint = document.getElementById('import-schema-hint');
  if (hint) hint.textContent = _importHints[tab] || '';
}

function importJSON() {
  const ta = document.getElementById('import-json-ta');
  const raw = (ta?.value || '').trim();
  const resEl = document.getElementById('import-result');
  if (ta) ta.style.border = '1px solid var(--border)';
  if (!raw) { resEl.innerHTML = '<span style="color:var(--orange)">JSONを入力してください</span>'; return; }
  let items;
  try {
    const parsed = JSON.parse(raw.replace(/^```json|```$/gm, '').trim());
    items = Array.isArray(parsed) ? parsed : [parsed];
  } catch(e) {
    if (ta) ta.style.border = '2px solid var(--red)';
    resEl.innerHTML = '<span style="color:var(--red)">⚠️ JSON形式が正しくありません。クロ/ジミーが出力したJSONをそのまま貼り付けてください。<br><small style="opacity:.7">' + _escHtml(e.message) + '</small></span>';
    return;
  }
  if (!items.length) { resEl.innerHTML = '<span style="color:var(--orange)">データが空です</span>'; return; }

  if (_importTab === 'article') {
    [...items].reverse().forEach(t => {
      S.notes.unshift({
        id: Date.now() + Math.random(),
        title:    t.title    || '（未設定）',
        type:     t.type     || 'エッセイ(A)',
        category: t.category || t.cat || 'その他',
        status:   t.status   || 'idea',
        publishDate: t.publishDate || '',
        concept: {
          coreProblem:              t.concept?.coreProblem              || t.memo || '',
          targetReader:             t.concept?.targetReader             || '',
          readerEmotion:            t.concept?.readerEmotion            || '',
          readerBeliefToBreak:      t.concept?.readerBeliefToBreak      || '',
          readerChangeAfterReading: t.concept?.readerChangeAfterReading || '',
          nextHook:                 t.concept?.nextHook                 || '',
        },
        axis: {
          expansionAxis:            t.axis?.expansionAxis            || '',
          emotionAxis:              t.axis?.emotionAxis              || '',
          diffFromLast:             t.axis?.diffFromLast             || t.axis?.['前回との差分'] || '',
          readerBeliefToBreak:      t.axis?.readerBeliefToBreak      || t.axis?.['崩すべき前提認識'] || t.concept?.readerBeliefToBreak || '',
          readerChangeAfterReading: t.axis?.readerChangeAfterReading || t.axis?.['読了後の変化']     || t.concept?.readerChangeAfterReading || '',
        },
        research: {
          researchPrompt: t.research?.researchPrompt || t.researchNote || '',
          blankSpace:     t.research?.blankSpace     || '',
          sourceNote:     t.research?.sourceNote     || '',
        },
        article: {
          soulSentence:      t.article?.soulSentence      || '',
          thinkingPattern:   t.article?.thinkingPattern   || '',
          readerPerspective: t.article?.readerPerspective || '',
          affiliateContext:  t.article?.affiliateContext  || '',
          seedingTwoAhead:   t.article?.seedingTwoAhead   || t.article?.['2本先への種まき'] || '',
          seriesName:        t.article?.seriesName        || t.article?.シリーズ名         || '',
          seriesOrder:       t.article?.seriesOrder       || t.article?.シリーズ内順番     || '',
          prevConnection:    t.article?.prevConnection    || t.article?.['前の記事との接続点'] || '',
        },
        management: {
          usageStatus:    t.management?.usageStatus    || '',
          connection:     t.management?.connection     || t.prevLink || '',
          next:           t.management?.next           || t.nextLink || '',
          progressStatus: t.management?.progressStatus || '',
          schemaVersion:  t.management?.schemaVersion  || 'V6',
        },
      });
    });
    save(); renderNotes();
    if (ta) ta.style.border = '1px solid var(--border)';
    resEl.innerHTML = `<div style="background:rgba(74,136,56,.12);border:1px solid rgba(74,136,56,.3);border-radius:8px;padding:8px 12px">
      <div style="color:var(--green);font-weight:700;margin-bottom:4px">✅ 登録しました（${items.length}件）</div>
      <a href="#" onclick="event.preventDefault();toggleSec('notes',true);setTimeout(()=>document.getElementById('sec-notes')?.scrollIntoView({behavior:'smooth'}),80)" style="color:var(--accent);text-decoration:underline;font-size:.82rem">👉 記事候補一覧を確認する</a>
    </div>`;
  } else if (_importTab === 'published') {
    const list = getPublishedArticles();
    items.forEach(a => {
      const entry = {
        publishedTitle:    a.publishedTitle    || '',
        titleKeywords:     Array.isArray(a.titleKeywords) ? a.titleKeywords : [],
        expansionAxis:     a.expansionAxis     || '',
        emotionAxis:       a.emotionAxis       || '',
        thinkingPattern:   a.thinkingPattern   || '',
        readerPerspective: a.readerPerspective || '',
        coreLearning:      a.coreLearning      || '',
        publishedAt:       a.publishedAt       || '',
        headlineKeywords:  Object.assign({catch:'',main:'',sub:''}, a.headlineKeywords||{}),
        humanTechUsed:     Array.isArray(a.humanTechUsed) ? a.humanTechUsed : [],
      };
      const idx = list.findIndex(x => x.publishedTitle === entry.publishedTitle);
      if (idx >= 0) list[idx] = { ...list[idx], ...entry };
      else list.unshift(entry);
    });
    setPublishedArticles(list);
    if (ta) ta.style.border = '1px solid var(--border)';
    resEl.innerHTML = `<div style="background:rgba(74,136,56,.12);border:1px solid rgba(74,136,56,.3);border-radius:8px;padding:8px 12px">
      <div style="color:var(--green);font-weight:700">✅ 登録しました（${items.length}件）</div>
      <div style="font-size:.78rem;color:var(--text3);margin-top:2px">publishedArticles に登録しました</div>
    </div>`;
  } else if (_importTab === 'posts') {
    const list = getPublishedPosts();
    items.forEach(p => {
      list.unshift({
        postSummary: p.postSummary || '',
        keywords:    Array.isArray(p.keywords) ? p.keywords : [],
        emotionAxis: p.emotionAxis || '',
        angle:       p.angle       || '',
        publishedAt: p.publishedAt || '',
      });
    });
    setPublishedPosts(list);
    if (ta) ta.style.border = '1px solid var(--border)';
    resEl.innerHTML = `<div style="background:rgba(74,136,56,.12);border:1px solid rgba(74,136,56,.3);border-radius:8px;padding:8px 12px">
      <div style="color:var(--green);font-weight:700">✅ 登録しました（${items.length}件）</div>
      <div style="font-size:.78rem;color:var(--text3);margin-top:2px">publishedPosts に登録しました</div>
    </div>`;
  }
}

// ================================================================
// 機能②：クロ向けコンテキスト出力
// ================================================================
// 機能②：コンテキストテキスト生成（共通ヘルパー）
// ================================================================
function _buildClaudeCtxText() {
  const now = new Date();
  const dt = `${now.getFullYear()}/${String(now.getMonth()+1).padStart(2,'0')}/${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  const pub3 = getPublishedArticles()
    .filter(a => a.publishedAt)
    .sort((a,b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, 3);

  const pub3lines = pub3.length
    ? pub3.map((a,i) => `${i+1}. タイトル：${a.publishedTitle} | 展開軸：${a.expansionAxis} | 感情軸：${a.emotionAxis} | 思考の型：${a.thinkingPattern} | 読者視点：${a.readerPerspective} | タイトルキーワード：${(a.titleKeywords||[]).join('・')} | 公開日：${a.publishedAt}`).join('\n')
    : '（データなし）';

  const unused = S.notes.filter(n =>
    n.status !== 'done' &&
    (!n.management?.usageStatus || n.management?.usageStatus === '未使用')
  );
  const unusedLines = unused.length
    ? unused.map(n => `- タイトル：${n.title} | 展開軸：${n.axis?.expansionAxis||''} | 感情軸：${n.axis?.emotionAxis||''}`).join('\n')
    : '（なし）';

  const hookLines = pub3.map(a => {
    const matched = S.notes.find(n => n.title === a.publishedTitle);
    const hook = matched?.concept?.nextHook || '記録なし';
    return `- ${a.publishedTitle}：${hook}`;
  }).join('\n') || '（データなし）';

  const usedExpansion   = pub3.map(a => a.expansionAxis     || '（未設定）').join(' / ');
  const usedEmotion     = pub3.map(a => a.emotionAxis        || '（未設定）').join(' / ');
  const usedThinking    = pub3.map(a => a.thinkingPattern    || '（未設定）').join(' / ');
  const usedPerspective = pub3.map(a => a.readerPerspective  || '（未設定）').join(' / ');

  return { text: `【nabebaseコンテキスト】生成日時：${dt}

■ 直近3本の公開記事
${pub3lines}

■ 未使用記事候補一覧（usageStatusが空または"未使用"のもの全件）
${unusedLines}

■ 未使用候補残数：${unused.length}本

■ nextHook（直近3本の公開記事に対応する記事候補カードのconcept.nextHookを参照）
${hookLines}

■ 直近3本で使用済みの組み合わせ（被り防止用）
展開軸：${usedExpansion}
感情軸：${usedEmotion}
思考の型：${usedThinking}
読者視点：${usedPerspective}`, unusedCount: unused.length };
}

// ================================================================
// 機能②：ダッシュボードカードからワンクリックコピー
// ================================================================
function generateAndCopyClaudeCtx(btn) {
  const { text, unusedCount } = _buildClaudeCtxText();
  const out = document.getElementById('dash-ctx-out');
  if (out) out.value = text;
  const details = document.getElementById('dash-ctx-details');
  if (details) details.style.display = 'block';
  const steps = document.getElementById('dash-ctx-steps');
  if (steps) steps.style.display = 'block';

  const copy = () => {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
  };
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(copy);
  } else { copy(); }

  const orig = btn.textContent;
  btn.textContent = '✅ コピーしました！';
  setTimeout(() => { btn.textContent = orig; }, 2000);
}

// ================================================================
function generateClaudeContext() {
  const { text, unusedCount } = _buildClaudeCtxText();

  // 使用済み組み合わせ
  const usedExpansion  = pub3.map(a => a.expansionAxis     || '（未設定）').join(' / ');
  const usedEmotion    = pub3.map(a => a.emotionAxis        || '（未設定）').join(' / ');
  const out = document.getElementById('tool-ctx-out');
  const wrap = document.getElementById('tool-ctx-wrap');
  const lbl = document.getElementById('tool-ctx-label');
  if (out) out.value = text;
  if (wrap) wrap.style.display = 'block';
  if (lbl) lbl.textContent = `生成済み（未使用候補${unusedCount}本）`;
}

// ================================================================
// 機能③：ジミー向け全件JSON出力
// ================================================================
function generateJimmyJSON() {
  const list = getPublishedArticles().map(a => ({
    publishedTitle:    a.publishedTitle,
    titleKeywords:     a.titleKeywords || [],
    expansionAxis:     a.expansionAxis,
    emotionAxis:       a.emotionAxis,
    thinkingPattern:   a.thinkingPattern,
    readerPerspective: a.readerPerspective,
    coreLearning:      a.coreLearning,
    publishedAt:       a.publishedAt,
  }));
  const out = document.getElementById('tool-jimmy-out');
  const wrap = document.getElementById('tool-jimmy-wrap');
  const cnt = document.getElementById('tool-jimmy-count');
  if (out) out.value = JSON.stringify(list, null, 2);
  if (wrap) wrap.style.display = 'block';
  if (cnt) cnt.textContent = `全${list.length}件`;
}

// ================================================================
// リサーチ依頼文コピー（パペ向け）
// ================================================================
function copyResearchPrompt(btn) {
  const text = document.getElementById('mw-gemini').textContent.trim();
  if (!text) { toast('依頼文が生成されていません'); return; }
  const copy = () => {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).catch(copy);
  } else { copy(); }
  const msg = document.getElementById('research-copy-msg');
  if (msg) { msg.style.display = 'block'; setTimeout(() => { msg.style.display = 'none'; }, 2000); }
}

// ================================================================
// 機能③：ジミー向け全件JSONをワンクリックコピー
// ================================================================
function copyJimmyJSON(btn) {
  const list = getPublishedArticles().map(a => ({
    publishedTitle:    a.publishedTitle,
    titleKeywords:     a.titleKeywords || [],
    expansionAxis:     a.expansionAxis,
    emotionAxis:       a.emotionAxis,
    thinkingPattern:   a.thinkingPattern,
    readerPerspective: a.readerPerspective,
    coreLearning:      a.coreLearning,
    publishedAt:       a.publishedAt,
  }));
  const json = JSON.stringify(list, null, 2);
  const copy = () => {
    const ta = document.createElement('textarea');
    ta.value = json; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta);
  };
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(json).catch(copy);
  } else { copy(); }
  // sec-toolsのtextareaも更新（開いている場合）
  const out = document.getElementById('tool-jimmy-out');
  const wrap = document.getElementById('tool-jimmy-wrap');
  const cntEl = document.getElementById('tool-jimmy-count');
  if (out) out.value = json;
  if (wrap) wrap.style.display = 'block';
  if (cntEl) cntEl.textContent = `全${list.length}件`;
  const lbl = `ジミー用 全件JSONをコピー（全${list.length}件）`;
  btn.textContent = `✅ コピーしました！（全${list.length}件）`;
  btn.setAttribute('data-orig', lbl);
  setTimeout(() => { btn.textContent = lbl; }, 2000);
}

// ================================================================
// ================================================================
// 機能⑤：ダッシュボードストックカード更新
// ================================================================
function _updateStockCard(cnt) {
  const numEl  = document.getElementById('dash-stock-num');
  const card   = document.getElementById('dash-stock-card');
  const linkEl = document.getElementById('dash-stock-link');
  if (!numEl) return;
  numEl.textContent = cnt;
  const isLow = cnt < 5;
  numEl.style.color = isLow ? 'var(--orange)' : 'var(--green)';
  if (card) {
    card.style.border = isLow
      ? '1.5px solid rgba(192,112,48,.5)'
      : '1.5px solid var(--border)';
  }
  if (linkEl) {
    if (cnt === 0) {
      linkEl.innerHTML = `<span style="color:var(--orange);font-size:.72rem">⚠️ ネタ切れ注意！クロにネタ出しを依頼してください</span>`;
    } else if (cnt >= 5) {
      linkEl.innerHTML = `<a href="#" onclick="event.preventDefault();toggleSec('notes',true);setTimeout(()=>document.getElementById('sec-notes')?.scrollIntoView({behavior:'smooth'}),80)" style="color:var(--accent);text-decoration:underline">📝 記事候補一覧を見る</a>`;
    } else {
      linkEl.innerHTML = `<a href="#" onclick="event.preventDefault();toggleSec('import',true);setTimeout(()=>document.getElementById('sec-import')?.scrollIntoView({behavior:'smooth'}),80)" style="color:var(--orange);text-decoration:underline">🔍 クロにネタ出しを依頼（JSONインポートから追加）</a>`;
    }
  }
  // ジミー用ボタンの件数も更新
  const jimmyBtn = document.getElementById('arc-jimmy-btn');
  if (jimmyBtn) {
    const pubCnt = getPublishedArticles().length;
    const lbl = `ジミー用 全件JSONをコピー（全${pubCnt}件）`;
    jimmyBtn.textContent = lbl;
    jimmyBtn.setAttribute('data-orig', lbl);
  }
}

// ================================================================
// 機能④：執筆前チェックモーダル — チェック状態管理
// ================================================================
function _wcCheckState() {
  const checks = [...document.querySelectorAll('#writing-check-modal input[type="checkbox"]')];
  const allChecked = checks.every(c => c.checked);
  const btn = document.getElementById('wc-gen-btn');
  if (!btn) return;
  btn.disabled = !allChecked;
  btn.style.opacity     = allChecked ? '1'          : '0.5';
  btn.style.cursor      = allChecked ? 'pointer'     : 'not-allowed';
  btn.style.background  = allChecked ? 'var(--accent)' : 'var(--bg5)';
  btn.style.color       = allChecked ? '#fff'        : 'var(--text3)';
  btn.style.border      = allChecked ? 'none'        : '1px solid var(--border)';
}
function _wcCopyHandoff(btn) {
  const out = document.getElementById('wc-handoff-out');
  if (!out || !out.value) { toast('先に渡し用テキストを生成してください'); return; }
  const copy = () => {
    out.select(); try { document.execCommand('copy'); } catch(e) { navigator.clipboard?.writeText(out.value); }
  };
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(out.value).catch(copy);
  } else { copy(); }
  const orig = btn.textContent;
  btn.textContent = '✅ コピーしました！';
  setTimeout(() => { btn.textContent = orig; }, 2000);
}

// ================================================================
// INIT
// ================================================================
initSec();
renderSnapshot();
renderNotes();
renderXPosts();
renderArchive();

renderNetaList();
renderXPromptList();
renderXManage();
_initXPromptTextarea();
_initPublishedCollections();
// sec-bodyのoverflow修正（ホバーアニメーションで切れないよう）
['notes','xposts','today'].forEach(function(name){
  var b = document.getElementById('body-'+name);
  if(b && secState[name]) b.style.overflow = 'visible';
});
// Firebase初期化（localStorage→Firebase移行 + リアルタイム同期）
initFirebase();

// ================================================================
// 設定モーダル
// ================================================================
function openSettings() {
  // 現在のテンプレート値をコンソールに出力（Firebase移行確認用）
  console.log('[nabebase] Geminiテンプレート:', _geminiTmpl !== null && _geminiTmpl !== undefined ? 'カスタム値あり(Firebase)' : 'デフォルト使用');
  if (_geminiTmpl) console.log('[nabebase] Gemini tmpl(先頭100字):', _geminiTmpl.slice(0, 100));

  // ジミー指示文テンプレートをテキストエリアに読み込む（Firebaseキャッシュ使用）
  document.getElementById('settings-gemini-tmpl').value =
    (_geminiTmpl !== null && _geminiTmpl !== undefined) ? _geminiTmpl : getDefaultGeminiTmpl();

  // クロ指示文テンプレートをテキストエリアに読み込む（genChatGPT内のテンプレ）
  const savedClaude = S.claudeTmpl;
  document.getElementById('settings-claude-tmpl').value =
    savedClaude !== null && savedClaude !== undefined ? savedClaude : getDefaultClaudeTmpl();

  // Gemini APIキーを読み込む
  const savedGeminiApi = localStorage.getItem(GEMINI_KEY_STORAGE) || '';
  document.getElementById('settings-gemini-api-key').value = savedGeminiApi;
  const gMsg = document.getElementById('settings-gemini-api-msg');
  if (gMsg) gMsg.textContent = savedGeminiApi ? '✅ APIキー保存済み' : '';

  // Claude APIキーを読み込む
  const savedClaudeApi = localStorage.getItem(CLAUDE_API_KEY_STORAGE) || '';
  document.getElementById('settings-claude-api-key').value = savedClaudeApi;
  document.getElementById('settings-claude-api-msg').textContent =
    savedClaudeApi ? '✅ APIキー保存済み' : '';

  switchStab('gemini');
  document.getElementById('settings-modal').style.display = 'block';
}

function saveClaudeApiKeyFromSettings() {
  const k = document.getElementById('settings-claude-api-key').value.trim();
  if (!k) { toast('APIキーを入力してください'); return; }
  localStorage.setItem(CLAUDE_API_KEY_STORAGE, k);
  document.getElementById('settings-claude-api-msg').textContent = '✅ 保存しました';
  // ワークモーダルのフィールドも即反映
  const el = document.getElementById('claude-api-key');
  if (el) { el.value = k; }
  const st = document.getElementById('claude-key-status');
  if (st) st.innerHTML = '<span style="color:var(--green)">✅ APIキー保存済み</span>';
  toast('Claude APIキーを保存しました');
}

function closeSettings() {
  document.getElementById('settings-modal').style.display = 'none';
}

// ================================================================
// JSON一括登録
// ================================================================
let _jsonParsedItems = null;

function openJsonImport() {
  document.getElementById('json-import-area').value = '';
  document.getElementById('json-import-error').style.display = 'none';
  document.getElementById('json-import-preview').style.display = 'none';
  _jsonParsedItems = null;
  document.getElementById('json-import-modal').style.display = 'block';
}

function closeJsonImport() {
  document.getElementById('json-import-modal').style.display = 'none';
  _jsonParsedItems = null;
}

function jsonPasteFromClipboard() {
  navigator.clipboard.readText().then(t => {
    document.getElementById('json-import-area').value = t;
    jsonImportLiveCheck();
    toast('貼り付けました');
  }).catch(() => toast('クリップボードへのアクセスを許可してください'));
}

function jsonImportLiveCheck() {
  document.getElementById('json-import-error').style.display = 'none';
  document.getElementById('json-import-preview').style.display = 'none';
  _jsonParsedItems = null;
}

function validateAndImportJson() {
  const raw = document.getElementById('json-import-area').value.trim();
  const errEl = document.getElementById('json-import-error');
  const previewEl = document.getElementById('json-import-preview');
  const previewList = document.getElementById('json-preview-list');

  errEl.style.display = 'none';
  previewEl.style.display = 'none';
  _jsonParsedItems = null;

  if (!raw) {
    errEl.textContent = '❌ JSONを貼り付けてください';
    errEl.style.display = 'block';
    return;
  }

  // JSONパース（```json ... ``` ブロックも許容）
  let src = raw.replace(/^```(?:json)?\s*/i,'').replace(/\s*```\s*$/,'').trim();
  let items;
  try {
    items = JSON.parse(src);
  } catch(e) {
    errEl.innerHTML = `❌ JSONの形式が正しくありません<br><span style="font-size:11px">${e.message}</span><br><span style="font-size:11px;color:var(--text3)">ヒント：ClaudeのJSON出力をそのままコピーしてください</span>`;
    errEl.style.display = 'block';
    return;
  }

  // 単体オブジェクトは配列に変換
  if (!Array.isArray(items)) {
    if (typeof items === 'object' && items !== null && items.title) items = [items];
    else { errEl.textContent = '❌ 配列（[...]）形式で入力してください'; errEl.style.display = 'block'; return; }
  }
  if (items.length === 0) {
    errEl.textContent = '❌ 0件です。JSONの内容を確認してください';
    errEl.style.display = 'block';
    return;
  }

  // 必須はtitleのみ、それ以外は補完
  const validStatuses = ['idea', 'writing', 'review', 'xprep', 'done'];
  const warnings = [];
  items.forEach((item, i) => {
    if (!item.title) { item.title = `（タイトル未設定 ${i+1}）`; warnings.push(`記事${i+1}：titleが空のため仮タイトルを設定`); }
    if (!item.status || !validStatuses.includes(item.status)) {
      if (item.status) warnings.push(`記事${i+1}「${item.title}」：status「${item.status}」は無効 → 「idea」に設定`);
      item.status = 'idea';
    }
    item.type = item.type || '';
    item.cat = item.cat || '';
    item.publishDate = item.publishDate || '';
    item.memo = item.memo || '';
    item.axis = item.axis || '';
    item.prevLink = item.prevLink || '';
    item.nextLink = item.nextLink || '';
    item.researchNote = item.researchNote || '';
  });

  _jsonParsedItems = items;
  const statusLabel = {idea:'💡アイデア', writing:'✍️執筆中', review:'🔍確認中', xprep:'📣X準備', done:'✅完了'};
  previewList.innerHTML =
    items.map((item, i) => `
      <div style="padding:5px 0;border-bottom:1px solid var(--border);display:flex;gap:6px;align-items:baseline;flex-wrap:wrap">
        <span style="color:var(--text3);flex-shrink:0;font-size:11px">${i+1}.</span>
        <span style="font-weight:600;color:var(--text);flex:1;min-width:0">${item.title}</span>
        <span style="color:var(--text3);font-size:11px;flex-shrink:0">${statusLabel[item.status]||item.status}</span>
        ${item.publishDate?`<span style="color:var(--accent);font-size:11px;flex-shrink:0">📅${item.publishDate}</span>`:''}
      </div>`).join('') +
    (warnings.length ? `<div style="margin-top:8px;padding:8px;background:rgba(232,168,48,.1);border-radius:6px;font-size:11px;color:var(--yellow);line-height:1.7">⚠️ ${warnings.join('<br>')}</div>` : '');

  document.getElementById('json-confirm-btn').textContent = `✅ ${items.length}件を追加登録する`;
  previewEl.style.display = 'block';
  setTimeout(() => document.getElementById('json-confirm-btn').scrollIntoView({behavior:'smooth',block:'nearest'}), 100);
}

function commitImportJson() {
  if (!_jsonParsedItems || !_jsonParsedItems.length) return;
  const maxId = Math.max(...S.notes.map(n => n.id), 200);
  _jsonParsedItems.forEach((item, i) => {
    S.notes.push({
      id: maxId + i + 1,
      title: item.title, type: item.type, cat: item.cat,
      status: item.status, publishDate: item.publishDate,
      memo: item.memo, prevLink: item.prevLink,
      nextLink: item.nextLink, researchNote: item.researchNote,
      rakuten: false, researchDone: false, researchDate: '',
      geminiResult: '', claudeResult: '', draftText: ''
    });
  });
  save(); renderNotes(); closeJsonImport();
  toast(`✅ ${_jsonParsedItems.length}件を追加登録しました`);
}

// ================================================================
// プロンプト保管庫
// ================================================================
const PROMPT_VAULT_KEY = 'beyan_prompt_vault';
let _vaultEditingId = null;

function _escHtml(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function getVaultPrompts() {
  return S.promptVault || [];
}
function renderVaultList() {
  const list = getVaultPrompts();
  const el = document.getElementById('vault-list');
  const countEl = document.getElementById('vault-count');
  if (!el) return;
  if (countEl) countEl.textContent = list.length + '件';
  if (!list.length) {
    el.innerHTML = '<div style="color:#666;font-size:13px;text-align:center;padding:24px 0;">まだ保存されていません</div>';
    return;
  }
  el.innerHTML = list.map(p => `
    <div style="background:#1a1a2e;border:1px solid #333;border-radius:10px;padding:12px;margin-bottom:8px;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:6px;">
        <div style="min-width:0;">
          <div style="font-size:13px;font-weight:700;color:#e8e8e8;margin-bottom:3px;word-break:break-word;">${_escHtml(p.name)}</div>
          ${p.memo?`<div style="font-size:11px;color:#888;line-height:1.5;">${_escHtml(p.memo)}</div>`:''}
        </div>
        <div style="display:flex;gap:5px;flex-shrink:0;">
          <button onclick="copyVaultPrompt(${p.id})"
            style="min-height:30px;padding:0 8px;background:#1a2e1a;border:1px solid #4a7a4a55;border-radius:6px;color:#86efac;font-size:11px;cursor:pointer;font-family:inherit;white-space:nowrap;">📋</button>
          <button onclick="startVaultEdit(${p.id})"
            style="min-height:30px;padding:0 8px;background:#1a2040;border:1px solid #33448855;border-radius:6px;color:#88aaff;font-size:11px;cursor:pointer;font-family:inherit;white-space:nowrap;">✏️</button>
          <button onclick="deleteVaultPrompt(${p.id})"
            style="min-height:30px;padding:0 8px;background:#2e1a1a;border:1px solid #5a2a2a55;border-radius:6px;color:#f88;font-size:11px;cursor:pointer;font-family:inherit;white-space:nowrap;">🗑️</button>
        </div>
      </div>
      <div style="font-size:11px;color:#555;line-height:1.5;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;">${_escHtml(p.body)}</div>
    </div>
  `).join('');
}
function saveVaultPrompt() {
  const name = (document.getElementById('vault-name').value||'').trim();
  const body = (document.getElementById('vault-body').value||'').trim();
  const memo = (document.getElementById('vault-memo').value||'').trim();
  if (!name) { toast('プロンプト名を入力してください'); return; }
  if (!body) { toast('プロンプト本文を入力してください'); return; }
  const list = getVaultPrompts();
  if (_vaultEditingId !== null) {
    const idx = list.findIndex(p => p.id === _vaultEditingId);
    if (idx !== -1) list[idx] = { ...list[idx], name, body, memo };
    _vaultEditingId = null;
  } else {
    list.unshift({ id: Date.now(), name, body, memo });
  }
  S.promptVault = list; save();
  document.getElementById('vault-name').value = '';
  document.getElementById('vault-body').value = '';
  document.getElementById('vault-memo').value = '';
  document.getElementById('vault-save-btn').textContent = '💾 追加';
  document.getElementById('vault-form-title').textContent = '✏️ プロンプトを追加';
  document.getElementById('vault-cancel-btn').style.display = 'none';
  renderVaultList();
  toast('✅ 保管庫に保存しました');
}
function startVaultEdit(id) {
  const p = getVaultPrompts().find(x => x.id === id);
  if (!p) return;
  _vaultEditingId = id;
  document.getElementById('vault-name').value = p.name;
  document.getElementById('vault-body').value = p.body;
  document.getElementById('vault-memo').value = p.memo || '';
  document.getElementById('vault-save-btn').textContent = '💾 更新';
  document.getElementById('vault-form-title').textContent = '✏️ プロンプトを編集';
  document.getElementById('vault-cancel-btn').style.display = '';
  document.getElementById('vault-name').focus();
}
function cancelVaultEdit() {
  _vaultEditingId = null;
  document.getElementById('vault-name').value = '';
  document.getElementById('vault-body').value = '';
  document.getElementById('vault-memo').value = '';
  document.getElementById('vault-save-btn').textContent = '💾 追加';
  document.getElementById('vault-form-title').textContent = '✏️ プロンプトを追加';
  document.getElementById('vault-cancel-btn').style.display = 'none';
}
function deleteVaultPrompt(id) {
  if (!confirm('このプロンプトを削除しますか？')) return;
  const list = getVaultPrompts().filter(p => p.id !== id);
  localStorage.setItem(PROMPT_VAULT_KEY, JSON.stringify(list));
  renderVaultList();
  toast('削除しました');
}
function copyVaultPrompt(id) {
  const p = getVaultPrompts().find(x => x.id === id);
  if (!p) return;
  navigator.clipboard.writeText(p.body)
    .then(() => toast('📋 コピーしました：' + p.name))
    .catch(() => toast('コピーに失敗しました'));
}

function switchStab(tab) {
  ['gemini','claude','vault'].forEach(t => {
    document.getElementById('spanel-'+t).style.display = t === tab ? '' : 'none';
    document.getElementById('stab-'+t).classList.toggle('active', t === tab);
  });
  if (tab === 'vault') renderVaultList();
}

// ================================================================
// クロ共有
// ================================================================
function openShareModal() {
  const stats = S.shareStats || {};
  document.getElementById('share-followers').value = stats.followers || '';
  document.getElementById('share-impress').value   = stats.impress   || '';
  document.getElementById('share-nview').value     = stats.nview     || '';
  document.getElementById('share-nlikes').value    = stats.nlikes    || '';
  document.getElementById('share-result').textContent = '';
  document.getElementById('share-modal').style.display = 'block';
}

function closeShareModal() {
  document.getElementById('share-modal').style.display = 'none';
}

function buildShareReport() {
  const now = new Date();
  const dateStr = `${now.getFullYear()}/${String(now.getMonth()+1).padStart(2,'0')}/${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  const followers = document.getElementById('share-followers').value || '未入力';
  const impress   = document.getElementById('share-impress').value   || '未入力';
  const nview     = document.getElementById('share-nview').value     || '未入力';
  const nlikes    = document.getElementById('share-nlikes').value    || '未入力';

  // 数値を保存
  S.shareStats = { followers, impress, nview, nlikes }; save();

  const notes = S.notes.map(n => ({
    title: n.title, type: n.type, cat: n.cat,
    status: n.status, publishDate: n.publishDate || '', memo: n.memo || ''
  }));

  const xpostsList = S.xposts.map(p => ({
    content: p.content, type: p.type, status: p.status
  }));

  return `=== nabebase現状レポート ===
【記録日時】${dateStr}

【note記事一覧】
${JSON.stringify(notes, null, 2)}

【X投稿ストック】
${JSON.stringify(xpostsList, null, 2)}

【数値サマリー】
Xフォロワー: ${followers}人
週間インプレ: ${impress}件
noteビュー: ${nview}
noteスキ: ${nlikes}`;
}

function copyToKuro() {
  const report = buildShareReport();
  navigator.clipboard.writeText(report).then(() => {
    document.getElementById('share-result').textContent = '✅ コピーしました！';
    toast('✅ コピーしました！');
    setTimeout(() => { document.getElementById('share-result').textContent = ''; }, 3000);
  }).catch(() => toast('コピーに失敗しました'));
}

function copyAndOpenKuro() {
  const report = buildShareReport();
  navigator.clipboard.writeText(report).then(() => {
    toast('✅ コピーしました！Claudeが開きます');
    document.getElementById('share-result').textContent = '✅ コピーしました！';
    window.open('https://claude.ai', '_blank');
    setTimeout(() => { document.getElementById('share-result').textContent = ''; }, 3000);
  }).catch(() => toast('コピーに失敗しました'));
}

function saveGeminiTmpl() {
  if (_fbRef && _geminiTmpl) { _fbRef.child('beyan_gemini_tmpl_bak').set(_geminiTmpl); }
  const val = document.getElementById('settings-gemini-tmpl').value;
  _geminiTmpl = val;
  const ts = new Date().toISOString();
  _geminiTmplUpdatedAt = ts;
  if (_fbRef) {
    firebase.database().ref(GEMINI_TMPL_KEY).set(val);
    firebase.database().ref(GEMINI_TMPL_KEY + '_ts').set(ts);
  } else { localStorage.setItem(GEMINI_TMPL_KEY, val); }
  _updateGeminiTsDisplay();
  const msg = document.getElementById('settings-gemini-msg');
  msg.style.display = 'block';
  setTimeout(() => { msg.style.display = 'none'; }, 2500);
}

function resetGeminiTmpl() {
  if (!confirm('デフォルトに戻しますか？')) return;
  _geminiTmpl = null;
  if (_fbRef) { firebase.database().ref(GEMINI_TMPL_KEY).remove(); }
  else { localStorage.removeItem(GEMINI_TMPL_KEY); }
  document.getElementById('settings-gemini-tmpl').value = getDefaultGeminiTmpl();
  const msg = document.getElementById('settings-gemini-msg');
  msg.textContent = '🔄 デフォルトに戻しました';
  msg.style.display = 'block';
  setTimeout(() => { msg.style.display = 'none'; msg.textContent = '✅ 保存しました'; }, 2500);
}

function saveClaudeTmpl() {
  const val = document.getElementById('settings-claude-tmpl').value;
  S.claudeTmpl = val; save();
  const msg = document.getElementById('settings-claude-msg');
  msg.style.display = 'block';
  setTimeout(() => { msg.style.display = 'none'; }, 2500);
}

function resetClaudeTmpl() {
  if (!confirm('デフォルトに戻しますか？')) return;
  S.claudeTmpl = null; save();
  document.getElementById('settings-claude-tmpl').value = getDefaultClaudeTmpl();
  const msg = document.getElementById('settings-claude-msg');
  msg.textContent = '🔄 デフォルトに戻しました';
  msg.style.display = 'block';
  setTimeout(() => { msg.style.display = 'none'; msg.textContent = '✅ 保存しました'; }, 2500);
}


// ================================================================
// 外部連携ヘルパー
// ================================================================
function openInGemini(text) {
  navigator.clipboard.writeText(text.trim()).then(() => {
    toast('コピーしました。Geminiが開きます');
    window.open('https://gemini.google.com', '_blank');
  });
}
function openInClaude(text) {
  navigator.clipboard.writeText(text.trim()).then(() => {
    toast('コピーしました。Claudeが開きます');
    window.open('https://claude.ai', '_blank');
  });
}
function openTmplInGemini() {
  openInGemini(document.getElementById('settings-gemini-tmpl').value);
}
function openTmplInClaude() {
  openInClaude(document.getElementById('settings-claude-tmpl').value);
}
function openXPost(id) {
  const p = S.xposts.find(x => x.id === id);
  if (!p) return;
  navigator.clipboard.writeText(p.content).then(() => {
    toast('コピーしました。X投稿画面が開きます');
    window.open('https://x.com/compose/post', '_blank');
    if (p.status !== 'posted') { p.status = 'posted'; save(); renderXPosts(); renderArchive(); }
  });
}

// ================================================================
// 機能1: リサーチ済みフラグ
// ================================================================
function toggleResearch(id, event) {
  event.stopPropagation();
  const n = S.notes.find(x => x.id === id);
  if (!n) return;
  if (n.researchDone) {
    n.researchDone = false;
    n.researchDate = '';
  } else {
    n.researchDone = true;
    const now = new Date();
    n.researchDate = `${now.getMonth()+1}/${now.getDate()}済み`;
  }
  save();
  renderNotes();
}

// ================================================================
// 機能2: 執筆予定一覧をクロにコピー
// ================================================================
function copyNoteListForClaude() {
  const notes = S.notes || [];
  if (!notes.length) { toast('記事がありません'); return; }
  const now = new Date().toLocaleDateString('ja-JP');
  const SL = { idea:'📝 アイデア', writing:'✍️ 執筆中', review:'🔍 確認中', xprep:'📣 X準備中', done:'✅ 公開済み' };
  const groups = { idea:[], writing:[], review:[], xprep:[], done:[] };
  notes.forEach(n => { (groups[n.status] || groups.idea).push(n); });

  const lines = [
    `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `【note執筆予定一覧】${now} 現在`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    '',
    '◆ 依頼内容',
    '・記事の並び替え・追加・削除・差し替えをお願いします',
    '・変更後は全件をJSONで出力してください（アプリに貼り付けて反映）',
    '',
  ];

  // ステータス別に出力（done以外）
  const activeStatuses = ['writing','review','xprep','idea'];
  let idx = 1;
  activeStatuses.forEach(st => {
    const list = groups[st];
    if (!list.length) return;
    lines.push(`── ${SL[st]}（${list.length}件）──`);
    list.forEach(n => {
      lines.push(`#${idx++}  ${n.title}`);
      const meta = [`カテゴリ：${n.cat||'未設定'}`, `タイプ：${n.type||'未設定'}`, `公開予定：${n.publishDate||'未定'}`];
      if (n.rakuten) meta.push('🛒楽天あり');
      lines.push(`    ${meta.join(' ／ ')}`);
      if (n.memo) lines.push(`    内容メモ：${n.memo}`);
      if (n.researchNote) lines.push(`    リサーチ済み：${n.researchNote}`);
      if (n.prevLink || n.nextLink) {
        if (n.prevLink) lines.push(`    ◀ 前記事：${n.prevLink}`);
        if (n.nextLink) lines.push(`    ▶ 次記事：${n.nextLink}`);
      }
    });
    lines.push('');
  });

  if (groups.done.length) {
    lines.push(`── ${SL.done}（${groups.done.length}件）──`);
    groups.done.forEach(n => {
      lines.push(`#${idx++}  ${n.title}（${n.publishDate||'-'}公開）`);
    });
    lines.push('');
  }

  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('◆ 変更後のJSON出力フォーマット（全件・そのまま出力してください）');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push(JSON.stringify(notes.map(n => ({
    id: n.id, title: n.title, type: n.type||'', cat: n.cat||'',
    status: n.status, publishDate: n.publishDate||'', memo: n.memo||'',
    prevLink: n.prevLink||'', nextLink: n.nextLink||'',
    researchNote: n.researchNote||'', rakuten: !!n.rakuten
  })), null, 2));

  const active = notes.filter(n => n.status !== 'done');
  const text = lines.join('\n');
  navigator.clipboard.writeText(text)
    .then(() => toast(`✅ note ${active.length}件をコピーしました！クロに貼り付けてください`))
    .catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
      toast('✅ note一覧をコピーしました！');
    });
}

function copyXPostsForClaude() {
  const xposts = S.xposts || [];
  if (!xposts.length) { toast('X投稿がありません'); return; }
  const now = new Date().toLocaleDateString('ja-JP');
  const stock  = xposts.filter(p => p.status !== 'posted');
  const posted = xposts.filter(p => p.status === 'posted');
  const typeA  = stock.filter(p => p.type === 'A');
  const typeB  = stock.filter(p => p.type === 'B');

  const lines = [
    `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `【X投稿ストック一覧】${now} 現在`,
    `ストック：${stock.length}件（A:${typeA.length}件 ／ B:${typeB.length}件）　投稿済み：${posted.length}件`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    '',
    '◆ 依頼内容',
    '・追加・削除・書き直し・タイプ変更をお願いします',
    '・タイプA：朝7時投稿（拡散狙い・noteリンクなし・フォロワー増加目的）',
    '・タイプB：夜21時投稿（信頼構築・noteリンクあり・読者化目的）',
    '・変更後は全件をJSONで出力してください（アプリに貼り付けて反映）',
    '',
  ];

  if (typeA.length) {
    lines.push('── タイプA（朝7時・拡散狙い）──');
    typeA.forEach((p, i) => {
      const cc = p.content.replace(/\n/g,'').length;
      lines.push(`#${i+1}  登録日：${p.createdAt||'-'}　${cc}字`);
      lines.push('▼');
      lines.push(p.content);
      lines.push('');
    });
  }

  if (typeB.length) {
    lines.push('── タイプB（夜21時・noteリンクあり）──');
    typeB.forEach((p, i) => {
      const cc = p.content.replace(/\n/g,'').length;
      lines.push(`#${typeA.length+i+1}  登録日：${p.createdAt||'-'}　${cc}字`);
      lines.push('▼');
      lines.push(p.content);
      lines.push('');
    });
  }

  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push('◆ 変更後のJSON出力フォーマット（ストック分のみ・そのまま出力してください）');
  lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━');
  lines.push(JSON.stringify(stock.map(p => ({
    id: p.id, type: p.type, content: p.content,
    status: 'stock', createdAt: p.createdAt||''
  })), null, 2));

  const text = lines.join('\n');
  navigator.clipboard.writeText(text)
    .then(() => toast(`✅ X投稿 ${stock.length}件をコピーしました！クロに貼り付けてください`))
    .catch(() => {
      const ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
      toast('✅ X投稿一覧をコピーしました！');
    });
}

// ================================================================
// 機能3: ネタストック
// ================================================================
let netaOpen = false;
function toggleNetaSection() {
  netaOpen = !netaOpen;
  const body = document.getElementById('neta-body');
  const chev = document.getElementById('neta-chev');
  if (netaOpen) {
    body.style.maxHeight = '99999px';
    chev.style.transform = 'rotate(180deg)';
  } else {
    body.style.maxHeight = '0';
    chev.style.transform = '';
  }
}
function addSingleNeta() {
  const input = document.getElementById('neta-input');
  const text = input.value.trim();
  if (!text) { toast('ネタを入力してください'); return; }
  S.neta.unshift({ id: Date.now(), text, used: false });
  input.value = '';
  save();
  renderNetaList();
  toast('ネタを追加しました ✓');
}
function addBulkNeta() {
  const raw = document.getElementById('neta-bulk-input').value;
  const lines = raw.split('\n').map(l => l.trim()).filter(l => l);
  if (!lines.length) { toast('ネタを入力してください'); return; }
  const ts = Date.now();
  lines.forEach((text, i) => S.neta.unshift({ id: ts + i, text, used: false }));
  document.getElementById('neta-bulk-input').value = '';
  save();
  renderNetaList();
  toast(`${lines.length}件のネタを追加しました ✓`);
}
function toggleNetaUsed(id) {
  const item = S.neta.find(x => x.id === id);
  if (item) { item.used = !item.used; save(); renderNetaList(); }
}
function deleteNeta(id) {
  S.neta = S.neta.filter(x => x.id !== id);
  save(); renderNetaList();
}
function renderNetaList() {
  const list = S.neta || [];
  const countEl = document.getElementById('neta-count-lbl');
  if (countEl) countEl.textContent = `${list.filter(n=>!n.used).length}件未使用`;
  const el = document.getElementById('neta-list');
  if (!el) return;
  if (!list.length) {
    el.innerHTML = '<div style="font-size:12px;color:var(--text3);text-align:center;padding:8px 0">ネタがありません</div>';
    return;
  }
  el.innerHTML = list.map(item => `
    <div class="neta-item${item.used?' used':''}">
      <span class="neta-text${item.used?' used':''}">${item.text}</span>
      <button class="neta-toggle${item.used?' done':''}" onclick="toggleNetaUsed(${item.id})">${item.used?'✅ 使用済み':'未使用'}</button>
      <button class="neta-del" onclick="deleteNeta(${item.id})">✕</button>
    </div>`).join('');
  // neta-bodyの高さ再計算
  if (netaOpen) {
    const body = document.getElementById('neta-body');
    body.style.maxHeight = body.scrollHeight + 500 + 'px';
  }
}


// ================================================================
// 見出し画像生成
// ================================================================
let imggenNoteId = null;

// ================================================================
// 見出し画像生成（新実装）
// ================================================================

let _imgPromptVaultTimer = null;

function _updateImgPromptVaultTs() {
  const el = document.getElementById('imgprompt-vault-ts');
  if (!el) return;
  const raw = S.imggenPrompt || localStorage.getItem('nabebase_imggen_prompt');
  if (!raw) { el.textContent = ''; return; }
  const now = new Date();
  el.textContent = `最終更新：${now.getMonth()+1}/${now.getDate()} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
}


let _imgTextFieldTimer = null;

async function clickGenerateHeaderSVG() {
  const n = S.notes.find(x => x.id === curId);
  const mainTitle   = (document.getElementById('mw-main-title')?.value   || n?.mainTitle   || n?.title || '').trim();
  const subTitle    = (document.getElementById('mw-sub-title')?.value    || n?.subTitle    || '').trim();
  const bodySummary = (document.getElementById('mw-body-summary')?.value || n?.bodySummary || '').trim();
  const category    = n?.type || '';

  document.getElementById('mwimg-result').style.display = 'none';
  document.getElementById('mwimg-error').style.display  = 'none';
  const loadEl   = document.getElementById('mwimg-loading');
  const statusEl = document.getElementById('mwimg-status');
  const pbar     = document.getElementById('mwimg-pbar');
  if (loadEl)   loadEl.style.display = 'block';
  if (pbar)     pbar.style.width = '10%';
  if (statusEl) statusEl.textContent = 'パターンを確認中...';

  const apiKey = localStorage.getItem('beyan_gemini_key') || '';
  if (!apiKey) {
    console.log('[ImgGen] no API key, using default SVG');
    await _genLocalSVG(mainTitle, subTitle, bodySummary, loadEl, statusEl, pbar);
    return;
  }

  try {
    // ===== Step0: パターン確認・初回生成 =====
    let patterns = null;
    if (typeof firebase !== 'undefined' && firebase.database) {
      const snap = await firebase.database().ref('imggen_patterns').once('value');
      patterns = snap.val();
    }

    if (!patterns) {
      console.log('[ImgGen] step0 generating patterns...');
      if (pbar) pbar.style.width = '15%';

      const step0Prompt = `あなたはnote記事の見出し画像を専門に制作するプロのアートディレクターです。
以下の条件で、バリエーション豊かな高品質テンプレートを20パターン生成してください。

## 絶対条件
1. スマホ縮小時でもタイトルが読める（font-size最低96px）
2. 文字が主役・背景は舞台
3. 要素は2〜4個に絞る
4. 20パターンは必ず全部「見た目が別物」にする（色違いの使い回し禁止）
5. 参考にするクオリティ基準：雑誌・YouTube・プロのバナー広告レベル

## 20パターンのバリエーション軸（すべて網羅）

レイアウト（各複数回使用可だが構成を変える）：
- 左寄せ（テキスト左・右側に大アイコンや装飾）
- 中央（上下帯・ライン・矩形で囲む）
- 斜め分割（左右を斜めのpolygonで色分け）
- 上下分割（上下をrectで完全に色分け）
- カード型（中央に角丸rectを重ねてテキストを乗せる）
- 帯型（上下にaccent色の太帯・中央にメインテキスト）
- 左重心（左側に太い縦帯＋右にテキスト）

背景（バリエーション必須）：
- 暗色単色（#1a202c #1e3a8a #2d3748 #1a1a2e #0f172a など）
- 明色単色（#f7fafc #fffbeb #f0fff4 など）
- 2色グラデーション（対角線方向）
- 3色グラデーション（リッチな奥行き感）
- 幾何学模様（三角・六角・ひし形をopacity 0.08〜0.15で敷き詰め）
- テクスチャ（細かいcircle/lineをopacity 0.05〜0.1で規則配置）
- 斜め分割背景（polygon2つで左右を別色に）

アクセント色（パターンごとに必ず変える）：
#f59e0b #f6ad55 #f6e05e #ef4444 #e53e3e #48bb78 #38b2ac #4299e1 #9f7aea #ed64a6 #ff6b35 #c9a84c

アイコン（具体的なSVGパスで描く）：
- 電球・稲妻・チェック・矢印・星・本・ペン・グラフ・ターゲット・ロケット
- 配置：1つ大（180〜220px）・複数小（40〜60px×3〜6個）・背景透かし（400px opacity 0.06）

用途（記事ジャンルとデザインを対応させる）：
- 比較記事：斜め分割・VSレイアウト・ゴールド×ネイビー
- 体験談：暖色系・左寄せ・大アイコン
- ノウハウ：明色背景・帯型・チェックアイコン
- 感情訴求：暗色背景・中央・大文字
- AI活用：青緑系・幾何学・稲妻アイコン

## 出力形式
JSONのみ。説明文・マークダウン・コードブロック不要。
20要素の配列で返す。

[
  {
    "id": 1,
    "name": "パターン名（例：ネイビー斜め分割・ゴールドVS）",
    "layout": "斜め分割",
    "bg_type": "斜め分割背景",
    "bg_color": "#1e3a8a",
    "accent_color": "#f59e0b",
    "text_color": "#ffffff",
    "font_weight": "極太",
    "font_style": "ゴシック",
    "icon": "稲妻",
    "icon_placement": "背景透かし",
    "best_for": "比較記事",
    "design_note": "ネイビー×ゴールドの対比で力強く"
  }
]`;

      const step0Res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: step0Prompt }] }],
            generationConfig: { maxOutputTokens: 8192, temperature: 0.7 }
          })
        }
      );
      const step0Data = await step0Res.json();
      if (!step0Res.ok) throw new Error(step0Data.error?.message || String(step0Res.status));
      const step0Parts = step0Data.candidates?.[0]?.content?.parts || [];
      const step0Text  = step0Parts.filter(p => !p.thought).map(p => p.text || '').join('');
      console.log('[ImgGen] step0 raw length:', step0Text.length);
      console.log('[ImgGen] step0 raw full:', JSON.stringify(step0Text));

      const cleanJson = step0Text
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      const match = cleanJson.match(/\[[\s\S]*\]/);
      if (!match) throw new Error('[step0] patterns JSON array not found');
      patterns = JSON.parse(match[0]);

      if (typeof firebase !== 'undefined' && firebase.database) {
        await firebase.database().ref('imggen_patterns').set(patterns);
      }
      console.log('[ImgGen] step0 executed:', patterns.length, 'patterns saved');
      if (pbar) pbar.style.width = '30%';
    } else {
      console.log('[ImgGen] step0 skipped: patterns loaded from Firebase');
    }

    // ===== Step1: 最適パターン選択 =====
    if (statusEl) statusEl.textContent = 'デザインを選択中...';
    if (pbar) pbar.style.width = '40%';

    const patternsList = Array.isArray(patterns) ? patterns : Object.values(patterns);

    const patternIds = patternsList.map(p => p.id);
    const selectedId = patternIds[Math.floor(Math.random() * patternIds.length)];
    console.log('[ImgGen] step1 selected pattern:', selectedId, '(random)');

    const selectedPattern = patternsList.find(p => p.id === selectedId) || patternsList[0];

    // ===== Step2: SVG生成 =====
    if (statusEl) statusEl.textContent = '画像を生成中...';
    if (pbar) pbar.style.width = '60%';
    console.log('[ImgGen] step2 SVG generating...');

    const savedPrompt = S.imggenPrompt || localStorage.getItem('nabebase_imggen_prompt') || '';

    const step2Prompt = savedPrompt
      ? savedPrompt
          .replace('{mainTitle}', mainTitle)
          .replace('{subTitle}', subTitle)
          .replace('{bodySummary}', bodySummary)
          .replace('{selectedPattern.layout}', selectedPattern.layout || '')
          .replace('{selectedPattern.bg_type}', selectedPattern.bg_type || '')
          .replace('{selectedPattern.bg_color}', selectedPattern.bg_color || '')
          .replace('{selectedPattern.accent_color}', selectedPattern.accent_color || '')
          .replace('{selectedPattern.text_color}', selectedPattern.text_color || '')
          .replace('{selectedPattern.font_style}', selectedPattern.font_style || '')
          .replace('{selectedPattern.font_weight}', selectedPattern.font_weight || '')
          .replace('{selectedPattern.icon}', selectedPattern.icon || '')
          .replace('{selectedPattern.icon_placement}', selectedPattern.icon_placement || '')
          .replace('{selectedPattern.design_note}', selectedPattern.design_note || '')
      : `以下のデザイン仕様で1280×670pxのSVG画像を1枚生成してください。
<svg>タグから始まり</svg>タグで終わるSVGコードのみ返してください。
説明文・マークダウン・コードブロック不要。

【テキスト情報】
メインタイトル：${mainTitle}
サブタイトル：${subTitle}
本文要約：${bodySummary}

【デザイン仕様】
レイアウト：${selectedPattern.layout}
背景タイプ：${selectedPattern.bg_type}
背景色：${selectedPattern.bg_color}
アクセント色：${selectedPattern.accent_color}
文字色：${selectedPattern.text_color}
フォント：${selectedPattern.font_style} ${selectedPattern.font_weight}
アイコン：${selectedPattern.icon}（配置：${selectedPattern.icon_placement}）
デザインの方向性：${selectedPattern.design_note}

【必須ルール】
- 文字は必ず読める大きさ・コントラストにする
- メインタイトルを最も大きく配置する
- 情報は2〜4要素に絞る
- 背景は文字の邪魔をしない
- 過剰なエフェクト・光彩は使わない
- 日本語テキストは正確に描画する`;

    console.log('[ImgGen] step2 prompt:', step2Prompt);
    const step2Res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: step2Prompt }] }],
          generationConfig: { maxOutputTokens: 8192, temperature: 0.7 }
        })
      }
    );
    console.log('[ImgGen] step2 status:', step2Res.status);
    console.log('[ImgGen] step2 response ok:', step2Res.ok);
    const step2RawText = await step2Res.text();
    console.log('[ImgGen] step2 raw body:', JSON.stringify(step2RawText).slice(0, 300));
    if (!step2Res.ok) throw new Error('step2 error: ' + step2Res.status);
    let responseText = '';
    try {
      const step2Data = JSON.parse(step2RawText);
      const step2Parts = step2Data.candidates?.[0]?.content?.parts || [];
      responseText = step2Parts.filter(p => !p.thought).map(p => p.text || '').join('');
    } catch(e) {
      console.log('[ImgGen] step2 JSON parse error:', e.message);
    }
    console.log('[ImgGen] step2 responseText assign:', JSON.stringify(responseText).slice(0, 100));
    console.log('[ImgGen] step2 raw length:', responseText.length);
    console.log('[ImgGen] step2 raw full:', JSON.stringify(responseText));
    responseText = responseText.replace(/^```(?:xml|svg)?\n?/i, '').replace(/\n?```$/i, '').trim();
    console.log('[ImgGen] step2 raw start:', responseText.slice(0, 50));

    const svgMatch = responseText.match(/<svg[\s\S]*<\/svg>/);
    if (svgMatch) {
      console.log('[ImgGen] SVG generated');
      if (pbar)     pbar.style.width = '85%';
      if (statusEl) statusEl.textContent = 'PNG変換中...';
      const svgCleaned = svgMatch[0].replace(/@import\s+url\([^)]*fonts\.googleapis[^)]*\)[^;]*;/g, '');
      await _svgToPngAndDisplay(svgCleaned, loadEl, pbar);
      if (statusEl) statusEl.textContent = '完成！';
    } else {
      console.log('[ImgGen] fallback to local SVG');
      await _genLocalSVG(mainTitle, subTitle, bodySummary, loadEl, statusEl, pbar);
    }
  } catch(e) {
    console.log('[ImgGen] error: ' + e.message + ', fallback to local SVG');
    await _genLocalSVG(mainTitle, subTitle, bodySummary, loadEl, statusEl, pbar);
  }
}

async function _genLocalSVG(mainTitle, subTitle, bodySummary, loadEl, statusEl, pbar) {
  const W = 1280, H = 670;
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#1a2e20"/>
        <stop offset="100%" stop-color="#2d4a35"/>
      </linearGradient>
      <linearGradient id="acGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#c07030"/>
        <stop offset="100%" stop-color="#e09040"/>
      </linearGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bgGrad)"/>
    <rect x="0" y="0" width="10" height="${H}" fill="url(#acGrad)"/>
    <rect x="80" y="60" width="560" height="5" fill="url(#acGrad)" opacity="0.8"/>
    <text x="80" y="290" font-family="'Noto Sans JP','Hiragino Kaku Gothic ProN','Yu Gothic',sans-serif" font-size="72" font-weight="900" fill="#ffffff">${_escXml(mainTitle)}</text>
    <text x="80" y="380" font-family="'Noto Sans JP','Hiragino Kaku Gothic ProN','Yu Gothic',sans-serif" font-size="40" font-weight="700" fill="#e09040">${_escXml(subTitle)}</text>
    <text x="80" y="450" font-family="'Noto Sans JP','Hiragino Kaku Gothic ProN','Yu Gothic',sans-serif" font-size="28" font-weight="400" fill="#99bb99">${_escXml(bodySummary)}</text>
    <rect x="80" y="590" width="560" height="3" fill="url(#acGrad)" opacity="0.4"/>
    <text x="${W-60}" y="${H-25}" font-family="'Noto Sans JP',sans-serif" font-size="20" fill="#668866" text-anchor="end" opacity="0.5">nabebase</text>
  </svg>`;
  console.log('[ImgGen] SVG generated');
  if (pbar)     pbar.style.width = '60%';
  if (statusEl) statusEl.textContent = 'PNG変換中...';
  await _svgToPngAndDisplay(svgContent, loadEl, pbar);
}

async function _svgToPngAndDisplay(svgContent, loadEl, pbar) {
  try {
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width  = img.naturalWidth  || 1280;
        canvas.height = img.naturalHeight || 670;
        canvas.getContext('2d').drawImage(img, 0, 0);
        URL.revokeObjectURL(url);
        const pngDataUrl = canvas.toDataURL('image/png');
        const imgEl2 = document.getElementById('mwimg-img');
        if (imgEl2) {
          imgEl2.src = pngDataUrl;
          imgEl2.dataset.mime = 'image/png';
          imgEl2.dataset.b64  = pngDataUrl.split(',')[1];
          imgEl2.dataset.url  = '';
        }
        document.getElementById('mwimg-result').style.display = 'block';
        updateCcheckImg(pngDataUrl);
        if (pbar)   pbar.style.width = '100%';
        if (loadEl) loadEl.style.display = 'none';
        console.log('[ImgGen] PNG ready');
        resolve();
      };
      img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
      img.src = url;
    });
  } catch(e) {
    if (loadEl) loadEl.style.display = 'none';
    showMwImgError('⚠️ SVG生成に失敗しました: ' + e.message);
    console.log('[ImgGen] SVG error: ' + e.message);
  }
}

function _escXml(s) {
  return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}




function showMwImgError(msg) {
  document.getElementById('mwimg-loading').style.display = 'none';
  const el = document.getElementById('mwimg-error');
  el.style.display = 'block'; el.textContent = msg;
}



// ================================================================
// 楽天カード生成
// ================================================================
const RAKUTEN_AFF_ID = '51b49e8f.9e110f22.51b49e90.feb3b809';

function extractRakutenProductId(url) {
  const patterns = [
    /item\.rakuten\.co\.jp\/[^\/]+\/([^\/\?#]+)/,
    /rakuten\.co\.jp\/[^\/]+\/([^\/\?#]+)/,
    /\/([A-Za-z0-9\-_]+)\/?(?:\?|$)/
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

function genAffiliateLink(originalUrl) {
  return `https://hb.afl.rakuten.co.jp/hgc/${RAKUTEN_AFF_ID}/?pc=${encodeURIComponent(originalUrl)}&m=${encodeURIComponent(originalUrl)}`;
}

function openRakutenModal(id) {
  document.getElementById('rakuten-url-input').value = '';
  document.getElementById('rakuten-result-wrap').style.display = 'none';
  document.getElementById('rakuten-error').style.display = 'none';
  document.getElementById('rakuten-loading').style.display = 'none';
  openOverlay('modal-rakuten');
}

async function genRakutenCard() {
  const url = document.getElementById('rakuten-url-input').value.trim();
  if (!url) { toast('楽天商品URLを入力してください'); return; }
  const apiKey = localStorage.getItem('beyan_gemini_key') || '';
  if (!apiKey) { toast('Gemini APIキーを設定してください'); return; }
  const affLink = genAffiliateLink(url);
  const productId = extractRakutenProductId(url) || url;
  document.getElementById('rakuten-loading').style.display = 'block';
  document.getElementById('rakuten-result-wrap').style.display = 'none';
  document.getElementById('rakuten-error').style.display = 'none';
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: 'あなたは楽天アフィリエイトのHTMLカード生成の専門家です。URLのパス（ショップ名・商品IDなど）から商品カテゴリや内容を推測し、リアルな商品名と説明文を作成してください。架空でも実在感のある内容にしてください。HTMLのみ出力。余計な説明は不要。' }] },
        contents: [{ role: 'user', parts: [{ text: `楽天商品URL: ${url}\nショップ名: ${url.match(/item\.rakuten\.co\.jp\/([^\/]+)\//)?.[1] || '不明'}\n商品ID: ${productId}\nアフィリエイトリンク: ${affLink}\n\nこの情報から商品名と説明文を推測して、noteのHTML挿入欄に使えるアフィリエイトカードを生成してください。\n\n出力形式（HTMLのみ、\`\`\`なし）:\n<div style="border:1.5px solid #e0d0d0;border-radius:10px;padding:14px 16px;max-width:420px;font-family:sans-serif;background:#fff9f9;display:flex;flex-direction:column;gap:8px">\n  <div style="font-size:13px;color:#999">楽天市場</div>\n  <div style="font-weight:bold;font-size:15px;color:#222;line-height:1.4">[具体的な商品名（架空でもOK）]</div>\n  <div style="font-size:12px;color:#666;line-height:1.5">[商品の魅力を1〜2文で。副業ライターの記事内容に合わせて]</div>\n  <a href="${affLink}" style="display:inline-block;background:#bf0000;color:#fff;padding:9px 18px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:bold;align-self:flex-start">🛒 楽天で見る・買う</a>\n</div>` }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || 'API error');
    let html = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    html = html.replace(/```html\n?/g,'').replace(/```\n?/g,'').trim();
    document.getElementById('rakuten-loading').style.display = 'none';
    document.getElementById('rakuten-html-output').value = html;
    document.getElementById('rakuten-result-wrap').style.display = 'block';
  } catch(e) {
    document.getElementById('rakuten-loading').style.display = 'none';
    document.getElementById('rakuten-error').style.display = 'block';
    document.getElementById('rakuten-error').textContent = '⚠️ エラー: ' + e.message;
  }
}

// ================================================================
// 自己テスト
// ================================================================
async function runNabebaseTests() {
  const results = [];
  const ok = (name) => results.push({name, pass:true});
  const fail = (name, err) => results.push({name, pass:false, err});

  // 1. Gemini API疎通確認
  try {
    const apiKey = localStorage.getItem('beyan_gemini_key') || '';
    if (!apiKey) throw new Error('APIキー未設定');
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({contents:[{role:'user',parts:[{text:'テスト'}]}], generationConfig:{maxOutputTokens:10}})
    });
    if (!res.ok) { const d=await res.json(); throw new Error(d.error?.message||'HTTP '+res.status); }
    ok('Gemini API疎通確認');
  } catch(e) { fail('Gemini API疎通確認', e.message); }

  // 2. 楽天URL商品ID抽出テスト
  try {
    const testUrls = [
      ['https://item.rakuten.co.jp/book/12345678/', '12345678'],
      ['https://item.rakuten.co.jp/shop/item-code-001/', 'item-code-001'],
      ['https://item.rakuten.co.jp/abc/xyz123/', 'xyz123'],
      ['https://item.rakuten.co.jp/store/product_A/', 'product_A'],
      ['https://item.rakuten.co.jp/rakuten24/12345/', '12345'],
    ];
    let allPass = true;
    for (const [url, expected] of testUrls) {
      const got = extractRakutenProductId(url);
      if (got !== expected) { allPass = false; fail(`楽天URL抽出(${expected})`, `got:${got}`); break; }
    }
    if (allPass) ok('楽天URL商品ID抽出テスト');
  } catch(e) { fail('楽天URL商品ID抽出テスト', e.message); }

  // 3. アフィリエイトリンク生成テスト
  try {
    const link = genAffiliateLink('https://item.rakuten.co.jp/test/123/');
    if (!link.includes(RAKUTEN_AFF_ID)) throw new Error('アフィリエイトIDが含まれない');
    ok('アフィリエイトリンク生成テスト');
  } catch(e) { fail('アフィリエイトリンク生成テスト', e.message); }

  // 4. モーダル表示・非表示テスト
  try {
    const m = document.getElementById('modal-rakuten');
    if (!m) throw new Error('modal-rakuten not found');
    openOverlay('modal-rakuten');
    if (!m.classList.contains('open')) throw new Error('open failed');
    closeOverlay('modal-rakuten');
    if (m.classList.contains('open')) throw new Error('close failed');
    ok('モーダル表示・非表示テスト');
  } catch(e) { fail('モーダル表示・非表示テスト', e.message); }

  // 5. コピーボタン動作テスト
  try {
    if (!navigator.clipboard) throw new Error('clipboard API not available');
    ok('コピーボタン動作テスト');
  } catch(e) { fail('コピーボタン動作テスト', e.message); }

  // 6. noteURLテスト
  try {
    const url = 'https://note.com/beyan51612/n/new';
    if (!url.startsWith('https://note.com/beyan51612')) throw new Error('URL不正');
    ok('noteで書くURLテスト');
  } catch(e) { fail('noteで書くURLテスト', e.message); }

  // 結果出力
  let allPassed = true;
  for (const r of results) {
    if (r.pass) console.log(`✅ ${r.name}`);
    else { console.log(`❌ ${r.name}: ${r.err}`); allPassed = false; }
  }
  if (allPassed) console.log('✅ 全テスト通過');
  else console.log('⚠️ 一部テスト失敗');
}

// ================================================================
// X投稿プロンプト保管庫
// ================================================================
function getXPrompts() {
  const defaults = [
    {
      id: 1,
      title: 'オリジナル投稿生成プロンプト',
      type: 'original',
      body: `【X投稿生成依頼】

■ 素材
〇〇（ジミーが書き直した体験談テキストをここに貼る）

■ 読者像
3交代・夜勤勤務の会社員で副業を始めたばかり、または始めようとしている人。
「一生このルーティンを繰り返すのか」という焦りを持ちつつ、
「PCを開くまでのハードルがエベレスト級」な毎日を送っている。

■ 生成ルール
以下の書き出しパターンを1投稿1種類使い、5本全て異なるパターンにすること。

書き出しパターン：
 A：具体的な数字（金額・時間・件数）
 B：時間と場所の状況描写（「夜勤明けの車内で」「深夜2時の詰所で」など）
 C：身体感覚・感情の一言（「脳がバグってる」「泥のように眠る」系）
 D：逆説（「〜なのに」「〜だけど」「〜のはずが」）
 E：疑問・問いかけ（答えを言わずに終わるものも可）

感情の軸を5本で全て変えること：
 悔しさ／苦笑い／安心／驚き／疑問　のどれか1つを1本に割り当てる

締めのルール：
 ・テンプレの締め文は使わない
 ・その投稿の感情軸に自然に合う言葉で終わること
 ・断言より「余白のある着地」を意識する

■ 絶対禁止
・「でも結局〜」「〜なんだよな」「〜やつ」で締める
・「これ、〇〇」で書き出す
・🔥🪃の使用
・5本で同じ書き出しパターン・同じ感情軸・同じ文末を使い回す
・素材のテキストをそのままコピペする
・「頑張ろう」「大切です」「重要です」系の応援・説教口調

■ 制約
・140字以内
・絵文字は1〜2個・文頭のみ
・ですます調と口語を自然に混在させてよい

■ 出力形式
番号・感情軸・書き出しパターンを明記したうえで、
各投稿をコードブロックに分けて出力。
コピーボタンをつけてください。`
    },
    {
      id: 2,
      title: 'リポストコメント生成プロンプト',
      type: 'repost',
      body: `【リポストコメント生成依頼】

■ 引用する投稿
〇〇（引用したいポストのテキストをここに貼る）

■ 素材
〇〇（ジミーが書き直した体験談テキストをここに貼る）

■ 生成ルール
4本生成。それぞれ構成タイプを変えること。

構成タイプ：
 タイプ1：共感描写型
　→「夜勤明けの車内」「深夜の詰所」など状況描写で共感から入る
 タイプ2：数字反応型
　→ 具体的な数字で始めて短く結論
 タイプ3：反転気づき型
　→「〜と思ってたけど違った」「〜のはずが、そうじゃなかった」
 タイプ4：余白型
　→ 問いかけか、答えを言わずに終わる

■ 絶対禁止
・「でも結局〜」「〜なんだよな」「🔥🪃」
・「これ、〇〇」で書き出す
・4本で同じ構成タイプを使い回す
・引用元の文章を言い換えただけの内容
・応援・説教口調

■ 制約
・80字以内
・絵文字は文頭に1個だけ

■ 出力形式
番号・構成タイプを明記して、
各コメントをコードブロックに分けて出力。
コピーボタンをつけてください。`
    }
  ];
  if (!S.xpromptVault || S.xpromptVault.length === 0) {
    S.xpromptVault = defaults; save();
    return defaults;
  }
  return S.xpromptVault;
}

function _saveXPrompts(arr) {
  S.xpromptVault = arr; save();
}

function renderXPromptList() {
  const list = getXPrompts();
  const el = document.getElementById('xprompt-list');
  if (!el) return;
  const lbl = document.getElementById('xprompt-count-label');
  if (lbl) lbl.textContent = list.length + '件';
  if (list.length === 0) {
    el.innerHTML = '<div style="color:var(--text3);font-size:13px;text-align:center;padding:20px 0">プロンプトがありません</div>';
    return;
  }
  el.innerHTML = list.map(p => `
    <div class="xpv-card">
      <div class="xpv-card-title">${_escHtml(p.title)}</div>
      <div class="xpv-card-preview">${_escHtml(p.body)}</div>
      <div class="xpv-actions">
        <button class="xpv-btn accent" onclick="copyXPrompt(${p.id})">📋 コピー</button>
        <button class="xpv-btn" onclick="openEditXPrompt(${p.id})">✏️ 編集</button>
        <button class="xpv-btn" onclick="deleteXPrompt(${p.id})" style="color:var(--red)">🗑 削除</button>
      </div>
    </div>
  `).join('');
}

function copyXPrompt(id) {
  const p = getXPrompts().find(x => x.id === id);
  if (!p) return;
  navigator.clipboard.writeText(p.body).then(() => toast('コピーしました'));
}

function openEditXPrompt(id) {
  const p = id ? getXPrompts().find(x => x.id === id) : null;
  document.getElementById('xpv-modal-title').textContent = p ? 'プロンプトを編集' : 'プロンプトを追加';
  document.getElementById('xpv-edit-id').value = id || '';
  document.getElementById('xpv-edit-title').value = p ? p.title : '';
  document.getElementById('xpv-edit-body').value = p ? p.body : '';
  openOverlay('modal-xprompt-edit');
}

function saveXPromptEdit() {
  const id = document.getElementById('xpv-edit-id').value;
  const title = document.getElementById('xpv-edit-title').value.trim();
  const body = document.getElementById('xpv-edit-body').value.trim();
  if (!title || !body) { toast('タイトルと本文を入力してください'); return; }
  const list = getXPrompts();
  if (id) {
    const idx = list.findIndex(x => x.id === Number(id));
    if (idx >= 0) { list[idx].title = title; list[idx].body = body; }
  } else {
    list.push({ id: Date.now(), title, type: 'custom', body });
  }
  _saveXPrompts(list);
  closeOverlay('modal-xprompt-edit');
  renderXPromptList();
  toast('保存しました');
}

function deleteXPrompt(id) {
  if (!confirm('このプロンプトを削除しますか？')) return;
  _saveXPrompts(getXPrompts().filter(x => x.id !== id));
  renderXPromptList();
  toast('削除しました');
}

// ================================================================
// プロンプト見直し履歴 (beyan_promptReviews)
// ================================================================
function getPromptReviews() {
  try { return S.promptReviews || []; } catch { return []; }
}
function _savePromptReviews(list) {
  S.promptReviews = list; save();
}
let _prEditId = null;
function openPromptReviewModal(id) {
  _prEditId = id || null;
  const isEdit = !!id;
  document.getElementById('pr-modal-title').textContent = isEdit ? '見直し記録を編集' : '見直し記録を追加';
  document.getElementById('pr-edit-id').value = id || '';
  if (isEdit) {
    const item = getPromptReviews().find(x => x.id === id);
    if (!item) return;
    document.getElementById('pr-date').value        = item.実施日 || '';
    document.getElementById('pr-viewpoint').value   = item.使った見直し視点 || '';
    document.getElementById('pr-problem').value     = item.発見した問題 || '';
    document.getElementById('pr-fix').value         = item.修正箇所 || '';
    document.getElementById('pr-schema-ver').value  = item.スキーマバージョン || 'V6';
  } else {
    document.getElementById('pr-date').value        = new Date().toISOString().slice(0,10);
    document.getElementById('pr-viewpoint').value   = '';
    document.getElementById('pr-problem').value     = '';
    document.getElementById('pr-fix').value         = '';
    document.getElementById('pr-schema-ver').value  = 'V6';
  }
  openOverlay('modal-promptreview');
}
function savePromptReview() {
  const date      = document.getElementById('pr-date').value.trim();
  const viewpoint = document.getElementById('pr-viewpoint').value.trim();
  const problem   = document.getElementById('pr-problem').value.trim();
  const fix       = document.getElementById('pr-fix').value.trim();
  const ver       = document.getElementById('pr-schema-ver').value.trim();
  if (!date || !viewpoint || !problem || !fix || !ver) { toast('全フィールドを入力してください'); return; }
  const list = getPromptReviews();
  const editId = document.getElementById('pr-edit-id').value;
  if (editId) {
    const idx = list.findIndex(x => x.id === editId);
    if (idx >= 0) list[idx] = { ...list[idx], 実施日:date, 使った見直し視点:viewpoint, 発見した問題:problem, 修正箇所:fix, スキーマバージョン:ver };
  } else {
    list.unshift({ id: String(Date.now()), 実施日:date, 使った見直し視点:viewpoint, 発見した問題:problem, 修正箇所:fix, スキーマバージョン:ver });
  }
  _savePromptReviews(list);
  closeOverlay('modal-promptreview');
  renderPromptReviews();
  toast('保存しました');
}
function deletePromptReview(id) {
  if (!confirm('この記録を削除しますか？')) return;
  _savePromptReviews(getPromptReviews().filter(x => x.id !== id));
  renderPromptReviews();
  toast('削除しました');
}
function renderPromptReviews() {
  const list = getPromptReviews().slice().sort((a,b) => (b.実施日||'').localeCompare(a.実施日||''));
  const el   = document.getElementById('promptreviews-list');
  const lbl  = document.getElementById('promptreviews-count-label');
  if (lbl) lbl.textContent = list.length + '件';
  if (!el) return;
  if (!list.length) { el.innerHTML = '<div style="text-align:center;color:var(--text3);font-size:13px;padding:16px">記録がありません</div>'; return; }
  el.innerHTML = list.map(r => `
    <div style="background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:12px 14px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:6px">
        <div>
          <span style="font-size:11px;color:var(--text3)">${r.実施日||''}</span>
          <span style="margin-left:8px;font-size:11px;background:var(--bg5);color:var(--text2);padding:1px 7px;border-radius:8px">${r.スキーマバージョン||''}</span>
        </div>
        <div style="display:flex;gap:4px;flex-shrink:0">
          <button onclick="openPromptReviewModal('${r.id}')" style="font-size:11px;padding:3px 9px;border-radius:6px;border:1px solid var(--border2);background:var(--bg2);color:var(--text2);cursor:pointer;font-family:inherit">編集</button>
          <button onclick="deletePromptReview('${r.id}')" style="font-size:11px;padding:3px 9px;border-radius:6px;border:1px solid var(--border2);background:var(--bg2);color:var(--orange);cursor:pointer;font-family:inherit">削除</button>
        </div>
      </div>
      <div style="font-size:13px;font-weight:700;color:var(--accent);margin-bottom:4px">${_escHtml(r.使った見直し視点||'')}</div>
      <div style="font-size:12px;color:var(--text2);line-height:1.6"><b style="color:var(--text3)">発見:</b> ${_escHtml(r.発見した問題||'')}</div>
      <div style="font-size:12px;color:var(--text2);line-height:1.6"><b style="color:var(--text3)">修正:</b> ${_escHtml(r.修正箇所||'')}</div>
    </div>`).join('');
}

// ================================================================
// 失敗パターン (beyan_failurePatterns)
// ================================================================
function getFailurePatterns() {
  try { return S.failurePatterns || []; } catch { return []; }
}
function _saveFailurePatterns(list) {
  S.failurePatterns = list; save();
}
let _fpFilter = 'active'; // 'active' = 棚卸し済みを除く, 'all' = 全件
function setFpFilter(val) {
  _fpFilter = val;
  document.getElementById('fp-filter-active')?.classList.toggle('active', val === 'active');
  document.getElementById('fp-filter-all')?.classList.toggle('active', val === 'all');
  renderFailurePatterns();
}
function openFailurePatternModal(id) {
  document.getElementById('fp-modal-title').textContent = id ? '失敗パターンを編集' : '失敗パターンを追加';
  document.getElementById('fp-edit-id').value = id || '';
  if (id) {
    const item = getFailurePatterns().find(x => x.id === id);
    if (!item) return;
    document.getElementById('fp-title').value      = item.タイトル || '';
    document.getElementById('fp-detail').value     = item.内容 || '';
    document.getElementById('fp-prevention').value = item.再発防止策 || '';
    document.getElementById('fp-date').value       = item.発生日 || '';
  } else {
    ['fp-title','fp-detail','fp-prevention','fp-date'].forEach(i => { document.getElementById(i).value = ''; });
    document.getElementById('fp-date').value = new Date().toISOString().slice(0,10);
  }
  openOverlay('modal-failurepattern');
}
function saveFailurePattern() {
  const title      = document.getElementById('fp-title').value.trim();
  const detail     = document.getElementById('fp-detail').value.trim();
  const prevention = document.getElementById('fp-prevention').value.trim();
  const date       = document.getElementById('fp-date').value.trim();
  if (!title || !detail || !prevention) { toast('タイトル・内容・再発防止策は必須です'); return; }
  const list  = getFailurePatterns();
  const editId = document.getElementById('fp-edit-id').value;
  if (editId) {
    const idx = list.findIndex(x => x.id === editId);
    if (idx >= 0) list[idx] = { ...list[idx], タイトル:title, 内容:detail, 再発防止策:prevention, 発生日:date };
  } else {
    list.unshift({ id: String(Date.now()), タイトル:title, 内容:detail, 再発防止策:prevention, 発生日:date, 棚卸し済み:false });
  }
  _saveFailurePatterns(list);
  closeOverlay('modal-failurepattern');
  renderFailurePatterns();
  toast('保存しました');
}
function toggleFpInventory(id) {
  const list = getFailurePatterns();
  const idx  = list.findIndex(x => x.id === id);
  if (idx < 0) return;
  list[idx].棚卸し済み = !(list[idx].棚卸し済み ?? false);
  _saveFailurePatterns(list);
  renderFailurePatterns();
}
function deleteFailurePattern(id) {
  if (!confirm('この失敗パターンを削除しますか？')) return;
  _saveFailurePatterns(getFailurePatterns().filter(x => x.id !== id));
  renderFailurePatterns();
  toast('削除しました');
}
function renderFailurePatterns() {
  let list = getFailurePatterns().map(x => ({ 棚卸し済み: x.棚卸し済み ?? false, ...x }));
  if (_fpFilter === 'active') list = list.filter(x => !x.棚卸し済み);
  const el  = document.getElementById('failurepatterns-list');
  const lbl = document.getElementById('failurepatterns-count-label');
  const all = getFailurePatterns().length;
  if (lbl) lbl.textContent = all + '件';
  if (!el) return;
  if (!list.length) { el.innerHTML = '<div style="text-align:center;color:var(--text3);font-size:13px;padding:16px">' + (_fpFilter==='active'?'棚卸し済みを除くと0件です':'記録がありません') + '</div>'; return; }
  el.innerHTML = list.map(r => `
    <div style="background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:12px 14px;${r.棚卸し済み?'opacity:.55':''}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:6px">
        <div style="font-size:13px;font-weight:700;color:var(--text);flex:1">${_escHtml(r.タイトル||'')}</div>
        <div style="display:flex;gap:4px;flex-shrink:0">
          <button onclick="toggleFpInventory('${r.id}')" title="${r.棚卸し済み?'棚卸し済みを解除':'棚卸し済みにする'}" style="font-size:11px;padding:3px 9px;border-radius:6px;border:1px solid var(--border2);background:${r.棚卸し済み?'rgba(74,136,56,.2)':'var(--bg2)'};color:${r.棚卸し済み?'var(--green)':'var(--text2)'};cursor:pointer;font-family:inherit">${r.棚卸し済み?'✅ 棚卸済':'棚卸し'}</button>
          <button onclick="openFailurePatternModal('${r.id}')" style="font-size:11px;padding:3px 9px;border-radius:6px;border:1px solid var(--border2);background:var(--bg2);color:var(--text2);cursor:pointer;font-family:inherit">編集</button>
          <button onclick="deleteFailurePattern('${r.id}')" style="font-size:11px;padding:3px 9px;border-radius:6px;border:1px solid var(--border2);background:var(--bg2);color:var(--orange);cursor:pointer;font-family:inherit">削除</button>
        </div>
      </div>
      <div style="font-size:12px;color:var(--text2);line-height:1.6;margin-bottom:4px">${_escHtml(r.内容||'')}</div>
      <div style="font-size:11px;color:var(--green);line-height:1.5">🛡 ${_escHtml(r.再発防止策||'')}</div>
      ${r.発生日?`<div style="font-size:10px;color:var(--text3);margin-top:4px">${r.発生日}</div>`:''}
    </div>`).join('');
}

// ================================================================
// X投稿 データ操作

function getNewXPosts()  { return S.xPostsNew || []; }
function setNewXPosts(a) { S.xPostsNew = a; save(); }
function getXDrafts()    { return S.xDraftPosts || []; }
function setXDrafts(a)   { S.xDraftPosts = a; save(); }
function getXPromptText(){ return S.xPromptCustom || DEFAULT_X_PROMPT; }

function getPublishedArticles() {
  const list = S.publishedArticles || [];
  return list.map(a => {
    const rec = { humanTechUsed: [], ...a };
    rec.headlineKeywords = Object.assign({ catch: '', main: '', sub: '' }, a.headlineKeywords || {});
    return rec;
  });
}
function setPublishedArticles(a) { S.publishedArticles = a; save(); }
function getPublishedPosts()     { return S.publishedPosts || []; }
function setPublishedPosts(a)    { S.publishedPosts = a; save(); }

function _initPublishedCollections() {
  if (!S.publishedArticles || S.publishedArticles.length === 0) {
    setPublishedArticles([
      {"publishedTitle":"AIで副業が加速するどころか案件を断った。3交代勤務者が知るべきAI活用の現実","titleKeywords":["AI","副業","3交代勤務","案件","AI活用"],"expansionAxis":"落とし穴","emotionAxis":"焦り","thinkingPattern":"落とし穴型","readerPerspective":"始めた直後","coreLearning":"AIを使えば副業が加速すると思っていたが、現実は逆だったという気づき","publishedAt":"2025-04-08"},
      {"publishedTitle":"夜勤明けに気づいた。副業が続く人は完璧を目指していなかった","titleKeywords":["夜勤明け","副業","完璧主義","継続"],"expansionAxis":"再定義","emotionAxis":"安堵","thinkingPattern":"再定義型","readerPerspective":"続かなくなった時","coreLearning":"副業を続けられる人は完璧を目指さない、という逆説的な気づき","publishedAt":"2025-04-08"},
      {"publishedTitle":"副業スクール50万払って1円も稼げなかった話と3つの教訓","titleKeywords":["副業スクール","失敗","お金","教訓"],"expansionAxis":"原因追及","emotionAxis":"悔しさ","thinkingPattern":"落とし穴型","readerPerspective":"始める前","coreLearning":"高額スクールに投資しても稼げない構造的な理由と、そこから得た教訓","publishedAt":"2025-04-08"},
      {"publishedTitle":"連続不採用でも諦めなかった私が、提案失敗から学んだ『次への一歩』","titleKeywords":["不採用","提案","失敗","継続"],"expansionAxis":"タイムライン","emotionAxis":"悔しさ","thinkingPattern":"タイムライン型","readerPerspective":"途中で諦めた人の目線","coreLearning":"不採用が続いても諦めなかった理由と、失敗から学んだ具体的な次の動き","publishedAt":"2025-04-05"},
      {"publishedTitle":"やめたら続いた。3交代勤務×副業、引き算の法則","titleKeywords":["3交代勤務","副業","継続","引き算","やめる"],"expansionAxis":"再定義","emotionAxis":"安堵","thinkingPattern":"再定義型","readerPerspective":"続かなくなった時","coreLearning":"足し算ではなく引き算することで副業が続くようになった法則","publishedAt":"2025-04-02"},
      {"publishedTitle":"夜勤明け3時間睡眠が6時間になった。私がやめた3つの習慣","titleKeywords":["夜勤明け","睡眠","習慣","やめる"],"expansionAxis":"手順","emotionAxis":"安堵","thinkingPattern":"手順型","readerPerspective":"続けられている人の目線","coreLearning":"夜勤明けの睡眠改善のためにやめた具体的な3つの習慣","publishedAt":"2025-04-01"},
      {"publishedTitle":"夜勤明け3年の不眠が消えた、やめた4つの習慣","titleKeywords":["夜勤明け","不眠","睡眠","習慣","やめる"],"expansionAxis":"手順","emotionAxis":"安堵","thinkingPattern":"手順型","readerPerspective":"続けられている人の目線","coreLearning":"3年続いた不眠が改善した、やめた4つの習慣","publishedAt":"2025-03-30"},
      {"publishedTitle":"夜勤明けに副業した話。正直しんどかった","titleKeywords":["夜勤明け","副業","しんどい","体験談"],"expansionAxis":"原因追及","emotionAxis":"焦り","thinkingPattern":"原因追及型","readerPerspective":"始めた直後","coreLearning":"夜勤明けに副業することのリアルなしんどさと、それでも続けた理由","publishedAt":"2025-03-30"},
      {"publishedTitle":"副業1年目で体調を崩した私が「辞めない」を選んだ、たった一つの考え方","titleKeywords":["副業","体調","継続","1年目"],"expansionAxis":"再定義","emotionAxis":"諦め","thinkingPattern":"再定義型","readerPerspective":"途中で諦めた人の目線","coreLearning":"体調を崩しても副業を辞めなかった理由となった、たった一つの考え方","publishedAt":"2025-03-30"},
      {"publishedTitle":"実績ゼロでも案件が取れた。クライアントが本当に求めていた「たった一つのこと」","titleKeywords":["実績ゼロ","案件","クライアント","提案"],"expansionAxis":"再定義","emotionAxis":"焦り","thinkingPattern":"再定義型","readerPerspective":"始める前","coreLearning":"実績なしでも案件が取れた理由、クライアントが本当に求めていたもの","publishedAt":"2025-03-27"},
      {"publishedTitle":"「3ヶ月で挫折」はもう嫌だ。3交代勤務ライターが教えるCW・ランサーズ攻略法","titleKeywords":["3交代勤務","挫折","クラウドワークス","ランサーズ","攻略"],"expansionAxis":"手順","emotionAxis":"悔しさ","thinkingPattern":"手順型","readerPerspective":"途中で諦めた人の目線","coreLearning":"3交代勤務のライターが挫折を乗り越えるためのCW・ランサーズ攻略の具体策","publishedAt":"2025-03-27"},
      {"publishedTitle":"note記事、公開1週間の数字を公開！予想外の3つの発見から見えた「伸びる記事」","titleKeywords":["note","数字","PV","伸びる記事","分析"],"expansionAxis":"比較","emotionAxis":"焦り","thinkingPattern":"比較型","readerPerspective":"始めた直後","coreLearning":"note公開1週間の数字から見えた、伸びる記事の条件","publishedAt":"2025-03-26"},
      {"publishedTitle":"note記事、公開1週間の数字を公開！予想外の3つの発見から見えた「伸びる記事」の秘密","titleKeywords":["note","数字","PV","伸びる記事","秘密"],"expansionAxis":"原因追及","emotionAxis":"焦り","thinkingPattern":"原因追及型","readerPerspective":"始めた直後","coreLearning":"伸びる記事の裏側にある構造的な秘密","publishedAt":"2025-03-26"},
      {"publishedTitle":"期待500PVが80だった。1週間で学んだ、数字の正しい読み方","titleKeywords":["PV","数字","note","分析","現実"],"expansionAxis":"再定義","emotionAxis":"悔しさ","thinkingPattern":"再定義型","readerPerspective":"始めた直後","coreLearning":"期待を大きく下回る数字に直面して学んだ、数字の正しい読み方と向き合い方","publishedAt":"2025-03-26"},
      {"publishedTitle":"AIに投げて失敗した記事、5本振り返ってみる","titleKeywords":["AI","失敗","記事","振り返り"],"expansionAxis":"落とし穴","emotionAxis":"悔しさ","thinkingPattern":"落とし穴型","readerPerspective":"途中で諦めた人の目線","coreLearning":"AIに任せすぎて失敗した記事5本の共通点と反省","publishedAt":"2025-03-26"},
      {"publishedTitle":"AIっぽさを卒業したい。ChatGPTとClaudeを1週間使い分けて気づいた3つの違い","titleKeywords":["AI","ChatGPT","Claude","使い分け","AIっぽさ"],"expansionAxis":"比較","emotionAxis":"焦り","thinkingPattern":"比較型","readerPerspective":"始めた直後","coreLearning":"ChatGPTとClaudeを使い分けることでAIっぽさから抜け出せる3つの理由","publishedAt":"2025-03-12"},
      {"publishedTitle":"完璧じゃなくていい。週10時間しか確保できない私の泥臭い副業スケジュール","titleKeywords":["完璧主義","副業","時間","スケジュール","3交代勤務"],"expansionAxis":"手順","emotionAxis":"焦り","thinkingPattern":"手順型","readerPerspective":"始める前","coreLearning":"週10時間という限られた時間で副業を動かすための泥臭いスケジュール設計","publishedAt":"2025-03-12"},
      {"publishedTitle":"完璧主義を捨てたら少しだけ進めた。1週間の泥臭い振り返り","titleKeywords":["完璧主義","副業","継続","振り返り"],"expansionAxis":"タイムライン","emotionAxis":"安堵","thinkingPattern":"タイムライン型","readerPerspective":"続かなくなった時","coreLearning":"完璧主義を手放したことで少しだけ前進できた1週間のリアルな記録","publishedAt":"2025-03-12"},
      {"publishedTitle":"「正解」を書くのをやめたら、少し楽になった話","titleKeywords":["正解","ライティング","完璧主義","楽になる"],"expansionAxis":"再定義","emotionAxis":"安堵","thinkingPattern":"再定義型","readerPerspective":"途中で諦めた人の目線","coreLearning":"正解を書こうとするプレッシャーをやめたことで楽になった体験","publishedAt":"2025-03-05"},
      {"publishedTitle":"文字単価に悩むより、楽天経済圏を整えた方が早かった話","titleKeywords":["文字単価","楽天経済圏","収入","副業戦略"],"expansionAxis":"比較","emotionAxis":"焦り","thinkingPattern":"比較型","readerPerspective":"始める前","coreLearning":"文字単価の交渉より生活コストを下げる方が手取りを増やす近道だという気づき","publishedAt":"2025-03-05"},
      {"publishedTitle":"提案文60件送って分かった、時給を上げる唯一の方法","titleKeywords":["提案文","時給","クラウドワークス","営業"],"expansionAxis":"原因追及","emotionAxis":"悔しさ","thinkingPattern":"原因追及型","readerPerspective":"続けられている人の目線","coreLearning":"60件の提案から見えた、時給を上げるための唯一の正解","publishedAt":"2025-03-05"},
      {"publishedTitle":"2件目の案件で見えた、1件目との決定的な違い","titleKeywords":["案件","成長","ライター","気づき"],"expansionAxis":"比較","emotionAxis":"安堵","thinkingPattern":"比較型","readerPerspective":"続けられている人の目線","coreLearning":"2件目の案件をこなして初めて見えた、1件目との決定的な違いと成長の正体","publishedAt":"2025-03-05"},
      {"publishedTitle":"2件目でやっと気づいた、副業ライターの「成長の正体」","titleKeywords":["副業ライター","成長","案件","気づき"],"expansionAxis":"原因追及","emotionAxis":"安堵","thinkingPattern":"原因追及型","readerPerspective":"続けられている人の目線","coreLearning":"2件目の案件で気づいた、副業ライターとして成長するとはどういうことか","publishedAt":"2025-03-05"},
      {"publishedTitle":"提案文47件送って学んだこと　返信率4%から見えた「通る提案」の本質","titleKeywords":["提案文","返信率","採用","営業"],"expansionAxis":"原因追及","emotionAxis":"悔しさ","thinkingPattern":"原因追及型","readerPerspective":"途中で諦めた人の目線","coreLearning":"47件送って返信率4%という現実から見えた、通る提案の本質的な条件","publishedAt":"2025-03-05"},
      {"publishedTitle":"0部記事を5部に変えた改善全記録｜失敗10本の修正ログ","titleKeywords":["有料note","改善","失敗","修正","売れない"],"expansionAxis":"手順","emotionAxis":"悔しさ","thinkingPattern":"手順型","readerPerspective":"途中で諦めた人の目線","coreLearning":"売れなかった有料記事を改善して売れるようにした、失敗10本の修正記録","publishedAt":"2025-03-05"},
      {"publishedTitle":"note有料記事、最初の10本は全部失敗した｜0部記録と改善ログ","titleKeywords":["有料note","失敗","0部","改善"],"expansionAxis":"タイムライン","emotionAxis":"悔しさ","thinkingPattern":"タイムライン型","readerPerspective":"始めた直後","coreLearning":"有料記事最初の10本が全て売れなかったリアルな記録と、そこからの改善","publishedAt":"2025-03-05"},
      {"publishedTitle":"副業ライター、noteとクラウドワークス、どっちで稼ぐべきか｜3ヶ月検証","titleKeywords":["note","クラウドワークス","副業ライター","比較","稼ぐ"],"expansionAxis":"比較","emotionAxis":"焦り","thinkingPattern":"比較型","readerPerspective":"始める前","coreLearning":"3ヶ月間の実体験からnoteとクラウドワークスどちらで稼ぐべきかの結論","publishedAt":"2025-03-05"},
      {"publishedTitle":"noteで有料記事が売れた後、何をすべきか｜初動5部からの戦略設計","titleKeywords":["有料note","戦略","売れた後","次の一手"],"expansionAxis":"手順","emotionAxis":"安堵","thinkingPattern":"手順型","readerPerspective":"続けられている人の目線","coreLearning":"有料記事が売れ始めた後にやるべき戦略的な次の動き","publishedAt":"2025-03-05"},
      {"publishedTitle":"なぜ私は\"売れた話\"より\"売れなかった話\"を書くのか","titleKeywords":["売れなかった話","失敗談","発信戦略","note"],"expansionAxis":"再定義","emotionAxis":"悔しさ","thinkingPattern":"再定義型","readerPerspective":"始める前","coreLearning":"成功談より失敗談を書く理由と、その戦略的な意図","publishedAt":"2025-03-05"},
      {"publishedTitle":"売れなかった理由はプロンプトだった0部→5部に変えた設計全公開","titleKeywords":["有料note","プロンプト","AI","改善","売れない"],"expansionAxis":"原因追及","emotionAxis":"悔しさ","thinkingPattern":"原因追及型","readerPerspective":"途中で諦めた人の目線","coreLearning":"売れなかった原因がプロンプトにあったという発見と、改善した設計の全公開","publishedAt":"2025-03-05"},
      {"publishedTitle":"AIで有料note、300円で売れた。でも「丸投げ」では失敗した話","titleKeywords":["AI","有料note","失敗","丸投げ"],"expansionAxis":"落とし穴","emotionAxis":"焦り","thinkingPattern":"落とし穴型","readerPerspective":"始めた直後","coreLearning":"AIに丸投げした有料noteが売れない理由と、正しいAIの使い方","publishedAt":"2025-03-05"},
      {"publishedTitle":"副業ライターは\"発信\"をやるべきか問題に、私なりの結論を出す","titleKeywords":["副業ライター","発信","X","note","戦略"],"expansionAxis":"再定義","emotionAxis":"焦り","thinkingPattern":"再定義型","readerPerspective":"始める前","coreLearning":"副業ライターが発信をすべきかどうかについての実体験からの結論","publishedAt":"2025-03-05"},
      {"publishedTitle":"noteとクラウドワークス、どっちに時間を使うべきか本気で検証してみた","titleKeywords":["note","クラウドワークス","時間","比較","検証"],"expansionAxis":"比較","emotionAxis":"焦り","thinkingPattern":"比較型","readerPerspective":"始める前","coreLearning":"noteとクラウドワークスへの時間配分について本気で検証した結果","publishedAt":"2025-03-05"},
      {"publishedTitle":"副業ライターが月3万円から伸び悩んだ時期にやった3つのこと","titleKeywords":["副業ライター","月3万円","伸び悩み","壁"],"expansionAxis":"手順","emotionAxis":"焦り","thinkingPattern":"手順型","readerPerspective":"続かなくなった時","coreLearning":"月3万円の壁で伸び悩んだ時期にやった3つの具体的な打ち手","publishedAt":"2025-03-05"},
      {"publishedTitle":"副業ライターが単価2円に到達するまでに「やめた」こと","titleKeywords":["副業ライター","文字単価","2円","やめる"],"expansionAxis":"落とし穴","emotionAxis":"安堵","thinkingPattern":"落とし穴型","readerPerspective":"続けられている人の目線","coreLearning":"単価2円到達のために手放したこと、やめたことの記録","publishedAt":"2025-03-05"},
      {"publishedTitle":"副業ライターがAIに依存しすぎると、じわじわ実力が落ちていく","titleKeywords":["副業ライター","AI依存","実力","落とし穴"],"expansionAxis":"タイムライン","emotionAxis":"焦り","thinkingPattern":"タイムライン型","readerPerspective":"続けられている人の目線","coreLearning":"AIへの依存が時間をかけてライターとしての実力をじわじわ削っていくメカニズム","publishedAt":"2025-03-05"},
      {"publishedTitle":"副業ライターが最初の1万円を稼ぐまでにやったこと。才能は関係なかった。","titleKeywords":["副業ライター","1万円","才能","始め方"],"expansionAxis":"手順","emotionAxis":"焦り","thinkingPattern":"手順型","readerPerspective":"始める前","coreLearning":"才能に関係なく最初の1万円を稼ぐためにやった具体的な行動","publishedAt":"2025-03-05"},
      {"publishedTitle":"ChatGPTとClaudeを使い分けて記事を書いてみたら、思っていた結果と全然違った","titleKeywords":["ChatGPT","Claude","AI","使い分け","ライティング"],"expansionAxis":"比較","emotionAxis":"焦り","thinkingPattern":"比較型","readerPerspective":"始めた直後","coreLearning":"ChatGPTとClaudeを使い分けて記事を書いた結果、予想と全然違った現実","publishedAt":"2025-03-05"}
    ]);
  }
  if (!S.publishedPosts) {
    setPublishedPosts([]);
  }
}

// ================================================================
// X作成フロー
// ================================================================
let _xgenType    = 'A';
let _xgenResults = [];
let _xgenEmotionTag  = {};
let _xgenExpansionTag = {};

function selectXGenType(type) {
  _xgenType = type;
  ['A','B','both'].forEach(t => {
    const b = document.getElementById('xgen-btn-'+t);
    if (b) b.classList.toggle('active', t === type);
  });
}

async function generateXPosts() {
  const material = (document.getElementById('xgen-material')?.value || '').trim();
  if (!material) { toast('素材を貼り付けてください'); return; }
  const apiKey = localStorage.getItem(GEMINI_KEY_STORAGE) || '';
  const errEl  = document.getElementById('xgen-error');
  const btn    = document.getElementById('xgen-gen-btn');
  if (!apiKey) { errEl.textContent = 'APIキーを確認してください'; errEl.style.display = 'block'; return; }

  btn.textContent = '✨ ジミーが考えています...';
  btn.disabled = true;
  errEl.style.display = 'none';

  const typeLabel = _xgenType === 'A'
    ? 'タイプA（朝7時・拡散）のみ'
    : _xgenType === 'B'
      ? 'タイプB（夜21時・note誘導）のみ'
      : 'タイプA（朝7時・拡散）とタイプB（夜21時・note誘導）の両方';

  const promptTemplate = getXPromptText();
  const prompt = promptTemplate
    .replace('${materialText}', material)
    .replace('${type}', typeLabel);

  console.log('[xPrompt] templateに${materialText}が含まれるか:', promptTemplate.includes('${materialText}'));
  console.log('[xPrompt] templateに${type}が含まれるか:', promptTemplate.includes('${type}'));
  console.log('[xPrompt] 置換後のprompt（先頭500文字）:', prompt.substring(0, 500));

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 4096, temperature: 0.9 }
        })
      }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || res.status);
    const parts = data.candidates?.[0]?.content?.parts || [];
    const rawText = parts.filter(p => !p.thought).map(p => p.text || '').join('');

    // 【タイプA】【タイプB】で分割
    const matches = [...rawText.matchAll(/【(タイプ[AB])】\s*([\s\S]*?)(?=【タイプ[AB]】|$)/g)];
    _xgenResults = matches
      .map(m => ({ type: m[1].includes('A') ? 'A' : 'B', content: m[2].trim() }))
      .filter(r => r.content.length > 0);

    if (_xgenResults.length === 0) {
      // フォールバック：マーカーがない場合は全文を1件として扱う
      const fallback = rawText.trim();
      if (fallback) _xgenResults = [{ type: _xgenType === 'B' ? 'B' : 'A', content: fallback }];
    }

    _xgenEmotionTag = {}; _xgenExpansionTag = {};
    _renderXGenCards();
    document.getElementById('xgen-results-wrap').style.display = 'block';
  } catch(e) {
    errEl.textContent = 'APIキーを確認してください';
    errEl.style.display = 'block';
  } finally {
    btn.textContent = '✨ 投稿文を生成する';
    btn.disabled = false;
  }
}

function _renderXGenCards() {
  const container = document.getElementById('xgen-cards');
  if (!container) return;
  if (_xgenResults.length === 0) {
    container.innerHTML = '<div style="color:var(--text3);font-size:13px;padding:12px 0;">生成結果がありませんでした</div>';
    return;
  }
  container.innerHTML = _xgenResults.map((r, idx) => {
    const cc = r.content.replace(/\n/g,'').length;
    const ccCls = cc > 140 ? 'char-over' : cc > 120 ? 'char-warn' : 'char-ok';
    const tagSection = `
      <div id="xgen-tag-${idx}" style="display:none;margin-top:10px;padding:10px;background:var(--bg3);border-radius:8px;">
        <div style="font-size:.72rem;color:var(--text3);font-weight:700;margin-bottom:6px;">感情軸</div>
        <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:8px;">
          ${['不公平感','安心感','自己否定','焦燥感','時間ロス'].map(v =>
            `<button class="xwrite-tag-btn" onclick="xgenSelectTag(${idx},'emotion','${v}',this)">${v}</button>`
          ).join('')}
        </div>
        <div style="font-size:.72rem;color:var(--text3);font-weight:700;margin-bottom:6px;">展開軸</div>
        <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px;">
          ${['落とし穴','原因追及','比較','再定義','タイムライン'].map(v =>
            `<button class="xwrite-tag-btn" onclick="xgenSelectTag(${idx},'expansion','${v}',this)">${v}</button>`
          ).join('')}
        </div>
        <button onclick="xgenSave(${idx})" style="width:100%;min-height:40px;background:linear-gradient(135deg,#3a6650,#e8732a);border:none;border-radius:8px;color:#fff;font-weight:700;font-size:.88rem;cursor:pointer;font-family:inherit;">💾 ストックに保存</button>
      </div>`;
    return `
      <div id="xgen-card-${idx}" style="background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:12px;margin-bottom:10px;">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
          <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;${r.type==='A'?'background:rgba(59,130,246,.2);color:#60a5fa':'background:rgba(167,139,250,.2);color:#a78bfa'}">タイプ${r.type}</span>
          <span class="${ccCls}" style="font-size:11px;margin-left:auto;">${cc} / 140字</span>
        </div>
        <div style="font-size:13px;color:var(--text);white-space:pre-wrap;line-height:1.7;margin-bottom:10px;">${_escHtml(r.content)}</div>
        <div style="display:flex;gap:6px;">
          <button onclick="xgenChoose(${idx})" style="flex:1;min-height:36px;background:var(--accent);border:none;border-radius:8px;color:#fff;font-weight:700;font-size:.82rem;cursor:pointer;font-family:inherit;">✅ 選ぶ</button>
          <button onclick="xgenDiscard(${idx})" style="flex:1;min-height:36px;background:var(--bg4);border:1px solid var(--bg5);border-radius:8px;color:var(--text2);font-size:.82rem;cursor:pointer;font-family:inherit;">🗑️ 見送る</button>
        </div>
        ${tagSection}
      </div>`;
  }).join('');
}

function xgenChoose(idx) {
  const tagEl = document.getElementById('xgen-tag-'+idx);
  if (!tagEl) return;
  tagEl.style.display = tagEl.style.display === 'none' ? 'block' : 'none';
}

function xgenDiscard(idx) {
  const r = _xgenResults[idx];
  if (!r) return;
  const drafts = getXDrafts();
  drafts.unshift({
    id: Date.now().toString(),
    type: r.type,
    content: r.content,
    status: 'draft',
    createdAt: new Date().toISOString(),
    brushUpCount: 0,
    lastBrushUpAt: null
  });
  setXDrafts(drafts);
  const card = document.getElementById('xgen-card-'+idx);
  if (card) { card.style.opacity = '.4'; card.style.pointerEvents = 'none'; }
  toast('見送りに保存しました');
  renderXManage();
}

function xgenSelectTag(idx, kind, value, btn) {
  const groupId = kind === 'emotion'
    ? `#xgen-tag-${idx} .xwrite-tag-btn:nth-child(-n+5)`
    : null;
  const tagEl = document.getElementById('xgen-tag-'+idx);
  if (!tagEl) return;
  const btns = tagEl.querySelectorAll(kind === 'emotion'
    ? 'div:nth-child(2) .xwrite-tag-btn'
    : 'div:nth-child(4) .xwrite-tag-btn');
  btns.forEach(b => b.classList.remove('active'));
  if (kind === 'emotion') {
    _xgenEmotionTag[idx] = _xgenEmotionTag[idx] === value ? '' : value;
    if (_xgenEmotionTag[idx]) btn.classList.add('active');
  } else {
    _xgenExpansionTag[idx] = _xgenExpansionTag[idx] === value ? '' : value;
    if (_xgenExpansionTag[idx]) btn.classList.add('active');
  }
}

function xgenSave(idx) {
  const r = _xgenResults[idx];
  if (!r) return;
  const posts = getNewXPosts();
  posts.unshift({
    id: Date.now().toString(),
    type: r.type,
    content: r.content,
    emotionAxis: _xgenEmotionTag[idx] || '',
    expansionAxis: _xgenExpansionTag[idx] || '',
    status: 'ストック',
    createdAt: new Date().toISOString(),
    postedAt: null,
    usedCount: 0
  });
  setNewXPosts(posts);
  const card = document.getElementById('xgen-card-'+idx);
  if (card) { card.style.opacity = '.4'; card.style.pointerEvents = 'none'; }
  toast('ストックに保存しました ✓');
  renderXManage();
}

// ================================================================
// X管理
// ================================================================
function setXManageTab(tab) {
  _xManageTab = tab;
  ['stock','posted','draft'].forEach(t => {
    const b = document.getElementById('xmt-'+t);
    if (b) b.classList.toggle('active', t === tab);
  });
  renderXManage();
}

function setXManageFilter(f) {
  _xManageFilter = f;
  ['all','A','B'].forEach(v => {
    const b = document.getElementById('xmf-'+v);
    if (b) b.classList.toggle('active', v === f);
  });
  renderXManage();
}

function renderXManage() {
  if (typeof _xManageTab === 'undefined') return;
  const container = document.getElementById('xmanage-list');
  if (!container) return;

  const countEl = document.getElementById('xposts-count-label');

  if (_xManageTab === 'draft') {
    let drafts = getXDrafts();
    if (_xManageFilter !== 'all') drafts = drafts.filter(p => p.type === _xManageFilter);
    if (countEl) countEl.textContent = `見送り ${drafts.length}件`;
    container.innerHTML = drafts.length === 0
      ? '<div style="text-align:center;padding:20px;color:var(--text3);font-size:13px">見送り投稿はありません</div>'
      : drafts.map(p => {
        const dt = p.createdAt ? p.createdAt.slice(0,10) : '';
        return `<div class="xpost-item">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
            <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;${p.type==='A'?'background:rgba(59,130,246,.2);color:#60a5fa':'background:rgba(167,139,250,.2);color:#a78bfa'}">タイプ${p.type}</span>
            <span style="font-size:10px;color:var(--text3);padding:2px 7px;background:var(--bg5);border-radius:8px;">🔄 ブラッシュアップ候補</span>
          </div>
          <div class="xpost-content">${_escHtml(p.content)}</div>
          <div class="xpost-footer">
            <span class="xpost-date">${dt}</span>
            <span style="font-size:11px;color:var(--text3)">ブラッシュアップ ${p.brushUpCount||0}回</span>
            <div style="margin-left:auto;display:flex;gap:5px;">
              <button class="btn btn-ghost btn-sm" style="width:auto" onclick="xDraftBrushUp('${p.id}')">🔄 ブラッシュアップ</button>
              <button class="btn btn-red btn-sm" style="width:auto" onclick="xDraftDelete('${p.id}')">🗑️</button>
            </div>
          </div>
        </div>`;
      }).join('');
    return;
  }

  let posts = getNewXPosts();
  const targetStatus = _xManageTab === 'stock' ? 'ストック' : '投稿済み';
  posts = posts.filter(p => p.status === targetStatus);
  if (_xManageFilter !== 'all') posts = posts.filter(p => p.type === _xManageFilter);
  if (countEl) countEl.textContent = `ストック ${getNewXPosts().filter(p=>p.status==='ストック').length}件`;

  container.innerHTML = posts.length === 0
    ? `<div style="text-align:center;padding:20px;color:var(--text3);font-size:13px">投稿はありません</div>`
    : posts.map(p => {
      const allPosts = getNewXPosts().filter(q => q.status === 'ストック');
      const recent3 = allPosts.slice(0, 3);
      const sameEmotion   = recent3.filter(q => q.emotionAxis   && q.emotionAxis   === p.emotionAxis).length;
      const sameExpansion = recent3.filter(q => q.expansionAxis && q.expansionAxis === p.expansionAxis).length;
      const warn = (sameEmotion >= 2 || sameExpansion >= 2)
        ? `<div style="font-size:.72rem;color:#f87171;font-weight:700;margin-bottom:6px;">⚠️ 同じ軸が連続しています</div>`
        : '';
      const cc = p.content.replace(/\n/g,'').length;
      const ccCls = cc > 140 ? 'char-over' : cc > 120 ? 'char-warn' : 'char-ok';
      const dt = p.createdAt ? p.createdAt.slice(0,10) : '';
      return `<div class="xpost-item">
        ${warn}
        <div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin-bottom:6px;">
          <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;${p.type==='A'?'background:rgba(59,130,246,.2);color:#60a5fa':'background:rgba(167,139,250,.2);color:#a78bfa'}">タイプ${p.type}</span>
          ${p.emotionAxis   ? `<span style="font-size:10px;padding:2px 7px;background:var(--bg5);border-radius:8px;color:var(--text2);">${_escHtml(p.emotionAxis)}</span>` : ''}
          ${p.expansionAxis ? `<span style="font-size:10px;padding:2px 7px;background:var(--bg5);border-radius:8px;color:var(--text2);">${_escHtml(p.expansionAxis)}</span>` : ''}
        </div>
        <div class="xpost-content">${_escHtml(p.content)}</div>
        <div class="xpost-footer">
          <span class="xpost-date">${dt}</span>
          <span class="${ccCls}" style="font-size:11px;">${cc}字</span>
          <div style="margin-left:auto;display:flex;gap:5px;flex-wrap:wrap;">
            <button class="btn btn-ghost btn-sm" style="width:auto;font-weight:700" onclick="xPostCopy('${p.id}')">📋 コピー</button>
            ${p.status === 'ストック'
              ? `<button class="btn btn-green btn-sm" style="width:auto" onclick="xPostMarkPosted('${p.id}')">✅ 投稿済み</button>`
              : ''}
            <button class="btn btn-red btn-sm" style="width:auto" onclick="xPostDelete('${p.id}')">🗑️</button>
          </div>
        </div>
      </div>`;
    }).join('');
}

function xPostCopy(id) {
  const p = getNewXPosts().find(x => x.id === id);
  if (!p) return;
  navigator.clipboard.writeText(p.content).then(() => toast('コピーしました ✓'));
}

function xPostMarkPosted(id) {
  const posts = getNewXPosts();
  const p = posts.find(x => x.id === id);
  if (!p) return;
  p.status = '投稿済み'; p.postedAt = new Date().toISOString();
  setNewXPosts(posts); renderXManage(); toast('投稿済みにしました ✓');
}

function xPostDelete(id) {
  setNewXPosts(getNewXPosts().filter(x => x.id !== id));
  renderXManage(); toast('削除しました');
}

function xDraftDelete(id) {
  setXDrafts(getXDrafts().filter(x => x.id !== id));
  renderXManage(); toast('削除しました');
}

async function xDraftBrushUp(id) {
  const drafts = getXDrafts();
  const d = drafts.find(x => x.id === id);
  if (!d) return;
  const apiKey = localStorage.getItem(GEMINI_KEY_STORAGE) || '';
  if (!apiKey) { toast('APIキーを確認してください'); return; }

  const prompt = `以下の投稿文をベースに改善版を1本生成してください。
元の文の核心は残しつつ、表現・構成・冒頭・末尾を変えてください。
各投稿文の前に「【タイプ${d.type}】」を明記してください。
投稿文：${d.content}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 500, temperature: 0.9 }
        })
      }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || res.status);
    const parts = data.candidates?.[0]?.content?.parts || [];
    const rawText = parts.filter(p => !p.thought).map(p => p.text || '').join('').trim();
    const matches = [...rawText.matchAll(/【(タイプ[AB])】\s*([\s\S]*?)(?=【タイプ[AB]】|$)/g)];
    _xgenResults = matches
      .map(m => ({ type: m[1].includes('A') ? 'A' : 'B', content: m[2].trim() }))
      .filter(r => r.content.length > 0);
    if (_xgenResults.length === 0) _xgenResults = [{ type: d.type, content: rawText }];
    // brushUpCount++
    d.brushUpCount = (d.brushUpCount || 0) + 1;
    d.lastBrushUpAt = new Date().toISOString();
    setXDrafts(drafts);
    _xgenEmotionTag = {}; _xgenExpansionTag = {};
    _renderXGenCards();
    document.getElementById('xgen-results-wrap').style.display = 'block';
    // X作成セクションへスクロール
    const secEl = document.getElementById('sec-xwrite');
    if (secEl) { if (!secState.xwrite) toggleSec('xwrite'); secEl.scrollIntoView({ behavior: 'smooth' }); }
    toast('ブラッシュアップ版を生成しました');
    renderXManage();
  } catch(e) {
    toast('APIキーを確認してください');
  }
}

// ================================================================
// プロンプト管理
// ================================================================
function _initXPromptTextarea() {
  if (typeof X_PROMPT_KEY === 'undefined') return;
  const ta = document.getElementById('xPromptTextarea');
  if (ta) ta.value = getXPromptText();
}

function saveXPromptText() {
  const ta = document.getElementById('xPromptTextarea');
  if (!ta) return;
  S.xPromptCustom = ta.value; save();
  const msg = document.getElementById('xprompt-save-msg');
  if (msg) { msg.style.display = 'block'; setTimeout(() => { msg.style.display = 'none'; }, 1500); }
}

function resetXPromptText() {
  const ta = document.getElementById('xPromptTextarea');
  if (ta) ta.value = DEFAULT_X_PROMPT;
  S.xPromptCustom = null; save();
  const msg = document.getElementById('xprompt-save-msg');
  if (msg) { msg.style.display = 'block'; setTimeout(() => { msg.style.display = 'none'; }, 1500); }
}

async function testXPromptApi() {
  const apiKey = localStorage.getItem(GEMINI_KEY_STORAGE) || '';
  const btn    = document.getElementById('xprompt-test-btn');
  const resEl  = document.getElementById('xprompt-test-result');
  if (!btn || !resEl) return;
  if (!apiKey) { resEl.style.display = 'block'; resEl.style.color = '#f87171'; resEl.textContent = '❌ 届いていません。APIキーを確認してください'; return; }
  btn.textContent = '送信中...'; btn.disabled = true; resEl.style.display = 'none';
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'テスト' }] }],
          generationConfig: { maxOutputTokens: 5 }
        })
      }
    );
    resEl.style.display = 'block';
    if (res.ok) { resEl.style.color = 'var(--green)'; resEl.textContent = '✅ ジミーに届いています'; }
    else        { resEl.style.color = '#f87171';       resEl.textContent = '❌ 届いていません。APIキーを確認してください'; }
  } catch(e) {
    resEl.style.display = 'block'; resEl.style.color = '#f87171';
    resEl.textContent = '❌ 届いていません。APIキーを確認してください';
  } finally {
    btn.textContent = '🔍 プロンプトをテスト送信する'; btn.disabled = false;
  }
}

// ================================================================
// X投稿データ export/import
// ================================================================
function exportXData() {
  const data = { xPosts: getNewXPosts(), xDraftPosts: getXDrafts() };
  const json = JSON.stringify(data, null, 2);
  const date = new Date().toISOString().slice(0,10).replace(/-/g,'');
  _downloadFile(json, `xdata_${date}.json`, 'application/json');
  toast('エクスポートしました');
}

function importXData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const msg = document.getElementById('x-import-msg');
    try {
      const data = JSON.parse(e.target.result);
      let count = 0;
      if (Array.isArray(data.xPosts)) {
        const existing = getNewXPosts();
        const existIds = new Set(existing.map(p => p.id));
        const toAdd = data.xPosts.filter(p => !existIds.has(p.id));
        setNewXPosts([...existing, ...toAdd]);
        count += toAdd.length;
      }
      if (Array.isArray(data.xDraftPosts)) {
        const existing = getXDrafts();
        const existIds = new Set(existing.map(p => p.id));
        const toAdd = data.xDraftPosts.filter(p => !existIds.has(p.id));
        setXDrafts([...existing, ...toAdd]);
        count += toAdd.length;
      }
      renderXManage();
      if (msg) { msg.style.display = 'block'; msg.textContent = `✅ インポートしました（${count}件）`; }
      toast(`インポートしました（${count}件）`);
    } catch(err) {
      if (msg) { msg.style.display = 'block'; msg.style.color = '#f87171'; msg.textContent = 'JSONの解析に失敗しました'; }
    }
    event.target.value = '';
  };
  reader.readAsText(file);
}


runNabebaseTests();

// ================================================================
// 執筆ワークフローナビゲーター
// ================================================================
const WF_STEP3_COPY = `【ジミーへの被りチェック依頼】
使用モデル：gemini-3.1-pro-preview

nabebaseの公開記事全件・失敗パターン全件（絶対禁止フラグ含む）を参照して
以下の新規記事候補との被り・失敗パターンとの一致をチェックしてください

【チェック対象の新規候補】
タイトル：
展開軸：
感情軸：
思考の型：
読者視点：
学びの核心（1文）：
タイトルキーワード（配列）：

【チェック項目】
・タイトルキーワードの重複（部分一致含む）
・展開軸の重複
・感情軸の重複
・思考の型の重複
・読者視点の重複
・学びの核心が70%以上類似しているもの
・失敗パターンとの軸の組み合わせ一致
・絶対禁止フラグが「絶対禁止」のパターンとの一致（最優先でNG）

【判定基準】
・絶対禁止フラグと一致 → 即NG（理由を明記。修正案の提示不要）
・完全一致 → NG（使用禁止）
・類似70%以上 → 要修正（どこが近いかを明示）
・失敗パターンと一致（絶対禁止以外） → 要修正（理由を明記）
・問題なし → OK

【出力形式】
判定：OK / NG / 要修正
理由：（該当する過去記事タイトルと被り箇所を明記）
修正案：（要修正の場合のみ。修正後の軸・キーワード候補を出す）`;

const WF_STEPS = [
  {
    title: 'STEP 1：クロの事前チェック',
    sub: '軸の確認と差分設計',
    desc: 'まずnabebaseを開いて、直近3本の公開済み記事の「展開軸・感情軸・思考の型」を確認します。今回使う軸と被っていれば、別の軸に選び直してください。\n\n次に、棚卸しログを読んで「崩すべき前提認識」と「読了後の変化」を自分の言葉で導き出します。ここで導き出した内容が、パペへの依頼文の核になります。\n\n最後に方向A・B（共感軸・テーマ昇華軸）の直近5本の比率を確認して、偏りがあれば逆の方向に切り替えます。全項目が終わったら進行状態を「STEP1完了」に更新してください。',
    warn: null,
    info: null,
    copyBtn: null,
    tasks: [
      'nabebaseで直近3本の展開軸・感情軸・思考の型を確認した',
      '直近3本と被りがないか照合した（被りがあれば別の軸を選び直した）',
      '崩すべき前提認識を棚卸しログから導出した',
      '読了後の変化を棚卸しログから導出した',
      'nabebaseの失敗パターンと照合した（絶対禁止フラグを確認）',
      '直近5本の方向A・B比率を確認した（3本以上偏りがあれば逆に切り替えた）',
      'シリーズの場合は前の記事との接続点を特定した（単発の場合は「単発」と確認）',
    ],
  },
  {
    title: 'STEP 2：思考枠チェック',
    sub: '本文レベルの被り確認',
    desc: 'STEP1で決めた軸を使って、本文レベルで被りがないかを確認します。展開軸や感情軸が違っていても「読者が読んだ後の感触」が似ていることがあります。\n\n「直近3本を読んだ読者がこの記事を読んで、また同じ話だと感じないか」を基準に確認してください。1つでも似ていると感じたら、展開軸か視点を変えて再設計します。\n\n全項目が問題なければ、nabebaseの進行状態を「STEP2完了」に更新してください。',
    warn: null,
    info: null,
    copyBtn: null,
    tasks: [
      'タイトルの問い構造が直近3本と異なることを確認した',
      '読者が得る学びの結論が直近3本と異なることを確認した',
      '思考の型が3本連続していないことを確認した',
      '視点が直近3本と被っていないことを確認した',
      '読者印象レベルのチェックをした（「また同じ話だ」と感じないか）',
    ],
  },
  {
    title: 'STEP 3：ジミー被りチェック',
    sub: '全公開記事・失敗パターンとの照合',
    desc: '下の「テンプレートをコピー」ボタンを押して、タイトル・展開軸・感情軸・思考の型・読者視点・学びの核心・タイトルキーワードを埋めてジミーに投げます。\n\nジミーはnabebase全公開記事と失敗パターン全件を参照して、OK・NG・要修正を返してきます。OKが返ってきたらnabebaseの進行状態を「STEP3ジミー被りチェックOK」に更新してください。',
    warn: '要修正が返ってきた場合は軸を修正して再チェックしてください（上限3回）。3回目でもNGが返ってきた場合は、その記事候補を失敗パターンに登録して次の候補に移ります。',
    info: null,
    copyBtn: { label: 'ジミー被りチェックテンプレートをコピー', text: WF_STEP3_COPY },
    tasks: [
      'テンプレートに今回の軸情報を記入してジミーに投げた',
      'ジミーからOKが返ってきた',
      'nabebaseに記事候補JSON（V6スキーマ）が登録されていることを確認した',
    ],
  },
  {
    title: 'STEP 4：パペへのリサーチ依頼',
    sub: '一次情報の収集',
    desc: 'パペへのリサーチ指示文v3.2を開いて、「記事軸の確認」ブロックの8項目を今回の記事内容に書き換えてからパペに投げます。\n\nパペのリサーチ結果が返ってきたら、nabebaseの「パペ依頼状況」を「完了」に更新して、進行状態を「STEP4パペリサーチ完了」に更新してください。',
    warn: null,
    info: '書き換える8項目：記事タイトル・この記事が解決する問題・ターゲット読者の感情状態・崩すべき前提認識・読了後に読者に起きる変化・展開軸・今回使う思考の型・今回使う視点',
    copyBtn: null,
    tasks: [
      'パペ指示文v3.2の「記事軸の確認」ブロック8項目を今回の内容で書き換えた',
      'パペに投げた',
      'パペのリサーチ結果が返ってきた',
      'nabebaseの「パペ依頼状況」を「完了」に更新した',
    ],
  },
  {
    title: 'STEP 5：ジミーへの素材整理',
    sub: '学びの骨格設計',
    desc: 'パペのリサーチ結果を一切要約せず、原文のまま全文コピーします。それをジミーへの素材整理指示テンプレートと合わせてジミーに投げます。\n\nジミーからまず骨子（①〜④）が返ってきます。骨子の4点（流れ・被り・着地・失敗パターン一致）を確認してOKを返してください。OKを返したあと、ジミーから詳細設計（⑤〜⑬）が届きます。\n\n詳細設計が届いたらnabebaseの進行状態を「STEP5ジミー構成完了」に更新してください。',
    warn: '骨子の差し戻しは最大3回まで。3回目でもOKが返せない場合は、その記事候補を失敗パターンに登録してべーやんに報告します。パペの結果は絶対に要約・圧縮しないでください。',
    info: null,
    copyBtn: null,
    tasks: [
      'パペの結果を一切要約せず原文のまま全文コピーした',
      'ジミーへの素材整理指示と合わせてジミーに投げた',
      'ジミーから骨子（①〜④）が返ってきた',
      '骨子OKの4点を確認した（流れの一貫性・被り・着地・失敗パターン一致）',
      'ジミーに骨子OKを返した',
      'ジミーから詳細設計（⑤〜⑬）が返ってきた',
    ],
  },
  {
    title: 'STEP 6：記事制作',
    sub: '執筆・自己チェック・登録',
    desc: 'ジミーの設計素材を記事制作チャットに渡して執筆します。\n\n書き終わったら4点の自己チェックを実行してください。問題があれば自分で修正してからべーやんに渡します。最後にnabebaseへの登録を忘れずに行ってください。',
    warn: null,
    info: null,
    copyBtn: null,
    tasks: [
      'ジミーの設計素材を記事制作チャットに渡した',
      '自己チェック①：上から目線の箇所がないか確認した',
      '自己チェック②：後半が前向きな着地になっているか確認した',
      '自己チェック③：語り口のハイブリッド設計が守られているか確認した',
      '自己チェック④：思考の型と視点が記事全体で一貫しているか確認した',
      'nabebaseの使用状況を「使用済み」に更新した',
      '公開記事サマリーJSONをnabebaseに登録した',
    ],
  },
];

const WF_STEP_STATES = [
  'STEP1完了',
  'STEP2完了',
  'STEP3ジミー被りチェックOK',
  'STEP4パペリサーチ完了',
  'STEP5ジミー構成完了',
  'STEP6記事完了',
];

let _wfNoteId = null;

function openWorkflowNav(noteId) {
  const id = Number(noteId);
  const n = S.notes.find(x => x.id === id);
  if (!n) return;
  _wfNoteId = id;
  document.getElementById('wf-article-title').textContent = n.title || '（未設定）';
  renderWorkflowNav();
  document.getElementById('modal-workflow').classList.add('open');
}

function closeWorkflowNav() {
  document.getElementById('modal-workflow').classList.remove('open');
  _wfNoteId = null;
}

function _wfKey(noteId) {
  const id = Number(noteId);
  const n = S.notes.find(x => x.id === id);
  return 'workflow_progress_' + (n ? n.title : String(id));
}

function _wfLoadTasks(noteId) {
  const id = Number(noteId);
  const n = S.notes.find(x => x.id === id);
  const key = n ? n.title : String(id);
  const prog = S.workflowProgress && S.workflowProgress[key];
  return prog ? (prog.tasks || {}) : {};
}

function _wfSaveTasks(noteId, tasks) {
  const id = Number(noteId);
  const n = S.notes.find(x => x.id === id);
  const key = n ? n.title : String(id);
  if (!S.workflowProgress) S.workflowProgress = {};
  S.workflowProgress[key] = { articleTitle: key, tasks };
  save();
}

function _wfStepDone(si, tasks) {
  return WF_STEPS[si].tasks.every((_, ti) => !!tasks[si + '_' + ti]);
}

function _wfEsc(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function _wfRefreshUI() {
  const modalOpen = document.getElementById('modal-workflow')?.classList.contains('open');
  if (modalOpen) renderWorkflowNav();
  // カード内パネルも更新
  const area = document.getElementById('ni-steps-' + _wfNoteId);
  if (area) {
    const n = S.notes.find(x => x.id === _wfNoteId);
    if (n) { area.innerHTML = _buildNiStepCard(n); area.dataset.built = '1'; }
  }
}

function renderWorkflowNav() {
  const noteId = _wfNoteId;
  if (!noteId) return;
  const tasks = _wfLoadTasks(noteId);
  let doneCount = 0;
  for (let i = 0; i < WF_STEPS.length; i++) { if (_wfStepDone(i, tasks)) doneCount++; }
  document.getElementById('wf-progress-fill').style.width = (doneCount / WF_STEPS.length * 100) + '%';

  const _n = S.notes.find(x => x.id === noteId);
  let html = _n ? _renderWfAutoPanel(_n, true) : '';

  // 手動workflowState変更UI
  const curWs = (_n && _n.workflowState) || '';
  const wsOptions = ['', ...WF_STEP_STATES].map(v =>
    `<option value="${v}"${v === curWs ? ' selected' : ''}>${v || '（未設定）'}</option>`
  ).join('');
  html += `<div style="background:rgba(0,0,0,.15);border:1px solid var(--border);border-radius:10px;padding:10px 12px;margin-bottom:10px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">
    <span style="font-size:.75rem;color:var(--text3);flex-shrink:0">🔧 状態を手動変更：</span>
    <select id="wf-state-select" style="flex:1;min-width:160px;background:var(--bg4);color:var(--text);border:1px solid var(--border);border-radius:6px;padding:5px 8px;font-size:.8rem;font-family:inherit">${wsOptions}</select>
    <button onclick="wfSetWorkflowState()" style="min-height:32px;padding:0 14px;background:var(--accent);border:none;border-radius:8px;color:#fff;font-size:.8rem;font-weight:700;cursor:pointer;font-family:inherit;white-space:nowrap">💾 保存</button>
  </div>`;

  html += '<hr class="wf-auto-sep">';
  html += '<div style="font-size:10px;color:var(--text3);letter-spacing:.5px;margin-bottom:4px">タスクチェックリスト（手動）</div>';
  for (let si = 0; si < WF_STEPS.length; si++) {
    const step = WF_STEPS[si];
    const isDone = _wfStepDone(si, tasks);
    const prevDone = si === 0 || _wfStepDone(si - 1, tasks);
    const isActive = !isDone && prevDone;
    const stateClass = isDone ? 'done' : isActive ? 'active' : 'locked';
    const checkedCount = step.tasks.filter((_, ti) => !!tasks[si + '_' + ti]).length;

    html += '<div class="wf-step ' + stateClass + '">'
      + '<div class="wf-step-header">'
      + '<div class="wf-badge">' + (isDone ? '✓' : si + 1) + '</div>'
      + '<div class="wf-step-title-wrap">'
      + '<div class="wf-step-title">' + _wfEsc(step.title) + '</div>'
      + '<div class="wf-step-sub">' + _wfEsc(step.sub) + '</div>'
      + '</div>'
      + '<div class="wf-step-count">' + checkedCount + '/' + step.tasks.length + '</div>'
      + '</div>';

    if (isActive) {
      html += '<div class="wf-content">'
        + '<div class="wf-desc-box">'
        + '<div class="wf-desc-label">このSTEPでやること</div>'
        + '<div class="wf-desc-text">' + _wfEsc(step.desc) + '</div>'
        + '</div>';
      if (step.warn) html += '<div class="wf-warn-box">⚠️ ' + _wfEsc(step.warn) + '</div>';
      if (step.info) html += '<div class="wf-info-box">📌 ' + _wfEsc(step.info) + '</div>';
      if (step.copyBtn) {
        const bid = 'wf-cbtn-' + si;
        html += '<button class="wf-copy-btn" id="' + bid + '" onclick="wfCopyText(' + si + ',\'' + bid + '\')">' + _wfEsc(step.copyBtn.label) + '</button>';
      }
      // STEP3: Gemini自動送信ボタン
      if (si === 2) {
        html += '<button class="wf-copy-btn" id="wf-step3-send-btn" style="background:var(--blue,#1a73e8);color:#fff;margin-top:6px" onclick="wfStep3AutoSend()">🤖 Geminiに自動送信</button>'
          + '<div id="wf-step3-result" style="margin-top:8px"></div>';
      }
      // 差し戻し登録ボタン（全STEP共通）
      html += '<button onclick="wfOpenFailure(' + si + ')" style="margin-top:8px;font-size:11px;padding:4px 10px;border-radius:6px;border:1px solid var(--orange,#b45309);background:transparent;color:var(--orange,#b45309);cursor:pointer;font-family:inherit">⚠️ 差し戻し登録</button>';
      html += '<div class="wf-checklist">';
      step.tasks.forEach(function(task, ti) {
        const checked = !!tasks[si + '_' + ti];
        const dis = stateClass === 'locked' ? ' disabled' : '';
        html += '<label class="wf-check-item">'
          + '<input type="checkbox"' + (checked ? ' checked' : '') + dis + ' onchange="wfToggleCheck(_wfNoteId,' + si + ',' + ti + ',this.checked)">'
          + '<span class="wf-check-label' + (checked ? ' checked' : '') + '">' + _wfEsc(task) + '</span>'
          + '</label>';
      });
      html += '</div></div>';
    }
    html += '</div>';
  }
  if (doneCount === WF_STEPS.length) {
    html += '<div class="wf-complete-banner">'
      + '<div class="wf-complete-title">✅ 全STEP完了</div>'
      + '<div class="wf-complete-sub">公開記事サマリーJSONのnabebase登録を確認してください</div>'
      + '</div>';
  }
  document.getElementById('wf-body').innerHTML = html;
}

function wfToggleCheck(noteId, si, ti, checked) {
  const tasks = _wfLoadTasks(noteId);
  tasks[si + '_' + ti] = checked;
  _wfSaveTasks(noteId, tasks);
  // STEPが全完了したら記事候補レコードのworkflowStateを自動更新
  if (_wfStepDone(si, tasks)) {
    const n = S.notes.find(x => x.id === Number(noteId));
    if (n && WF_STEP_STATES[si]) {
      n.workflowState = WF_STEP_STATES[si];
      save();
    }
    // STEP6完了: 公開記事サマリーJSONを自動登録
    if (si === 5) _wfAutoRegisterPublished(Number(noteId));
  }
  renderWorkflowNav();
}

function wfCopyText(si, btnId) {
  const step = WF_STEPS[si];
  if (!step || !step.copyBtn) return;
  let text = step.copyBtn.text;
  // STEP3: ノートデータを動的埋め込み
  if (si === 2 && _wfNoteId) {
    const n = S.notes.find(x => x.id === _wfNoteId);
    if (n) {
      const axis = (n.axis && typeof n.axis === 'object') ? n.axis : {};
      const art = n.article || {};
      const mgmt = n.management || {};
      text = text
        .replace('タイトル：', 'タイトル：' + (n.title || ''))
        .replace('展開軸：', '展開軸：' + (axis.expansionAxis || ''))
        .replace('感情軸：', '感情軸：' + (axis.emotionAxis || ''))
        .replace('思考の型：', '思考の型：' + (art.thinkingPattern || ''))
        .replace('読者視点：', '読者視点：' + (art.readerPerspective || ''))
        .replace('学びの核心（1文）：', '学びの核心（1文）：' + (art.soulSentence || ''))
        .replace('タイトルキーワード（配列）：', 'タイトルキーワード（配列）：' + JSON.stringify(mgmt.titleKeywords || []));
    }
  }
  const btn = document.getElementById(btnId);
  const origLabel = btn ? btn.textContent : '';
  const onCopied = function() {
    if (!btn) return;
    btn.textContent = 'コピーしました';
    btn.classList.add('copied');
    setTimeout(function() {
      btn.textContent = origLabel;
      btn.classList.remove('copied');
    }, 1800);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(onCopied).catch(function() { _wfFallback(text); onCopied(); });
  } else { _wfFallback(text); onCopied(); }
}

function _wfFallback(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.top = '-9999px';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
}

// ================================================================
// Gemini API 共通送信ユーティリティ（リトライ・タイムアウト対応）
// ================================================================
const WF_GEMINI_MODEL   = 'gemini-3.1-pro-preview';
const WF_GEMINI_TIMEOUT = 30000;
const WF_GEMINI_RETRIES = 3;

async function _wfGeminiSend(prompt, opts) {
  opts = opts || {};
  const apiKey = localStorage.getItem(GEMINI_KEY_STORAGE) || '';
  if (!apiKey) throw new Error('Gemini APIキーが設定されていません（設定画面から登録してください）');
  const url  = `https://generativelanguage.googleapis.com/v1beta/models/${WF_GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const body = JSON.stringify({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature:     opts.temperature     || 0.3,
      maxOutputTokens: opts.maxOutputTokens || 4096
    }
  });
  let lastErr;
  for (let attempt = 0; attempt < WF_GEMINI_RETRIES; attempt++) {
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), WF_GEMINI_TIMEOUT);
    try {
      const res = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body, signal:ctrl.signal });
      clearTimeout(timer);
      if (!res.ok) { const t = await res.text().catch(()=>''); throw new Error(`APIエラー ${res.status}: ${t.slice(0,120)}`); }
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error('返答が空です');
      return text;
    } catch(e) {
      clearTimeout(timer);
      lastErr = e;
      if (attempt < WF_GEMINI_RETRIES - 1) await new Promise(r => setTimeout(r, 1200 * (attempt + 1)));
    }
  }
  throw lastErr || new Error('Gemini送信に失敗しました（3回リトライ後）');
}

// ================================================================
// _renderWfAutoPanel: workflowState に応じた自動化UIパネル
// ================================================================
function _buildWfPapeRequest(n) {
  const re = n.research || {};
  if (re.researchPrompt) return re.researchPrompt;
  const ax = n.axis || {};
  const co = n.concept || {};
  const art = n.article || {};
  return `【パペへのリサーチ依頼】
記事タイトル：${n.title || ''}
展開軸：${ax.expansionAxis || ''}
感情軸：${ax.emotionAxis || ''}
思考の型：${art.thinkingPattern || ''}
読者視点：${art.readerPerspective || ''}
解決する問題：${co.coreProblem || ''}
崩すべき前提認識：${ax.readerBeliefToBreak || co.readerBeliefToBreak || ''}
読了後の変化：${ax.readerChangeAfterReading || co.readerChangeAfterReading || ''}

上記の軸・視点に沿った一次情報（個人の生の声・体験談・失敗談）を大量に収集してください。
要約・まとめサイトは不要。Reddit・note・X・5ch等の個人の声を原文引用してください。`;
}

function _wfEl(name) {
  return document.getElementById('wf-' + (_wfNoteId || '') + '-' + name)
      || document.getElementById('wf-' + name);
}

function _renderWfAutoPanel(n, inModal) {
  if (!n) return '';
  const ws  = n.workflowState || '';
  const art = n.article || {};
  const bS  = 'min-height:40px;border:none;border-radius:10px;color:#fff;font-weight:700;font-size:.82rem;cursor:pointer;font-family:inherit;padding:0 16px;width:100%';
  const wrap = 'background:rgba(58,102,80,.08);border:1.5px solid var(--accent);border-radius:12px;padding:14px;margin-bottom:10px';
  const ttl  = 'font-size:.82rem;font-weight:700;color:var(--accent);margin-bottom:8px';
  const sub  = 'font-size:.73rem;color:var(--text3);margin-bottom:10px;line-height:1.5';

  if (ws === 'STEP2完了') {
    return `<div style="${wrap}">
      <div style="${ttl}">🤖 自動化：STEP3 被りチェック</div>
      <div style="${sub}">ジミーが公開記事全件・失敗パターン全件と照合します（model: ${WF_GEMINI_MODEL}）</div>
      <button style="${bS};background:#1a73e8" onclick="wfStep3AutoSend()">🔍 ジミーに被りチェックを投げる</button>
      <div id="wf-step3-result" style="margin-top:10px"></div>
    </div>`;
  }

  if (ws === 'STEP3ジミー被りチェックOK') {
    const papeReq    = _buildWfPapeRequest(n);
    const savedPape  = (n.management || {}).papeResult || '';
    return `<div style="${wrap}">
      <div style="${ttl}">📋 STEP4：パペへのリサーチ依頼</div>
      <div style="${sub}">依頼文をコピーしてパペ（Perplexity）に貼り付け、結果を下欄に貼って保存してください</div>
      <div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:10px;max-height:110px;overflow-y:auto;font-size:11px;line-height:1.6;color:var(--text2);white-space:pre-wrap;margin-bottom:8px" id="wf-pape-req-display">${_wfEsc(papeReq)}</div>
      <button style="${bS};background:var(--bg4);border:1px solid var(--border);color:var(--text);margin-bottom:14px" id="wf-pape-copy-btn" onclick="wfCopyPapeReq(this)">📋 リサーチ依頼文をコピー</button>
      <div style="font-size:.78rem;font-weight:600;color:var(--text);margin-bottom:6px">パペのリサーチ結果を貼り付け（原文・要約禁止）</div>
      <textarea id="wf-pape-result" rows="7" style="width:100%;font-size:12px;border:1px solid var(--border);border-radius:8px;padding:8px;background:var(--bg2);color:var(--text);resize:vertical;box-sizing:border-box;font-family:inherit" placeholder="Perplexityのリサーチ結果をここに原文のまま貼り付け...">${_wfEsc(savedPape)}</textarea>
      <button style="${bS};background:var(--accent);margin-top:8px" onclick="wfSavePapeResult()">💾 保存してSTEP4完了にする</button>
    </div>`;
  }

  if (ws === 'STEP4パペリサーチ完了') {
    const retries = art.boneRetries || 0;
    if (!art.jimmyBoneResult) {
      return `<div style="${wrap}">
        <div style="${ttl}">🤖 自動化：骨子生成（①〜④）</div>
        <div style="${sub}">パペ結果をもとにジミーが骨子を生成します（リトライ上限3回）</div>
        <button style="${bS};background:#1a73e8" onclick="wfStep4BoneSend()">🔧 ジミーに素材整理を投げる（骨子）</button>
        <div id="wf-bone-result" style="margin-top:10px"></div>
      </div>`;
    }
    if (!art.jimmyBoneOK) {
      return `<div style="${wrap}">
        <div style="${ttl}">🔍 骨子確認（①〜④） ― 差し戻し ${retries}/3回</div>
        <div style="background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:10px;max-height:220px;overflow-y:auto;font-size:11.5px;line-height:1.7;white-space:pre-wrap;margin-bottom:12px">${_wfEsc(art.jimmyBoneResult)}</div>
        <div style="display:flex;gap:8px">
          <button style="${bS};background:var(--accent);flex:1" onclick="wfStep4BoneOK()">✅ 骨子OK</button>
          <button style="flex:1;min-height:40px;border:1px solid #c84646;border-radius:10px;color:#c84646;font-weight:700;font-size:.82rem;cursor:pointer;font-family:inherit;background:transparent" onclick="wfStep4BoneReject()">↩ 差し戻し</button>
        </div>
        <div id="wf-bone-result" style="margin-top:10px"></div>
      </div>`;
    }
    return `<div style="${wrap}">
      <div style="${ttl}">🤖 自動化：詳細設計（⑤〜⑬）＋派生候補登録</div>
      <div style="${sub}">骨子をベースに詳細設計を生成し、派生候補JSONを自動登録します</div>
      <button style="${bS};background:#1a73e8" onclick="wfStep4MaterialSend()">🔧 ジミーに素材整理を投げる（⑤〜⑬）</button>
      <div id="wf-material-result" style="margin-top:10px"></div>
    </div>`;
  }

  if (ws === 'STEP5ジミー構成完了') {
    return `<div style="${wrap}">
      <div style="${ttl}">✅ 記事制作完了ボタン</div>
      <div style="${sub}">ステータスを公開済みに更新し、公開記事サマリーJSONを自動登録します</div>
      <button style="${bS};background:var(--orange,#c07030)" onclick="wfStep6Complete()">🎉 記事制作完了にする（STEP6更新）</button>
    </div>`;
  }

  if (ws === 'STEP6記事完了') {
    return `<div style="${wrap}">
      <div style="${ttl}">🎉 STEP6記事完了</div>
      <div style="${sub}">この記事は制作完了済みです。公開記事サマリーに登録されています。</div>
    </div>`;
  }

  if (ws === 'STEP1完了') {
    // モーダル内ではopenWorkflowNavボタンを出さない（既に開いているため再帰になる）
    if (inModal) {
      return `<div style="${wrap}">
        <div style="${ttl}">✅ STEP1完了 → 次：STEP2 執筆指示文を作成</div>
        <div style="${sub}">クロとのセッションでnb2Promptを生成し、記事カードの「執筆指示文」欄に貼り付けてください。完了後にワークフローのSTEP2タスクを全チェックするとSTEP2完了になります。</div>
      </div>`;
    }
    return `<div style="${wrap}">
      <div style="${ttl}">✅ STEP1完了 → 次：STEP2 執筆指示文を作成</div>
      <div style="${sub}">クロとのセッションでnb2Promptを生成し、記事カードの「執筆指示文」欄に貼り付けてください。完了後にワークフローでSTEP2完了を記録すると被りチェックが使えるようになります。</div>
      <button style="${bS};background:var(--accent)" onclick="openWorkflowNav(${n.id})">📋 ワークフローを開く</button>
    </div>`;
  }

  // workflowState 未設定（undefined / 空文字）→ STEP1未着手として扱う
  if (!ws) {
    return `<div style="${wrap}">
      <div style="${ttl}">🚀 STEP1未着手 — ワークフローを開始する</div>
      <div style="${sub}">まだワークフローが開始されていません。ボタンを押すとSTEP1完了に設定され、被りチェック・骨子生成などの自動化ボタンが使えるようになります。</div>
      <button style="${bS};background:var(--accent)" onclick="wfStartWorkflow()">▶ ワークフローを開始する（STEP1完了にする）</button>
    </div>`;
  }

  // 不明な値（上記どれにも該当しない）
  if (inModal) {
    return `<div style="${wrap}">
      <div style="${ttl}">⚠️ 不明な状態: ${_wfEsc(ws)}</div>
      <div style="${sub}">下の「状態を手動変更」から正しいSTEPを選んで保存してください。</div>
    </div>`;
  }
  return `<div style="${wrap}">
    <div style="${ttl}">⚠️ 不明な状態: ${_wfEsc(ws)}</div>
    <div style="${sub}">ワークフローを開いて状態を確認してください。</div>
    <button style="${bS};background:var(--accent)" onclick="openWorkflowNav(${n.id})">📋 ワークフローを開く</button>
  </div>`;
}

function wfStartWorkflow() {
  const n = S.notes.find(x => x.id === _wfNoteId);
  if (!n) return;
  n.workflowState = 'STEP1完了';
  save();
  _wfRefreshUI();
  toast('✅ ワークフローを開始しました（STEP1完了）');
}

function wfSetWorkflowState() {
  const n = S.notes.find(x => x.id === _wfNoteId);
  if (!n) return;
  const sel = document.getElementById('wf-state-select');
  if (!sel) return;
  n.workflowState = sel.value || undefined;
  save();
  _wfRefreshUI();
  toast('✅ workflowStateを「' + (sel.value || '未設定') + '」に変更しました');
}

window.wfBulkInitWorkflow = function() {
  function _showToast(msg) {
    const e = document.getElementById('toast');
    if (!e) { alert(msg); return; }
    e.textContent = msg;
    // classList依存を排除してinline styleで直接表示
    e.style.opacity = '1';
    e.style.transform = 'translateX(-50%) translateY(0)';
    e.style.pointerEvents = 'auto';
    setTimeout(() => {
      e.style.opacity = '0';
      e.style.transform = 'translateX(-50%) translateY(20px)';
    }, 3000);
  }

  const targets = (S.notes || []).filter(x => !x.workflowState);
  if (targets.length === 0) { _showToast('ℹ️ 未設定の記事はありません'); return; }

  const count = targets.length;
  targets.forEach(n => { n.workflowState = 'STEP1完了'; });

  // save()経由で書き込み（_fbWritePendingを立てることでonValueの即時発火を防ぐ）
  save();

  // UI再描画
  if (typeof renderNotes === 'function') renderNotes();

  _showToast('✅ ' + count + '件を初期化しました（STEP1完了）');
};

function wfCopyPapeReq(btn) {
  const el = _wfEl('pape-req-display');
  const text = el ? el.textContent : '';
  if (!text) return;
  const copy = () => { const ta=document.createElement('textarea');ta.value=text;ta.style.cssText='position:fixed;top:-9999px';document.body.appendChild(ta);ta.select();document.execCommand('copy');document.body.removeChild(ta); };
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(text).catch(copy); else copy();
  const orig = btn.textContent;
  btn.textContent = '✅ コピーしました！';
  setTimeout(() => { btn.textContent = orig; }, 2000);
}

function wfSavePapeResult() {
  const n = S.notes.find(x => x.id === _wfNoteId);
  if (!n) { toast('記事が見つかりません'); return; }
  const papeResult = (_wfEl('pape-result')?.value || '').trim();
  if (!papeResult) { toast('パペのリサーチ結果を入力してください'); return; }
  if (!n.management) n.management = {};
  n.management.papeResult = papeResult;
  n.workflowState = WF_STEP_STATES[3];
  const tasks = _wfLoadTasks(_wfNoteId);
  WF_STEPS[3].tasks.forEach((_, ti) => { tasks['3_' + ti] = true; });
  _wfSaveTasks(_wfNoteId, tasks);
  save();
  _wfRefreshUI();
  toast('✅ パペ結果を保存 - STEP4完了に自動更新しました');
}

// ----------------------------------------------------------------
// STEP3: Gemini自動被りチェック送信
// ----------------------------------------------------------------
async function wfStep3AutoSend() {
  const n = S.notes.find(x => x.id === _wfNoteId);
  if (!n) { toast('記事が見つかりません'); return; }

  const btn = _wfEl('step3-send-btn');
  const resultEl = _wfEl('step3-result');
  if (btn) { btn.disabled = true; btn.textContent = '送信中...'; }
  if (resultEl) resultEl.innerHTML = '<div style="color:var(--text3);font-size:12px;padding:8px 0">⏳ Geminiに送信中...</div>';

  const axis = (n.axis && typeof n.axis === 'object') ? n.axis : {};
  const art = n.article || {};
  const mgmt = n.management || {};
  const published = getPublishedArticles().map(a => ({
    title: a.publishedTitle, expansionAxis: a.expansionAxis, emotionAxis: a.emotionAxis,
    thinkingPattern: a.thinkingPattern, readerPerspective: a.readerPerspective, coreLearning: a.coreLearning
  }));
  const failures = getFailurePatterns().map(x => ({ タイトル: x.タイトル, 内容: x.内容, 絶対禁止: x.棚卸し済み ? false : true }));

  const prompt = `【ジミーへの被りチェック依頼】

nabebaseの公開記事全件・失敗パターン全件（絶対禁止フラグ含む）を参照して以下の新規記事候補との被り・失敗パターンとの一致をチェックしてください。

【公開済み記事一覧（JSON）】
${JSON.stringify(published, null, 2)}

【失敗パターン一覧（JSON）】
${JSON.stringify(failures, null, 2)}

【チェック対象の新規候補】
タイトル：${n.title || ''}
展開軸：${axis.expansionAxis || ''}
感情軸：${axis.emotionAxis || ''}
思考の型：${art.thinkingPattern || ''}
読者視点：${art.readerPerspective || ''}
学びの核心（1文）：${art.soulSentence || ''}
タイトルキーワード（配列）：${JSON.stringify(mgmt.titleKeywords || [])}

【チェック項目】
・タイトルキーワードの重複（部分一致含む）
・展開軸の重複
・感情軸の重複
・思考の型の重複
・読者視点の重複
・学びの核心が70%以上類似しているもの
・失敗パターンとの軸の組み合わせ一致
・絶対禁止フラグとの一致（最優先でNG）

【判定基準】
・絶対禁止フラグと一致 → 即NG（理由を明記。修正案の提示不要）
・完全一致 → NG（使用禁止）
・類似70%以上 → 要修正（どこが近いかを明示）
・失敗パターンと一致（絶対禁止以外） → 要修正（理由を明記）
・問題なし → OK

【出力形式】必ず1行目を以下3つのどれか：「判定：OK」「判定：NG」「判定：要修正」
2行目以降：理由（被っている記事タイトルと箇所を具体的に）
要修正の場合のみ末尾：修正案`;

  try {
    const text = await _wfGeminiSend(prompt, { temperature: 0.2, maxOutputTokens: 1200 });
    const isOK  = text.includes('判定：OK')   || text.includes('判定: OK');
    const isNG  = text.includes('判定：NG')   || text.includes('判定: NG');
    const isMod = text.includes('判定：要修正') || text.includes('判定: 要修正');

    let bgColor = 'rgba(130,130,130,.08)', borderColor = 'var(--border)', badge = '';
    if (isOK) {
      bgColor = 'rgba(74,136,56,.08)'; borderColor = 'var(--green)'; badge = '✅ ';
      const tasks2 = _wfLoadTasks(_wfNoteId);
      WF_STEPS[2].tasks.forEach(function(_, ti) { tasks2['2_' + ti] = true; });
      _wfSaveTasks(_wfNoteId, tasks2);
      n.workflowState = WF_STEP_STATES[2];
      save();
      setTimeout(function() { _wfRefreshUI(); toast('✅ STEP3 被りチェックOK - 自動完了しました'); }, 600);
    } else if (isNG || isMod) {
      bgColor = isNG ? 'rgba(180,50,50,.08)' : 'rgba(180,100,20,.08)';
      borderColor = isNG ? '#c84646' : 'var(--orange,#b45309)';
      badge = isNG ? '❌ ' : '⚠️ ';
      // 失敗パターンに自動登録
      if (!n.article) n.article = {};
      n.article.overlapRetries = (n.article.overlapRetries || 0) + 1;
      const fpList = getFailurePatterns();
      const axis2 = (n.axis && typeof n.axis === 'object') ? n.axis : {};
      const art2 = n.article || {};
      fpList.push({
        id: 'fp_' + Date.now(),
        タイトル: '[被りチェック' + (isNG ? 'NG' : '要修正') + '] ' + (n.title || ''),
        内容: text.slice(0, 300),
        対策: '記事候補の軸・キーワードを見直す',
        date: new Date().toISOString().slice(0, 10),
        expansionAxis: axis2.expansionAxis || '',
        emotionAxis: axis2.emotionAxis || '',
        thinkingPattern: art2.thinkingPattern || '',
        棚卸し済み: false
      });
      _saveFailurePatterns(fpList);
      if (n.article.overlapRetries >= 3) {
        alert('⚠️ 被りチェックが3回連続で' + (isNG ? 'NG' : '要修正') + 'です。\nこの記事候補の軸・キーワードを根本的に見直してください。');
      }
    }
    if (resultEl) resultEl.innerHTML = '<div style="white-space:pre-wrap;font-size:12px;background:' + bgColor + ';border:1px solid ' + borderColor + ';border-radius:8px;padding:10px;line-height:1.6">' + badge + _escHtml(text) + '</div>';
  } catch(e) {
    if (resultEl) resultEl.innerHTML = '<div style="color:#c84646;font-size:12px;padding:8px 0">❌ エラー: ' + _escHtml(e.message) + '</div>';
    toast('Gemini送信エラー: ' + e.message);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '🤖 Geminiに自動送信'; }
  }
}

// ----------------------------------------------------------------
// STEP4フェーズ1: 骨子送信・OK/差し戻しゲート
// ----------------------------------------------------------------
async function wfStep4BoneSend() {
  const n = S.notes.find(x => x.id === _wfNoteId);
  if (!n) { toast('記事が見つかりません'); return; }

  const btn = _wfEl('bone-send-btn');
  const resultEl = _wfEl('bone-result');
  if (btn) { btn.disabled = true; btn.textContent = '送信中...'; }
  if (resultEl) resultEl.innerHTML = '<div style="color:var(--text3);font-size:12px;padding:8px 0">⏳ Geminiに骨子チェックを送信中...</div>';

  const axis = (n.axis && typeof n.axis === 'object') ? n.axis : {};
  const art = n.article || {};
  const con = n.concept || {};
  const mgmt = n.management || {};
  const failures = getFailurePatterns().filter(function(x) { return !x.棚卸し済み; })
    .map(function(x) { return x.タイトル + '：' + x.内容; }).join('\n');

  const prompt = `【骨子チェック依頼（①〜④）】

以下の記事候補の骨子が成立しているか確認してください。

【記事候補情報】
タイトル：${n.title || ''}
展開軸：${axis.expansionAxis || ''}
感情軸：${axis.emotionAxis || ''}
思考の型：${art.thinkingPattern || ''}
読者視点：${art.readerPerspective || ''}
崩すべき前提認識：${art.readerBeliefToBreak || con.readerBeliefToBreak || ''}
読了後の変化：${art.readerChangeAfterReading || con.readerChangeAfterReading || ''}
学びの核心（1文）：${art.soulSentence || ''}
パペリサーチ結果概要：${(mgmt.papeResult || '').slice(0, 600)}

【失敗パターン（棚卸し済みを除く）】
${failures || 'なし'}

【骨子チェック4点】
① 流れの一貫性：展開軸と感情軸に沿った論理構造が成立しているか
② 被りチェック：直近記事との読後感触の差分が十分にあるか
③ 着地：読了後の変化が記事の論理で達成できるか
④ 失敗パターン一致：絶対禁止フラグとの照合結果

【出力形式】
各項目を①〜④で番号付きで評価し、最後に「骨子：OK」または「骨子：差し戻し」を1行で出力してください。`;

  try {
    const text = await _wfGeminiSend(prompt, { temperature: 0.3, maxOutputTokens: 2000 });
    if (!n.article) n.article = {};
    n.article.jimmyBoneResult = { result: text, sentAt: new Date().toISOString() };
    n.article.jimmyBoneOK = false;
    save();
    _wfRefreshUI();
    toast('✅ 骨子チェック完了 - 内容を確認してください');
  } catch(e) {
    if (resultEl) resultEl.innerHTML = '<div style="color:#c84646;font-size:12px;padding:8px 0">❌ エラー: ' + _escHtml(e.message) + '</div>';
    toast('Gemini送信エラー: ' + e.message);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '🤖 骨子をGeminiに送る'; }
  }
}

function wfStep4BoneOK() {
  const n = S.notes.find(x => x.id === _wfNoteId);
  if (!n || !n.article) return;
  n.article.jimmyBoneOK = true;
  save();
  _wfRefreshUI();
  toast('✅ 骨子OK - 詳細設計フェーズへ進みます');
}

function wfStep4BoneReject() {
  const n = S.notes.find(x => x.id === _wfNoteId);
  if (!n) return;
  if (!n.article) n.article = {};
  n.article.boneRetries = (n.article.boneRetries || 0) + 1;
  const bone = n.article.jimmyBoneResult;
  // 失敗パターンに自動登録
  const fpList = getFailurePatterns();
  const axis = (n.axis && typeof n.axis === 'object') ? n.axis : {};
  fpList.push({
    id: 'fp_' + Date.now(),
    タイトル: '[骨子差し戻し×' + n.article.boneRetries + '] ' + (n.title || ''),
    内容: bone ? bone.result.slice(0, 300) : '骨子差し戻し',
    対策: '骨子の論理構造・着地設計を見直す',
    date: new Date().toISOString().slice(0, 10),
    expansionAxis: axis.expansionAxis || '',
    emotionAxis: axis.emotionAxis || '',
    thinkingPattern: n.article.thinkingPattern || '',
    棚卸し済み: false
  });
  _saveFailurePatterns(fpList);
  // 骨子結果をリセット（再送できるように）
  n.article.jimmyBoneResult = null;
  n.article.jimmyBoneOK = false;
  save();
  if (n.article.boneRetries >= 3) {
    alert('⚠️ 骨子差し戻しが3回に達しました。\nこの記事候補の軸・構成を根本的に見直してください。');
  }
  _wfRefreshUI();
  toast('差し戻しを記録しました（' + n.article.boneRetries + '回目）');
}

// ----------------------------------------------------------------
// STEP4フェーズ2: 詳細設計（⑤〜⑬）送信・派生候補自動登録
// ----------------------------------------------------------------
async function wfStep4MaterialSend() {
  const n = S.notes.find(x => x.id === _wfNoteId);
  if (!n) { toast('記事が見つかりません'); return; }

  const btn = _wfEl('material-send-btn');
  const resultEl = _wfEl('material-result');
  if (btn) { btn.disabled = true; btn.textContent = '送信中...'; }
  if (resultEl) resultEl.innerHTML = '<div style="color:var(--text3);font-size:12px;padding:8px 0">⏳ Geminiに詳細設計を送信中...</div>';

  const axis = (n.axis && typeof n.axis === 'object') ? n.axis : {};
  const art = n.article || {};
  const con = n.concept || {};
  const mgmt = n.management || {};
  const boneText = art.jimmyBoneResult ? art.jimmyBoneResult.result : '';

  const prompt = `【詳細設計依頼（⑤〜⑬）＋派生候補JSON生成】

骨子チェック通過済みの記事候補について、詳細設計と派生候補を出力してください。

【記事候補情報】
タイトル：${n.title || ''}
展開軸：${axis.expansionAxis || ''}
感情軸：${axis.emotionAxis || ''}
思考の型：${art.thinkingPattern || ''}
読者視点：${art.readerPerspective || ''}
崩すべき前提認識：${art.readerBeliefToBreak || con.readerBeliefToBreak || ''}
読了後の変化：${art.readerChangeAfterReading || con.readerChangeAfterReading || ''}
学びの核心（1文）：${art.soulSentence || ''}
パペリサーチ結果：${(mgmt.papeResult || '').slice(0, 800)}

【骨子チェック結果】
${boneText}

【詳細設計（⑤〜⑬）】
⑤ 見出し構成案（H2×3〜5本）
⑥ 各H2の内容要約（2〜3文）
⑦ リード文の方向性（読者の悩みへの共感から入る）
⑧ 結論・まとめの方向性
⑨ 次回伏線（次の記事への布石として使えるフレーズ）
⑩ 2本先への種まき（今回触れておくべき小ネタ）
⑪ シリーズ可能性（シリーズ名案・順番の提案）
⑫ 執筆上の注意点（失敗パターンを踏まえた禁止事項）
⑬ タイトル案×3（SEO意識、感情軸を反映）

【派生候補JSON（必須）】
詳細設計の後、必ず以下の形式でJSON配列を出力してください（コードブロックで囲む）：
\`\`\`json
[
  {
    "title": "派生記事タイトル",
    "axis": { "expansionAxis": "", "emotionAxis": "" },
    "concept": { "readerBeliefToBreak": "", "readerChangeAfterReading": "" },
    "article": { "thinkingPattern": "", "readerPerspective": "", "soulSentence": "" },
    "research": { "researchPrompt": "" }
  }
]
\`\`\`
派生候補は2〜3件生成してください。`;

  try {
    const text = await _wfGeminiSend(prompt, { temperature: 0.7, maxOutputTokens: 8192 });
    if (!n.article) n.article = {};
    n.article.jimmyMaterial = { result: text, sentAt: new Date().toISOString() };
    n.workflowState = WF_STEP_STATES[4];
    const tasks = _wfLoadTasks(_wfNoteId);
    WF_STEPS[4].tasks.forEach(function(_, ti) { tasks['4_' + ti] = true; });
    _wfSaveTasks(_wfNoteId, tasks);
    save();
    _wfAutoRegisterDerived(text, n);
    _wfRefreshUI();
    toast('✅ 詳細設計完了 - STEP5自動更新・派生候補を登録しました');
  } catch(e) {
    if (resultEl) resultEl.innerHTML = '<div style="color:#c84646;font-size:12px;padding:8px 0">❌ エラー: ' + _escHtml(e.message) + '</div>';
    toast('Gemini送信エラー: ' + e.message);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '🤖 詳細設計をGeminiに送る'; }
  }
}

function _wfAutoRegisterDerived(text, parentNote) {
  const match = text.match(/```json\s*([\s\S]*?)```/);
  if (!match) return;
  let derived;
  try { derived = JSON.parse(match[1].trim()); } catch { return; }
  if (!Array.isArray(derived) || derived.length === 0) return;
  if (!S.notes) S.notes = [];
  const added = [];
  derived.forEach(function(d) {
    if (!d.title) return;
    const newNote = Object.assign({
      id: 'note_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
      title: d.title,
      status: 'idea',
      workflowState: '',
      createdAt: new Date().toISOString(),
      derivedFrom: parentNote ? (parentNote.id || '') : ''
    }, {
      axis: d.axis || {},
      concept: d.concept || {},
      article: d.article || {},
      research: d.research || {},
      management: {}
    });
    S.notes.push(newNote);
    added.push(d.title);
  });
  if (added.length > 0) {
    save();
    renderNotes();
    toast('📦 派生候補を' + added.length + '件登録しました');
  }
}

// ----------------------------------------------------------------
// STEP5: 記事制作完了ボタン
// ----------------------------------------------------------------
function wfStep6Complete() {
  const n = S.notes.find(x => x.id === _wfNoteId);
  if (!n) { toast('記事が見つかりません'); return; }
  if (!confirm('記事制作完了としてマークしますか？\n公開記事サマリーに自動登録されます。')) return;
  if (!n.management) n.management = {};
  n.management.usageStatus = '使用済み';
  n.workflowState = WF_STEP_STATES[5];
  const tasks = _wfLoadTasks(_wfNoteId);
  WF_STEPS[5] && WF_STEPS[5].tasks.forEach(function(_, ti) { tasks['5_' + ti] = true; });
  _wfSaveTasks(_wfNoteId, tasks);
  S.weeklyReviewNeeded = true;
  save();
  _wfAutoRegisterPublished(_wfNoteId);
  renderNotes();
  if (typeof updateStats === 'function') updateStats();
  _wfRefreshUI();
  toast('✅ 記事制作完了 - 公開記事サマリーに登録しました');
}

// ----------------------------------------------------------------
// 差し戻し登録（失敗パターン事前入力）
// ----------------------------------------------------------------
function wfOpenFailure(si) {
  const n = S.notes.find(x => x.id === _wfNoteId);
  if (!n) return;
  const stepTitle = WF_STEPS[si] ? WF_STEPS[si].title : 'STEP' + (si + 1);
  const axis = (n.axis && typeof n.axis === 'object') ? n.axis : {};
  const art = n.article || {};
  document.getElementById('fp-modal-title').textContent = '差し戻し - 失敗パターン登録';
  document.getElementById('fp-edit-id').value = '';
  document.getElementById('fp-title').value = '[' + stepTitle + '] ' + (n.title || '');
  document.getElementById('fp-detail').value = '展開軸：' + (axis.expansionAxis || '') + '\n感情軸：' + (axis.emotionAxis || '') + '\n思考の型：' + (art.thinkingPattern || '');
  document.getElementById('fp-prevention').value = '';
  document.getElementById('fp-date').value = new Date().toISOString().slice(0, 10);
  document.getElementById('modal-workflow').classList.remove('open');
  openOverlay('modal-failurepattern');
}

// ----------------------------------------------------------------
// STEP6完了: 公開記事サマリーJSON自動登録
// ----------------------------------------------------------------
function _wfAutoRegisterPublished(noteId) {
  const n = S.notes.find(x => x.id === noteId);
  if (!n) return;
  const list = getPublishedArticles();
  const existing = list.findIndex(function(a) { return a.publishedTitle === n.title; });
  const axis = (n.axis && typeof n.axis === 'object') ? n.axis : {};
  const art = n.article || {};
  const mgmt = n.management || {};
  const con = n.concept || {};
  const entry = {
    publishedTitle:   n.title || '',
    titleKeywords:    mgmt.titleKeywords || [],
    expansionAxis:    axis.expansionAxis || '',
    emotionAxis:      axis.emotionAxis || '',
    thinkingPattern:  art.thinkingPattern || '',
    readerPerspective: art.readerPerspective || '',
    coreLearning:     art.soulSentence || con.coreProblem || '',
    publishedAt:      new Date().toISOString().slice(0, 10),
    headlineKeywords: { catch: '', main: '', sub: '' },
    humanTechUsed:    art.humanTechUsed || [],
  };
  if (existing >= 0) list[existing] = Object.assign({}, list[existing], entry);
  else list.unshift(entry);
  setPublishedArticles(list);
  if (n.status !== 'done') {
    n.status = 'done';
    save();
    renderNotes();
  }
  toast('✅ 公開記事サマリーJSONを自動登録 - ステータスを公開済みに更新しました');
}

// ================================================================
// トップダッシュボード
// ================================================================

let _topOpenStep = -1;

function _buildNiStepCard(n) {
  // 自動化パネル（Geminiボタン等） - IDをカード固有にスコープ
  let autoHtml = _renderWfAutoPanel(n);
  if (autoHtml) {
    autoHtml = autoHtml.replace(/\bid="wf-/g, `id="wf-${n.id}-`);
    autoHtml = autoHtml.replace(/onclick="(wf\w[^"]+)"/g, `onclick="_wfNoteId=${n.id};$1"`);
    // openWorkflowNav は _wfNoteId 不要なのでそのままでよいが、念のため付加
    autoHtml = autoHtml.replace(/onclick="openWorkflowNav\(([^)]+)\)"/g, `onclick="openWorkflowNav($1)"`);
  }
  return autoHtml || '';
}

function renderTopDashboard() {
  _renderTopCurrentArticle();
  _renderTopStatusCards();
  _renderTopWarnBanners();
  _renderTopTwoCol();
}

function _getUnusedCandidates() {
  return (S.notes || []).filter(n => !n.used && n.status !== 'done' && n.status !== 'archived');
}

function _renderTopCurrentArticle() {
  const area = document.getElementById('top-current-area');
  if (!area) return;
  const cnt = (S.notes || []).filter(n => n.status !== 'done' && n.status !== 'archived').length;
  if (cnt === 0) {
    area.innerHTML = '<div class="top-no-article">執筆中の記事がありません。記事候補を追加してSTEP1から始めましょう。</div>';
  } else {
    area.innerHTML = '<div class="top-no-article" style="color:var(--text3)">↓ 下の記事一覧から作業したい記事をクリックして選んでください</div>';
  }
}


function _renderTopStatusCards() {
  const area = document.getElementById('top-status-area');
  if (!area) return;

  const notes = S.notes || [];
  const unusedCnt = _getUnusedCandidates().length;
  const doneLast5 = notes.filter(n => n.status === 'done').slice(-5);
  const dirA = doneLast5.filter(n => n.type === 'A').length;
  const dirB = doneLast5.filter(n => n.type === 'B').length;
  const dirLabel = doneLast5.length === 0 ? '—' : (dirA >= dirB ? `A:${dirA} / B:${dirB}` : `B:${dirB} / A:${dirA}`);

  const lastReview = S.weeklyReviewTs || null;
  let weeklyLabel = '未実施';
  let weeklyDone = false;
  if (lastReview) {
    const d = new Date(lastReview);
    const now = new Date();
    const diffDays = Math.floor((now - d) / 86400000);
    if (diffDays < 7) {
      weeklyLabel = `${diffDays}日前`;
      weeklyDone = true;
    } else {
      weeklyLabel = `${diffDays}日前（要実施）`;
    }
  }

  area.innerHTML = `<div class="top-status-grid">
  <div class="top-stat-card">
    <div class="top-stat-num" id="dash-stock-num2">${unusedCnt}</div>
    <div class="top-stat-label">📦 記事候補ストック</div>
    <div class="top-stat-sub">未使用の候補数</div>
  </div>
  <div class="top-stat-card">
    <div class="top-stat-num" style="font-size:24px;margin-top:4px">${dirLabel}</div>
    <div class="top-stat-label">📊 A/B方向バランス</div>
    <div class="top-stat-sub">直近5記事の展開軸比率</div>
  </div>
  <div class="top-stat-card" style="cursor:pointer" onclick="markWeeklyReview()">
    <div class="top-stat-num" style="font-size:20px;margin-top:6px;color:${weeklyDone ? 'var(--green)' : 'var(--orange)'}">${weeklyLabel}</div>
    <div class="top-stat-label">🔄 週次レビュー</div>
    <div class="top-stat-sub">${weeklyDone ? '良好' : 'タップで記録'}</div>
  </div>
</div>`;
}

function markWeeklyReview() {
  S.weeklyReviewTs = new Date().toISOString(); save();
  _renderTopStatusCards();
}

function _renderTopWarnBanners() {
  const area = document.getElementById('top-warn-area');
  if (!area) return;

  const banners = [];
  const unusedCnt = _getUnusedCandidates().length;

  if (unusedCnt === 0) {
    banners.push({ cls: 'red', text: '⚠️ 記事候補がありません。リサーチからSTEP1を始めましょう。' });
  } else if (unusedCnt <= 2) {
    banners.push({ cls: 'orange', text: `⚡ 記事候補が残り${unusedCnt}件です。補充を検討してください。` });
  }

  const lastReview = S.weeklyReviewTs || null;
  const needsReview = S.weeklyReviewNeeded || !lastReview ||
    Math.floor((new Date() - new Date(lastReview)) / 86400000) >= 7;
  if (needsReview) {
    const diffDays = lastReview ? Math.floor((new Date() - new Date(lastReview)) / 86400000) : null;
    const msg = lastReview
      ? `🔄 週次レビューが${diffDays}日間未実施です。`
      : '🔄 週次レビューがまだ実施されていません。';
    banners.push({
      cls: 'orange',
      text: msg,
      btn: '<button onclick="runWeeklyReview()" style="margin-left:10px;font-size:11px;padding:3px 10px;border-radius:6px;border:none;background:var(--orange,#b45309);color:#fff;cursor:pointer;font-family:inherit">🤖 週次レビューを自動実行</button>'
    });
  }

  if (banners.length === 0) {
    banners.push({ cls: 'green', text: '✅ 現在の進行状況は良好です。引き続き執筆を進めましょう！' });
  }

  area.innerHTML = banners.map(b =>
    `<div class="top-warn-banner ${b.cls}">${b.text}${b.btn || ''}</div>`
  ).join('');

  // 週次レビュー結果エリアを描画
  _renderWeeklyReviewArea();
}

function _renderWeeklyReviewArea() {
  const area = document.getElementById('weekly-review-area');
  if (!area) return;
  const reviews = S.weeklyReviews || [];
  if (reviews.length === 0) { area.innerHTML = ''; return; }
  const latest = reviews[reviews.length - 1];
  area.innerHTML = `<div style="background:var(--bg3);border:1px solid var(--border);border-radius:10px;padding:12px;margin-bottom:8px">
    <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:6px">📋 最新週次レビュー（${latest.date || ''}）</div>
    <pre style="white-space:pre-wrap;font-size:11px;color:var(--text2);line-height:1.6;max-height:200px;overflow-y:auto;margin:0">${_escHtml(latest.result || '')}</pre>
  </div>`;
}

async function runWeeklyReview() {
  const btn = document.querySelector('[onclick="runWeeklyReview()"]');
  if (btn) { btn.disabled = true; btn.textContent = '実行中...'; }

  const published = getPublishedArticles().slice(-20).map(a => ({
    title: a.publishedTitle, expansionAxis: a.expansionAxis, emotionAxis: a.emotionAxis,
    thinkingPattern: a.thinkingPattern, readerPerspective: a.readerPerspective
  }));
  const failures = getFailurePatterns().filter(x => !x.棚卸し済み).map(x => ({
    タイトル: x.タイトル, 内容: x.内容, 絶対禁止: !!x.絶対禁止
  }));
  const unused = _getUnusedCandidates().map(n => ({ title: n.title, workflowState: n.workflowState || '未着手' }));
  const inProgress = (S.notes || []).filter(n => n.workflowState && n.workflowState !== WF_STEP_STATES[5])
    .map(n => ({ title: n.title, state: n.workflowState }));
  const lastReview = S.weeklyReviewTs;
  const lastReviewDays = lastReview ? Math.floor((new Date() - new Date(lastReview)) / 86400000) : null;

  const prompt = `【週次レビュー自動チェック】

以下のnabebaseのデータを分析して、週次レビューの14項目をチェックしてください。

【公開済み記事（直近20件）】
${JSON.stringify(published, null, 2)}

【失敗パターン（棚卸し済みを除く）】
${JSON.stringify(failures, null, 2)}

【未使用候補一覧】
${JSON.stringify(unused, null, 2)}

【進行中記事】
${JSON.stringify(inProgress, null, 2)}

【最終レビューから${lastReviewDays !== null ? lastReviewDays + '日' : '初回'}】

【チェック項目（必ず全14項目を番号付きで出力）】
① 使用済み記事の展開軸・感情軸・思考の型・視点を一覧出力
② 直近3本で同じ組み合わせがあるか確認（あれば即ネタ出し推奨）
③ パペへのリサーチプロンプトの型・視点が類似していないか
④ 「次回伏線」が次の候補に反映されているか
⑤ 「2本先への種まき」が2本先の候補に反映されているか
⑥ ジミー生成の派生候補JSONが登録済みか
⑦ 未使用候補の総数（5本未満なら即ネタ出し推奨）
⑧ 直近5本の公開記事の方向A・B比率（3本以上偏り→報告）
⑨ 棚卸しログの月1回サイクルが守られているか
⑩ 進行中シリーズのシリーズ順番の連続性
⑪ 失敗パターンの件数（同パターン2件以上→絶対禁止フラグ更新を推奨）
⑫ 記録日から6ヶ月超の失敗パターン（棚卸し済みフラグ設定を推奨）
⑬ 進行状態が14日以上同じSTEPで止まっている記事候補を検出
⑭ 成功パターンの信頼度スコア更新状況

各項目を①〜⑭で番号付きで出力し、最後に「今週の優先アクション（3つ以内）」をまとめてください。`;

  try {
    const text = await _wfGeminiSend(prompt, { temperature: 0.3, maxOutputTokens: 4096 });
    if (!S.weeklyReviews) S.weeklyReviews = [];
    S.weeklyReviews.push({ date: new Date().toISOString().slice(0, 10), result: text });
    S.weeklyReviewTs = new Date().toISOString();
    S.weeklyReviewNeeded = false;
    save();
    renderTopDashboard();
    toast('✅ 週次レビューを自動実行・保存しました');
  } catch(e) {
    toast('週次レビューエラー: ' + e.message);
  } finally {
    _renderTopWarnBanners();
  }
}

function _renderTopTwoCol() {
  const area = document.getElementById('top-two-col-area');
  if (!area) return;

  const candidates = _getUnusedCandidates().slice(0, 3);
  const candHtml = candidates.length > 0
    ? candidates.map(n => `<div class="top-cand-item"><span style="color:var(--text3);margin-right:6px">📌</span>${_wfEsc(n.title || '（タイトル未設定）')}</div>`).join('')
    : '<div style="font-size:12px;color:var(--text3);padding:8px 0">候補がありません</div>';

  const posts = (typeof getPublishedPosts === 'function' ? getPublishedPosts() : []).slice(0, 3);
  const postsHtml = posts.length > 0
    ? posts.map(p => `<div class="top-xpost-item"><div style="font-size:11px;color:var(--text3)">${p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('ja-JP') : ''}</div><div>${_wfEsc(p.postSummary || '')}</div></div>`).join('')
    : '<div style="font-size:12px;color:var(--text3);padding:8px 0">投稿記録がありません</div>';

  area.innerHTML = `<div class="top-two-col">
  <div class="top-col-card">
    <div class="top-col-title">📦 記事候補ストック（直近3件）</div>
    ${candHtml}
    <span class="top-more-link" onclick="document.querySelector('[data-sec=tools]')?.click()">すべて見る →</span>
  </div>
  <div class="top-col-card">
    <div class="top-col-title">🐦 X投稿記録（直近3件）</div>
    ${postsHtml}
    <span class="top-more-link" onclick="document.querySelector('[data-sec=xposts]')?.click()">すべて見る →</span>
  </div>
</div>`;
}

// ================================================================
// 被りチェック
// ================================================================

function _buildOverlapBtn(n) {
  const ws = n.workflowState || '';
  if (!ws) return '';
  if (ws.includes('STEP2')) {
    return `<div style="margin-top:8px">
      <button id="overlap-btn-${n.id}" class="ni-action-btn"
        style="background:rgba(66,133,244,.12);color:#4285f4;border-color:rgba(66,133,244,.35)"
        onclick="event.stopPropagation();runOverlapCheck(${n.id},this)">🔍 被りチェック</button>
    </div>`;
  }
  if (['STEP3','STEP4','STEP5','STEP6'].some(s => ws.includes(s))) {
    return `<div style="margin-top:8px">
      <button class="ni-action-btn" disabled
        style="background:var(--bg4);color:var(--text3);border-color:var(--border);cursor:default;opacity:.6">✅ チェック済み</button>
    </div>`;
  }
  return '';
}

async function runOverlapCheck(noteId, btn) {
  const n = S.notes.find(x => x.id === noteId);
  if (!n) return;

  const apiKey = localStorage.getItem(GEMINI_KEY_STORAGE) || '';
  if (!apiKey) {
    _setOverlapResult(noteId, '<div style="color:var(--orange);font-size:12px;padding:8px 0">⚠️ 設定画面からGemini APIキーを登録してください</div>');
    return;
  }

  btn.textContent = '🔍 チェック中...';
  btn.disabled = true;

  const published = getPublishedArticles()
    .sort((a, b) => (b.publishedAt || '') > (a.publishedAt || '') ? 1 : -1)
    .slice(0, 30);
  const failures = JSON.parse(localStorage.getItem(FAILURE_PATTERNS_KEY) || '[]');

  const axis = (typeof n.axis === 'object' && n.axis) ? n.axis : {};
  const art = n.article || {};
  const concept = n.concept || {};

  const prompt = `以下の公開済み記事・失敗パターンを参照して、新規候補との被りをチェックしてください。

【公開済み記事（直近30件）】
${JSON.stringify(published)}

【失敗パターン（全件）】
${JSON.stringify(failures)}

【チェック対象の新規候補】
タイトル：${n.title || ''}
タイトルキーワード：なし
展開軸：${axis.expansionAxis || ''}
感情軸：${axis.emotionAxis || ''}
思考の型：${art.thinkingPattern || ''}
読者視点：${art.readerPerspective || ''}
学びの核心：${concept.coreProblem || ''}

【チェック項目】
・タイトルキーワードの重複（部分一致含む）
・展開軸・感情軸・思考の型・読者視点の重複
・学びの核心が70%以上類似しているもの
・絶対禁止フラグが「絶対禁止」の失敗パターンとの一致

【判定基準と出力形式】
必ず以下の形式で出力してください。1行目は必ずこの3つのどれか：
「判定：OK」「判定：NG」「判定：要修正」
2行目以降：理由（被っている記事タイトルと箇所を具体的に）
要修正の場合のみ末尾に：修正案（変更すべき軸とその候補を提示）`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 800 }
        })
      }
    );

    if (res.status === 429) {
      _setOverlapResult(noteId, '<div style="color:var(--orange);font-size:12px;padding:8px 0">⚠️ リクエスト上限に達しました。1分後に再試行してください</div>');
      btn.textContent = '🔍 被りチェック';
      btn.disabled = false;
      return;
    }
    if (!res.ok) {
      _setOverlapResult(noteId, `<div style="color:#c84646;font-size:12px;padding:8px 0">❌ APIエラー（${res.status}）。Gemini APIキーと通信状態を確認してください</div>`);
      btn.textContent = '🔍 被りチェック';
      btn.disabled = false;
      return;
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('parse failed');

    let bgColor = 'rgba(130,130,130,.08)';
    let borderColor = 'var(--border)';
    let isOk = false;
    if (text.includes('判定：OK')) {
      bgColor = 'rgba(58,102,80,.1)'; borderColor = 'rgba(58,102,80,.35)'; isOk = true;
    } else if (text.includes('判定：NG')) {
      bgColor = 'rgba(200,70,70,.1)'; borderColor = 'rgba(200,70,70,.35)';
    } else if (text.includes('判定：要修正')) {
      bgColor = 'rgba(230,180,0,.08)'; borderColor = 'rgba(230,180,0,.4)';
    }

    const okBtn = isOk
      ? `<button onclick="event.stopPropagation();applyOverlapOK(${noteId},this)" style="margin-top:10px;padding:6px 14px;background:var(--accent);border:none;border-radius:8px;color:#fff;font-weight:700;font-size:12px;cursor:pointer;font-family:inherit">✅ OKとして進行状態を更新する</button>`
      : '';

    const resultHtml = `<div style="padding:10px 12px;border-radius:10px;border:1px solid ${borderColor};background:${bgColor};margin-top:0">
      <div style="font-size:12px;color:var(--text);line-height:1.7;white-space:pre-wrap">${_wfEsc(text)}</div>
      ${okBtn}
    </div>`;

    _overlapResults[noteId] = resultHtml;
    const resultEl = document.getElementById('overlap-result-' + noteId);
    if (resultEl) resultEl.innerHTML = resultHtml;

    btn.textContent = '🔄 再チェック';
    btn.disabled = false;

  } catch(e) {
    _setOverlapResult(noteId, '<div style="color:#c84646;font-size:12px;padding:8px 0">❌ レスポンスの解析に失敗しました。再試行してください</div>');
    btn.textContent = '🔍 被りチェック';
    btn.disabled = false;
  }
}

function _setOverlapResult(noteId, html) {
  _overlapResults[noteId] = html;
  const el = document.getElementById('overlap-result-' + noteId);
  if (el) el.innerHTML = html;
}

function applyOverlapOK(noteId, btn) {
  const n = S.notes.find(x => x.id === noteId);
  if (!n) return;
  n.workflowState = 'STEP3ジミー被りチェックOK';
  save();
  btn.textContent = '✅ 更新しました';
  btn.disabled = true;
  delete _overlapResults[noteId];
  renderNotes();
}

