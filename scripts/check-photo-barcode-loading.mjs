// Disposable real-app check: synthetic camera/video, real barcode decoder.
// The caller supplies a synthetic EAN photo. Product lookup is stubbed only
// after first-decode timing, so routing cannot change that cold-cache result.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const { APP_URL: app, BARCODE_CHECK_OUT: out, TEST_SESSION_FILE: sessionFile, MFA_PLAYWRIGHT_MODULE: browserModule, BARCODE_BUILD_DIR: buildDir, BARCODE_PHOTO_FILE: eanFile, BARCODE_CHECK_LABEL: label = 'run', BARCODE_BASELINE_FILE: baselineFile } = process.env;
if (process.env.MFA_TEST_DISPOSABLE !== '1' || !app || !['127.0.0.1', 'localhost'].includes(new URL(app).hostname) || !out || !sessionFile || !browserModule || !buildDir || !eanFile)
    throw Error('Disposable loopback app, fresh output, session, browser module, build folder and synthetic EAN photo required.');
await fs.mkdir(out);
const { webkit, chromium, devices } = await import(browserModule), session = JSON.parse(await fs.readFile(sessionFile, 'utf8')), chunks = [];
for (const file of await fs.readdir(buildDir + '/static/chunks'))
    if (file.endsWith('.js') && (await fs.readFile(buildDir + '/static/chunks/' + file, 'utf8')).includes('RSS_14'))
        chunks.push(file);
