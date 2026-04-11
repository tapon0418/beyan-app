const puppeteer = require('puppeteer');
const path = require('path');
const FILE_URL = 'file:///' + path.resolve(__dirname, 'index.html').replace(/\\/g, '/');
const wait = ms => new Promise(r => setTimeout(r, ms));

async function run() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--allow-file-access-from-files'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(e.message));
  page.on('console', m => { if (m.type()==='error') pageErrors.push('[js] ' + m.text().substring(0,80)); });
  await page.goto(FILE_URL, { waitUntil: 'domcontentloaded' });
  await wait(600);

  let pass = 0, fail = 0;
  const ok = n => { console.log('  ok ' + n); pass++; };
  const ng = (n,r) => { console.error('  NG ' + n + ': ' + r); fail++; };

  // Theme checks
  const r = await page.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    return {
      accent: cs.getPropertyValue('--accent').trim(),
      text: cs.getPropertyValue('--text').trim(),
      orange: cs.getPropertyValue('--orange').trim(),
      bodyBgImg: getComputedStyle(document.body).backgroundImage,
    };
  });
  r.accent.includes('3a6650') ? ok('--accent green') : ng('--accent', r.accent);
  (r.text.includes('1a2e20') || r.text.includes('2a3828') || r.text.includes('2c2820')) ? ok('--text charcoal warm') : ng('--text', r.text);
  r.orange.includes('c07030') ? ok('--orange updated') : ng('--orange', r.orange);
  r.bodyBgImg.split('url(').length >= 4 ? ok('3 background layers') : ng('bg layers', 'got ' + (r.bodyBgImg.split('url(').length-1));

  // No horizontal scroll
  const bw = await page.evaluate(() => document.body.scrollWidth);
  bw <= 392 ? ok('no horizontal scroll') : ng('horizontal scroll', bw + 'px');

  // sec-today削除後: 3セクション確認
  const secs = await page.evaluate(() =>
    ['sec-notes','sec-xposts','sec-archive']
      .filter(id => !!document.getElementById(id)).length
  );
  secs === 3 ? ok('all 3 sections') : ng('sections', secs + '/3');

  // Note click opens modal (inject a dummy note then click action btn)
  const clickResult = await page.evaluate(() => {
    // inject a minimal note into app state so a card renders
    try {
      const dummy = { id:'test-001', title:'テスト記事', status:'research', createdAt: Date.now(), updatedAt: Date.now() };
      if (window.S && Array.isArray(window.S.notes) && window.S.notes.length === 0) {
        window.S.notes.push(dummy);
        if (typeof window.renderNotes === 'function') window.renderNotes();
      }
    } catch(e) {}
    const ni = document.querySelector('.ni-header');
    if (!ni) return 'no ni-header';
    ni.click();
    const actionBtn = document.querySelector('.ni-action-btn.primary');
    if (!actionBtn) return 'no action btn';
    actionBtn.click();
    const m = document.getElementById('modal-work');
    return m && m.classList.contains('open') ? 'opened' : 'not-opened';
  });
  clickResult === 'opened' ? ok('note click opens modal') : ng('note click', clickResult);

  // Modal has all expected elements (4-step flow: v3 layout)
  const missing = await page.evaluate(() => {
    const ids = ['mw-title','mw-status','mw-gemini','mw-chatgpt-wrap',
      'claude-result-section','mw-claude-output','claude-manual-panel',
      'claude-manual-input','mw-xedit',
      'fp-gemini','fp-chatgpt','fp-rakuten','fp-xgen'];
    return ids.filter(id => !document.getElementById(id));
  });
  missing.length === 0 ? ok('all modal elements exist') : ng('missing elements', missing.join(', '));

  // Close modal and check no errors
  await page.evaluate(() => { try { window.closeOverlay('modal-work'); } catch(e) {} });
  await wait(200);

  // JS errors
  pageErrors.length === 0 ? ok('no JS errors') : ng('JS errors', pageErrors.join(' | ').substring(0, 120));

  // btn-accent has gradient
  const btnStyle = await page.evaluate(() => {
    const btn = document.querySelector('.btn-accent');
    if (!btn) return 'no btn-accent';
    return getComputedStyle(btn).backgroundImage;
  });
  btnStyle.includes('gradient') ? ok('btn-accent has gradient') : ng('btn-accent gradient', btnStyle.substring(0, 60));

  // birch pattern in body (3 SVG layers)
  const birchCheck = await page.evaluate(() => {
    const bi = getComputedStyle(document.body).backgroundImage;
    return bi.split('url(').length - 1;
  });
  birchCheck >= 3 ? ok('birch+pine 3 bg layers') : ng('bg layers', birchCheck);

  await browser.close();
  console.log('\nResult: ok ' + pass + ' / NG ' + fail);
  process.exit(fail > 0 ? 1 : 0);
}
run().catch(e => { console.error('Fatal:', e); process.exit(1); });
