import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import test from 'node:test';

const require = createRequire(import.meta.url);
const reportUrl = 'https://mjai.ekyu.moe/report/52cad5a44a819221.json';
const invalidUrls = [
    'http://mjai.ekyu.moe/report/example.json',
    'https://example.com/report/example.json',
    'https://mjai.ekyu.moe:8443/report/example.json',
    'https://user:password@mjai.ekyu.moe/report/example.json',
    'https://mjai.ekyu.moe/other/example.json',
];

function localServer(fetchImpl = () => { throw new Error('Unexpected fetch'); }) {
    let listenArgs;
    const context = vm.createContext({
        __dirname: fileURLToPath(new URL('.', import.meta.url)),
        URL, Buffer, process: { env: { PORT: '4173' } },
        console: { log() {}, error() {} }, fetch: fetchImpl,
        require(name) {
            if (name === 'node:http') return {
                createServer: () => ({ listen(...args) { listenArgs = args; } }),
            };
            return require(name);
        },
    });
    vm.runInContext(readFileSync(new URL('./server.js', import.meta.url), 'utf8')
        + '\n globalThis.api = { validateReportUrl, proxyReport, route };', context);
    return { api: context.api, listenArgs };
}

function responseRecorder() {
    return {
        status: null, body: null,
        writeHead(status) { this.status = status; },
        end(body) { this.body = body; },
    };
}

const workerSource = readFileSync(new URL('../functions/api/report.js', import.meta.url), 'utf8');
const { onRequestGet } = await import(`data:text/javascript;base64,${Buffer.from(workerSource).toString('base64')}`);

test('local server binds exclusively to IPv4 loopback', () => {
    const { listenArgs } = localServer();
    assert.equal(listenArgs[0], 4173);
    assert.equal(listenArgs[1], '127.0.0.1');
});

test('local proxy accepts only the approved origin, path, and credential-free URLs', () => {
    const { api } = localServer();
    assert.equal(api.validateReportUrl(reportUrl).href, reportUrl);
    assert.equal(api.validateReportUrl(reportUrl.replace('.moe/', '.moe:443/')).href, reportUrl);
    for (const url of invalidUrls) assert.throws(() => api.validateReportUrl(url));
});

test('launcher applies the same report URL boundary', () => {
    const context = vm.createContext({
        URL, URLSearchParams, location: { search: '' },
        document: { querySelector: () => ({ addEventListener() {} }) },
    });
    vm.runInContext(readFileSync(new URL('./site.js', import.meta.url), 'utf8')
        + '\n globalThis.normalize = normalizeReportUrl;', context);
    assert.equal(context.normalize(reportUrl), reportUrl);
    assert.equal(context.normalize(`https://mjai.ekyu.moe/killerducky/?data=${encodeURIComponent(reportUrl)}`), reportUrl);
    for (const url of invalidUrls) assert.throws(() => context.normalize(url));
});

test('local server rejects foreign Host headers but serves localhost', async () => {
    const { api } = localServer();
    const blocked = responseRecorder();
    await api.route({ url: '/', method: 'GET', headers: { host: 'untrusted.example:4173' } }, blocked);
    assert.equal(blocked.status, 403);
    const allowed = responseRecorder();
    await api.route({ url: '/', method: 'GET', headers: { host: 'localhost:4173' } }, allowed);
    assert.equal(allowed.status, 200);
});

test('local proxy rejects redirects without making another request', async () => {
    let calls = 0;
    const { api } = localServer(async (url, options) => {
        calls++;
        assert.equal(url.href, reportUrl);
        assert.equal(options.redirect, 'error');
        throw new TypeError('Redirect rejected');
    });
    const response = responseRecorder();
    await api.proxyReport(new URL(`http://localhost:4173/api/report?url=${encodeURIComponent(reportUrl)}`), response);
    assert.equal(response.status, 502);
    assert.equal(calls, 1);
});

test('deployed proxy rejects invalid destinations before fetching', async t => {
    const originalFetch = globalThis.fetch;
    t.after(() => { globalThis.fetch = originalFetch; });
    globalThis.fetch = () => { throw new Error('Should not fetch an invalid URL'); };
    for (const url of invalidUrls) {
        const response = await onRequestGet({ request: new Request(`https://viewer.example/api/report?url=${encodeURIComponent(url)}`) });
        assert.equal(response.status, 400);
    }
});

test('deployed proxy passes valid reports through and blocks redirects', async t => {
    const originalFetch = globalThis.fetch;
    t.after(() => { globalThis.fetch = originalFetch; });
    let calls = 0;
    globalThis.fetch = async (url, options) => {
        calls++;
        assert.equal(url.href, reportUrl);
        assert.equal(options.redirect, 'error');
        return Response.json({ review: 'fixture' });
    };
    const request = new Request(`https://viewer.example/api/report?url=${encodeURIComponent(reportUrl)}`);
    const response = await onRequestGet({ request });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { review: 'fixture' });
    globalThis.fetch = async (url, options) => {
        calls++;
        assert.equal(options.redirect, 'error');
        throw new TypeError('Redirect rejected');
    };
    assert.equal((await onRequestGet({ request })).status, 502);
    assert.equal(calls, 2);
});
