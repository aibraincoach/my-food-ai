// Local real-app regression check. Camera stream/readiness are synthetic;
// image decoding, the barcode reader, buttons and upload-draft path are real.
// Filechooser empty selection emulates cancellation. Never target production.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const { APP_URL: app, BARCODE_UNREAD_CHECK_OUT: out, BARCODE_CHECK_ENGINE: name, TEST_SESSION_FILE: sessionFile, MFA_PLAYWRIGHT_MODULE: browserModule, BARCODE_NO_CODE_FILE: fixtureFile, BARCODE_CHECK_LABEL: label = 'run' } = process.env;
if (process.env.MFA_TEST_DISPOSABLE !== '1' || !app || !['127.0.0.1', 'localhost'].includes(new URL(app).hostname) || !out || !sessionFile || !browserModule || !fixtureFile || !['webkit', 'chromium'].includes(name))
    throw Error('Disposable loopback app, fresh output, engine, session, browser module and synthetic no-code photo required.');
await fs.mkdir(out);
const { webkit, chromium, devices } = await import(browserModule), session = JSON.parse(await fs.readFile(sessionFile, 'utf8'));
let currentPage, context, browser;
const records = { label, name, requests: [], reservations: [], errors: [] };
try {
    browser = await (name === 'webkit' ? webkit : chromium).launch(name === 'chromium' ? { executablePath: process.env.TEST_CHROMIUM_EXECUTABLE, args: ['--no-sandbox'] } : {});
    context = await browser.newContext({ ...devices['iPhone 13'], viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, timezoneId: 'UTC', serviceWorkers: 'block' });
    await context.addCookies(session.cookie.split('; ').map(part => { const i = part.indexOf('='); return { name: part.slice(0, i), value: part.slice(i + 1), url: app }; }).filter(c => c.name !== 'time-zone').concat([{ name: 'time-zone', value: 'UTC', url: app }]));
    await context.addInitScript(() => { window.__unreadProbe = { opens: 0, notice: null }; localStorage.setItem('mfa-camera-mode', 'app'); Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia: async () => { window.__unreadProbe.opens++; return new MediaStream(); }, enumerateDevices: async () => [] } }); for (const [k, v] of Object.entries({ videoWidth: 800, videoHeight: 500, readyState: 4 }))
        Object.defineProperty(HTMLVideoElement.prototype, k, { get: () => v }); HTMLMediaElement.prototype.play = () => Promise.resolve(); const draw = CanvasRenderingContext2D.prototype.drawImage; CanvasRenderingContext2D.prototype.drawImage = function (source, ...args) { if (source instanceof HTMLVideoElement) {
        this.fillStyle = 'white';
        this.fillRect(0, 0, this.canvas.width, this.canvas.height);
        return;
    } return draw.call(this, source, ...args); }; new MutationObserver(() => { if (!window.__unreadProbe.notice && document.body?.textContent.includes("We couldn't read a barcode from this photo."))
        window.__unreadProbe.notice = Date.now(); }).observe(document, { childList: true, subtree: true, characterData: true }); });
    const page = currentPage = await context.newPage();
    page.on('pageerror', e => records.errors.push(e.message));
    page.on('request', r => { const u = new URL(r.url()); if (!u.pathname.startsWith('/api/'))
        return; let operationId; try {
        const p = r.postDataJSON();
        operationId = p?.operationId;
    }
    catch { } records.requests.push({ at: Date.now(), path: u.pathname, method: r.method(), operationId }); });
    page.on('response', async (r) => { if (new URL(r.url()).pathname === '/api/posts' && r.request().method() === 'POST') {
        try {
            const body = await r.json();
            records.reservations.push({ at: Date.now(), status: r.status(), postId: body.postId ?? body.id });
            await fs.writeFile(`${out}/${label}-${name}-partial.json`, JSON.stringify(records, null, 2));
        }
        catch { }
    } });
    await page.goto(app, { waitUntil: 'load', timeout: 30000 });
    await page.getByRole('button', { name: 'Post a meal', exact: true }).click();
    await page.getByRole('button', { name: 'Camera', exact: true }).click();
    await page.getByRole('tab', { name: 'Barcode', exact: true }).click();
    const pickedAt = Date.now();
    await page.locator('input[type=file]:not([capture])').setInputFiles({ name: 'no-barcode.jpg', mimeType: 'image/jpeg', buffer: await fs.readFile(fixtureFile) });
    const notice = page.getByText("We couldn't read a barcode from this photo.", { exact: true });
    try {
        await notice.waitFor({ timeout: 2200 });
        records.noticeVisible = true;
    }
    catch {
        records.noticeVisible = false;
    }
    records.noticeMs = await page.evaluate(pickedAt => window.__unreadProbe.notice ? window.__unreadProbe.notice - pickedAt : null, pickedAt);
    records.panel = await page.locator('section[aria-label="Scanned product"]').innerText();
    await page.screenshot({ path: `${out}/${label}-${name}-outcome.png` });
    if (records.noticeVisible) {
        records.reassurance = await page.getByText('Your photo is kept.', { exact: true }).isVisible();
        records.photoTabDisabled = await page.getByRole('tab', { name: 'Photo', exact: true }).isDisabled();
        const before = records.requests.filter(r => r.path === '/api/posts' && r.method === 'POST').length;
        const chooserPromise = page.waitForEvent('filechooser');
        await page.getByRole('button', { name: 'Choose another photo', exact: true }).click();
        const chooser = await chooserPromise;
        records.fileChooser = true;
        await chooser.setFiles([]);
        await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
        records.noticeAfterCancel = await notice.isVisible();
        records.noNewReservationOnCancel = records.requests.filter(r => r.path === '/api/posts' && r.method === 'POST').length === before;
        await page.screenshot({ path: `${out}/${label}-${name}-cancel.png` });
        await page.getByRole('button', { name: 'Back to camera', exact: true }).click();
        await page.getByText('Looking for a barcode…', { exact: true }).waitFor();
        await page.waitForFunction(() => window.__unreadProbe.opens >= 2 && Boolean(document.querySelector('video')?.srcObject), null, { timeout: 5000 });
        records.backToCamera = true;
        records.cameraOpens = await page.evaluate(() => window.__unreadProbe.opens);
        await page.getByRole('tab', { name: 'Photo', exact: true }).click();
        await page.waitForFunction(() => [...document.images].some(i => i.src.startsWith('blob:') && i.complete && i.naturalWidth > 0 && i.getBoundingClientRect().width > 0), null, { timeout: 5000 });
        records.photoKeptVisible = true;
        records.photoAfterBack = await page.evaluate(() => [...document.images].filter(i => i.src.startsWith('blob:')).map(i => ({ alt: i.alt, loaded: i.complete && i.naturalWidth > 0, width: i.getBoundingClientRect().width })));
        await page.screenshot({ path: `${out}/${label}-${name}-kept-photo.png` });
    }
    records.pass = Boolean(records.noticeVisible && records.reassurance && records.noticeMs <= 2000 && !records.panel.includes('Post this product') && records.photoTabDisabled && records.fileChooser && records.noticeAfterCancel && records.noNewReservationOnCancel && records.backToCamera && records.photoKeptVisible && !records.errors.length);
    await fs.writeFile(`${out}/${label}-${name}-results.json`, JSON.stringify(records, null, 2));
    console.log({ name, noticeMs: records.noticeMs, pass: records.pass, panel: records.panel, errors: records.errors });
    assert.ok(records.pass, 'Unread outcome and cancel/back/kept-photo controls must pass');
}
catch (error) {
    records.error = { message: error.message, stack: error.stack };
    await fs.writeFile(`${out}/${label}-${name}-error.json`, JSON.stringify(records, null, 2));
    if (currentPage && !currentPage.isClosed())
        await currentPage.screenshot({ path: `${out}/${label}-${name}-error.png` }).catch(() => { });
    throw error;
}
finally {
    if (context)
        await context.close().catch(error => { console.error('Context cleanup failed:', error.message); process.exitCode = 1; });
    if (browser)
        await browser.close().catch(error => { console.error('Browser cleanup failed:', error.message); process.exitCode = 1; });
    await fs.writeFile(`${out}/${label}-${name}-final.json`, JSON.stringify(records, null, 2));
}