assert.equal(chunks.length, 1, 'identify actual zxing library chunk, not capture wrapper');
const rows = [];
for (const name of ['webkit', 'chromium']) {
    const browser = await (name === 'webkit' ? webkit : chromium).launch(name === 'chromium' ? { executablePath: process.env.TEST_CHROMIUM_EXECUTABLE, args: ['--no-sandbox'] } : {});
    const context = await browser.newContext({ ...devices['iPhone 13'], viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, timezoneId: 'UTC', serviceWorkers: 'block' });
    try {
        await context.addCookies(session.cookie.split('; ').map(part => { const i = part.indexOf('='); return { name: part.slice(0, i), value: part.slice(i + 1), url: app }; }).filter(c => c.name !== 'time-zone').concat([{ name: 'time-zone', value: 'UTC', url: app }]));
        await context.addInitScript(() => { window.__barcodeProbe = { frames: [], tap: null, opens: 0 }; localStorage.setItem('mfa-camera-mode', 'app'); Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia: async () => { window.__barcodeProbe.opens++; return new MediaStream(); }, enumerateDevices: async () => [] } }); for (const [k, v] of Object.entries({ videoWidth: 800, videoHeight: 500, readyState: 4 }))
            Object.defineProperty(HTMLVideoElement.prototype, k, { get: () => v }); HTMLMediaElement.prototype.play = () => Promise.resolve(); const draw = CanvasRenderingContext2D.prototype.drawImage; CanvasRenderingContext2D.prototype.drawImage = function (source, ...args) { if (source instanceof HTMLVideoElement) {
            this.fillStyle = 'white';
            this.fillRect(0, 0, this.canvas.width, this.canvas.height);
            return;
        } return draw.call(this, source, ...args); }; const pixels = CanvasRenderingContext2D.prototype.getImageData; CanvasRenderingContext2D.prototype.getImageData = function (...args) { const data = pixels.apply(this, args); if (window.__barcodeProbe.tap !== null && !window.__barcodeProbe.frames.length) {
            const row = { start: performance.now(), end: null };
            window.__barcodeProbe.frames.push(row);
            queueMicrotask(() => row.end = performance.now());
        } return data; }; document.addEventListener('click', e => { const button = e.target.closest?.('[role="tab"]'); if (button?.textContent.trim() === 'Barcode')
            window.__barcodeProbe.tap = performance.now(); }, true); });
        const page = await context.newPage(), requests = [], errors = [];
        let stage = 'home';
        page.on('pageerror', e => errors.push(e.message));
        page.on('request', r => { const u = new URL(r.url()); requests.push({ at: Date.now(), stage, path: u.pathname, type: r.resourceType() }); });
        await page.goto(app, { waitUntil: 'load', timeout: 30000 });
        await page.getByRole('button', { name: 'Post a meal', exact: true }).click();
        stage = 'photo';
        await page.getByRole('button', { name: 'Camera', exact: true }).click();
        await page.getByRole('tab', { name: 'Photo', exact: true }).waitFor();
        await page.waitForFunction(() => document.querySelector('video')?.readyState === 4, null, { timeout: 10000 });
        await page.waitForTimeout(500);
        const photo = await page.evaluate(() => ({ at: performance.now(), resources: performance.getEntriesByType('resource').map(r => ({ path: new URL(r.name).pathname, start: r.startTime, end: r.responseEnd, bytes: r.encodedBodySize, transfer: r.transferSize })), probe: window.__barcodeProbe }));
        stage = 'barcode';
        await page.getByRole('tab', { name: 'Barcode', exact: true }).click();
        await page.waitForFunction(() => window.__barcodeProbe.frames[0]?.end !== null && window.__barcodeProbe.frames.length > 0, null, { timeout: 15000 });
        const timing = await page.evaluate(() => ({ tap: window.__barcodeProbe.tap, frame: window.__barcodeProbe.frames[0], opens: window.__barcodeProbe.opens }));
        await page.screenshot({ path: `${out}/${label}-${name}-barcode.png` });
        stage = 'ean-photo';
        await context.route('**/api/fdc/barcode?*', route => route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ error: 'Synthetic missing barcode' }) }));
        await page.getByRole('tab', { name: 'Photo', exact: true }).click();
        await page.locator('input[type=file]:not([capture])').setInputFiles({ name: 'ean-photo.jpg', mimeType: 'image/jpeg', buffer: await fs.readFile(eanFile) });
        await page.waitForTimeout(1300);
        const text = await page.locator('body').innerText(), kept = await page.evaluate(() => ({ photos: [...document.images].filter(i => i.alt === 'Selected meal' && i.complete && i.naturalWidth > 0).length, blobImages: [...document.images].filter(i => i.src.startsWith('blob:') && i.complete && i.naturalWidth > 0).map(i => ({ alt: i.alt, width: i.naturalWidth })), caption: Boolean(document.querySelector('#capture-caption')) }));
        await page.screenshot({ path: `${out}/${label}-${name}-ean-photo.png` });
        rows.push({ label, name, chunks, photo, timing, T: timing.frame.start - timing.tap, decodeEndT: timing.frame.end - timing.tap, kept, text, requests, errors, photoDecoderRequests: requests.filter(r => r.stage === 'photo' && chunks.some(c => r.path.endsWith('/' + c))), eanLookup: requests.filter(r => r.stage === 'ean-photo' && r.path === '/api/fdc/barcode'), allResources: await page.evaluate(() => performance.getEntriesByType('resource').map(r => ({ path: new URL(r.name).pathname, start: r.startTime, end: r.responseEnd, encodedBytes: r.encodedBodySize, transfer: r.transferSize }))) });
        await fs.writeFile(`${out}/${label}-results.json`, JSON.stringify(rows, null, 2));
        console.log(name, { T: rows.at(-1).T, decodeEndT: rows.at(-1).decodeEndT, decoderOnPhoto: rows.at(-1).photoDecoderRequests.length, kept, eanLookup: rows.at(-1).eanLookup.length, errors });
    }
    catch (error) {
        await fs.writeFile(out + '/' + label + '-' + name + '-error.json', JSON.stringify({ message: error.message, stack: error.stack }));
        throw error;
    }
    finally {
        await context.close().catch(error => { console.error('Context cleanup failed:', error.message); process.exitCode = 1; });
        await browser.close().catch(error => { console.error('Browser cleanup failed:', error.message); process.exitCode = 1; });
    }
}
assert.ok(rows.every(r => !r.photoDecoderRequests.length && r.kept.caption && r.kept.blobImages.some(i => i.alt !== 'Scanned pack') && !r.eanLookup.length), 'Photo must not load decoder or divert EAN photo');
assert.equal(rows.length, 2);
assert.ok(rows.every(r => r.errors.length === 0 && r.timing.opens === 1), 'no page error or camera restart');
if (baselineFile) {
    const baseline = JSON.parse(await fs.readFile(baselineFile, 'utf8'));
    for (const row of rows) {
        const before = baseline.find(r => r.name === row.name);
        assert.ok(before, 'matching baseline');
        assert.ok(row.T <= before.T + 100, `${row.name}: first decode start ${row.T} exceeds baseline ${before.T}+100ms`);
    }
}
