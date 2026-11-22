// Real meal headers; caller supplies a ledger of four disposable meals (normal/
// long handles, ready/failed) and private normal-session.json/long-session.json.
// This check never seeds or changes meal data. All runs require a loopback app.
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const { APP_URL: app, HEADER_TEXT_CHECK_OUT: out, HEADER_TEXT_FIXTURE_DIR: fixtureDir, MFA_PLAYWRIGHT_MODULE: browserModule, HEADER_TEXT_CHECK_LABEL: label = 'run' } = process.env;
if (process.env.MFA_TEST_DISPOSABLE !== '1' || !app ||
    !['127.0.0.1', 'localhost'].includes(new URL(app).hostname) ||
    !out || !fixtureDir || !browserModule)
    throw Error('Disposable loopback app, fixture folder, fresh output folder and browser module required.');
await fs.mkdir(out);
const { webkit, chromium, devices } = await import(browserModule);
const ledger = JSON.parse(await fs.readFile(fixtureDir + '/ledger.json', 'utf8'));
assert.equal(ledger.posts.length, 4, 'normal/long handles, each ready and failed');
const results = [];
for (const name of ['webkit', 'chromium'])
    for (const kind of ['normal', 'long']) {
        const browser = await (name === 'webkit' ? webkit : chromium).launch(name === 'chromium' ? { executablePath: process.env.TEST_CHROMIUM_EXECUTABLE, args: ['--no-sandbox'] } : {});
        const context = await browser.newContext({ ...devices['iPhone 13'], viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, timezoneId: 'UTC', serviceWorkers: 'block' }), session = JSON.parse(await fs.readFile(fixtureDir + '/' + kind + '-session.json', 'utf8'));
        try {
            await context.addCookies(session.cookie.split('; ').map(part => { const i = part.indexOf('='); return { name: part.slice(0, i), value: part.slice(i + 1), url: app }; }).filter(c => c.name !== 'time-zone').concat([{ name: 'time-zone', value: 'UTC', url: app }]));
            await context.addInitScript(() => document.addEventListener('DOMContentLoaded', () => document.documentElement.style.webkitTextSizeAdjust = '100%', { once: true }));
            const page = await context.newPage(), pageErrors = [];
            page.on('pageerror', e => pageErrors.push(e.message));
            for (const surface of ['detail-ready', 'detail-failed', 'feed']) {
                const post = ledger.posts.find(p => p.kind === kind && p.status === (surface === 'detail-failed' ? 'failed' : 'ready'));
                await page.goto(app + (surface === 'feed' ? '' : '/posts/' + post.id), { waitUntil: 'load', timeout: 30000 });
                const find = ({ handle, surface, id }) => { if (surface === 'feed') {
                    const article = document.querySelector(`article[data-post-id="${id}"]`);
                    return article && [...article.querySelectorAll('span')].find(e => e.textContent === handle && e.getBoundingClientRect().width > 0);
                } return [...document.querySelectorAll('p')].find(e => e.textContent === handle && e.getBoundingClientRect().width > 0); };
                const config = { handle: post.handle, surface, id: post.id };
                await page.waitForFunction(find, config, { timeout: 15000 });
                await page.evaluate(({ find, config }) => { window.__headerName = (0, eval)('(' + find + ')')(config); let header = window.__headerName; while (header && !header.classList.contains('min-h-[52px]'))
                    header = header.parentElement; if (!header)
                    throw Error('No actual header'); window.__header = header; window.__headerFonts = [...header.querySelectorAll('*')].map((el, index) => { el.dataset.fontCase = String(index); const style = getComputedStyle(el); return { index, font: parseFloat(style.fontSize), line: parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.4 }; }); }, { find: find.toString(), config });
                for (const scale of [100, 150, 200, 300]) {
                    const row = await page.evaluate(async ({ scale, surface }) => { document.getElementById('header-font-override')?.remove(); document.documentElement.style.webkitTextSizeAdjust = scale + '%'; await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); const name = window.__headerName, header = window.__header, base = window.__headerFonts.find(r => header.querySelector(`[data-font-case="${r.index}"]`) === name); if (!base)
                        throw Error('No name font'); const nativeFont = parseFloat(getComputedStyle(name).fontSize); let mode = 'native'; if (scale !== 100 && Math.abs(nativeFont - base.font * scale / 100) > .2) {
                        mode = 'harness-computed-font';
                        document.documentElement.style.webkitTextSizeAdjust = '100%';
                        const style = document.createElement('style');
                        style.id = 'header-font-override';
                        style.textContent = window.__headerFonts.map(f => `[data-font-case="${f.index}"]{font-size:${f.font * scale / 100}px!important;line-height:${f.line * scale / 100}px!important;}`).join('\n');
                        document.head.append(style);
                    } await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); const node = [...name.childNodes].find(n => n.nodeType === Node.TEXT_NODE), lines = []; for (let i = 0; i < node.textContent.length; i++) {
                        const range = document.createRange();
                        range.setStart(node, i);
                        range.setEnd(node, i + 1);
                        const rect = range.getBoundingClientRect();
                        let line = lines.find(l => Math.abs(l.top - rect.top) < 2);
                        if (!line) {
                            line = { top: rect.top, text: '' };
                            lines.push(line);
                        }
                        line.text += node.textContent[i];
                    } const copy = document.createElement('span'); copy.textContent = node.textContent; Object.assign(copy.style, { position: 'absolute', webkitTextSizeAdjust: '100%', whiteSpace: 'nowrap', font: getComputedStyle(name).font, letterSpacing: getComputedStyle(name).letterSpacing }); document.body.append(copy); const unbroken = copy.getBoundingClientRect().width; copy.remove(); const box = name.getBoundingClientRect(), h = header.getBoundingClientRect(), inner = surface === 'feed' ? header : name.parentElement; return { scale, mode, baseFont: base.font, nativeFont, computedFont: parseFloat(getComputedStyle(name).fontSize), lineHeight: getComputedStyle(name).lineHeight, headerHeight: h.height, headerWidth: h.width, nameWidth: box.width, unbrokenWidth: unbroken, availableWidth: inner.getBoundingClientRect().width, lines: lines.map(l => l.text), charactersPerLine: lines.map(l => l.text.length), showServings: Boolean(header.querySelector('[aria-label^="Edit servings,"]')), overflowWrap: getComputedStyle(name).overflowWrap, innerWrap: getComputedStyle(inner).flexWrap }; }, { scale, surface });
                    row.pageErrors = [...pageErrors];
                    row.name = name;
                    row.kind = kind;
                    row.surface = surface;
                    row.post = post.id;
                    row.wordSqueezed = row.lines.length > 1 && row.unbrokenWidth <= row.availableWidth + .5;
                    assert.ok(row.headerHeight > 0, 'measure a visible header');
                    assert.ok(Math.abs(row.computedFont - row.baseFont * scale / 100) < .2, 'requested text size applied');
                    assert.equal(row.showServings, surface === 'detail-ready', 'servings remains on ready meals only');
                    row.pass = row.headerHeight < 200 && !row.wordSqueezed;
                    results.push(row);
                    await page.screenshot({ path: `${out}/${label}-${name}-${kind}-${surface}-${scale}.png` });
                    await fs.writeFile(out + '/' + label + '-results.json', JSON.stringify({ results, pageErrors }, null, 2));
                    console.log(name, kind, surface, scale, row.mode, row.headerHeight, row.lines, row.pass);
                }
            }
        }
        catch (error) {
            await fs.writeFile(out + '/' + label + '-interruption.json', JSON.stringify({ name, kind, message: error.message, stack: error.stack }));
            throw error;
        }
        finally {
            await context.close().catch(error => { console.error('Context cleanup failed:', error.message); process.exitCode = 1; });
            await browser.close().catch(error => { console.error('Browser cleanup failed:', error.message); process.exitCode = 1; });
        }
    }
assert.equal(results.length, 48, 'complete browser/handle/surface/size matrix');
assert.ok(results.every(row => row.pageErrors.length === 0), 'no page errors');
const required = results.filter(r => r.kind === 'normal' && r.scale >= 150);
assert.ok(required.every(r => r.pass), `Header failed ${required.filter(r => !r.pass).map(r => r.name + ' ' + r.surface + ' ' + r.scale).join(', ')}`);
