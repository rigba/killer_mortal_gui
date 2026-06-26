#!/usr/bin/env node
const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const port = Number(process.env.PORT || 4173);

const mimeTypes = new Map([
    ['.css', 'text/css; charset=utf-8'],
    ['.html', 'text/html; charset=utf-8'],
    ['.js', 'text/javascript; charset=utf-8'],
    ['.json', 'application/json; charset=utf-8'],
    ['.svg', 'image/svg+xml'],
    ['.png', 'image/png'],
    ['.jpg', 'image/jpeg'],
    ['.jpeg', 'image/jpeg'],
    ['.ico', 'image/x-icon'],
    ['.mp3', 'audio/mpeg'],
    ['.xml', 'application/xml; charset=utf-8'],
    ['.webmanifest', 'application/manifest+json; charset=utf-8'],
]);

function send(response, statusCode, body, headers = {}) {
    response.writeHead(statusCode, headers);
    response.end(body);
}

function sendJson(response, statusCode, payload) {
    send(response, statusCode, JSON.stringify(payload), {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
    });
}

function safeJoin(baseDir, requestPath) {
    const decodedPath = decodeURIComponent(requestPath);
    const normalizedPath = path.normalize(decodedPath).replace(/^([/\\])+/, '');
    const filePath = path.join(baseDir, normalizedPath);
    const relativePath = path.relative(baseDir, filePath);
    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
        return null;
    }
    return filePath;
}

async function serveFile(response, filePath) {
    try {
        const data = await fs.readFile(filePath);
        const contentType = mimeTypes.get(path.extname(filePath).toLowerCase()) || 'application/octet-stream';
        send(response, 200, data, {
            'Content-Type': contentType,
            'Cache-Control': 'no-store',
        });
    } catch (error) {
        if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
            send(response, 404, 'Not found', { 'Content-Type': 'text/plain; charset=utf-8' });
            return;
        }
        console.error(error);
        send(response, 500, 'Internal server error', { 'Content-Type': 'text/plain; charset=utf-8' });
    }
}

function validateReportUrl(value) {
    if (!value) throw new Error('Missing url parameter.');

    const reportUrl = new URL(value);
    if (
        reportUrl.protocol !== 'https:'
        || reportUrl.hostname !== 'mjai.ekyu.moe'
        || !/^\/report\/[A-Za-z0-9_-]+\.json$/.test(reportUrl.pathname)
    ) {
        throw new Error('Only https://mjai.ekyu.moe/report/*.json is allowed.');
    }

    return reportUrl;
}

async function proxyReport(requestUrl, response) {
    let reportUrl;
    try {
        reportUrl = validateReportUrl(requestUrl.searchParams.get('url'));
    } catch (error) {
        sendJson(response, 400, { error: error.message });
        return;
    }

    try {
        const upstream = await fetch(reportUrl, {
            headers: { Accept: 'application/json' },
        });
        const body = Buffer.from(await upstream.arrayBuffer());
        send(response, upstream.status, body, {
            'Content-Type': upstream.headers.get('content-type') || 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
        });
    } catch (error) {
        console.error(error);
        sendJson(response, 502, { error: 'Could not fetch mjai report.' });
    }
}

async function route(request, response) {
    const requestUrl = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    const pathname = requestUrl.pathname;

    if (request.method !== 'GET' && request.method !== 'HEAD') {
        send(response, 405, 'Method not allowed', {
            'Content-Type': 'text/plain; charset=utf-8',
            Allow: 'GET, HEAD',
        });
        return;
    }

    if (pathname === '/api/report') {
        await proxyReport(requestUrl, response);
        return;
    }

    if (pathname === '/' || pathname === '/standalone' || pathname === '/standalone/') {
        await serveFile(response, path.join(__dirname, 'index.html'));
        return;
    }

    if (pathname === '/new') {
        send(response, 302, '', { Location: '/new/' });
        return;
    }

    if (pathname === '/new/') {
        await serveFile(response, path.join(rootDir, 'new', 'index.html'));
        return;
    }

    if (pathname.startsWith('/new/')) {
        const filePath = safeJoin(path.join(rootDir, 'new'), pathname.slice('/new/'.length));
        if (!filePath) {
            send(response, 403, 'Forbidden', { 'Content-Type': 'text/plain; charset=utf-8' });
            return;
        }
        await serveFile(response, filePath);
        return;
    }

    if (pathname.startsWith('/standalone/')) {
        const filePath = safeJoin(__dirname, pathname.slice('/standalone/'.length));
        if (!filePath) {
            send(response, 403, 'Forbidden', { 'Content-Type': 'text/plain; charset=utf-8' });
            return;
        }
        await serveFile(response, filePath);
        return;
    }

    if (pathname.startsWith('/media/')) {
        const filePath = safeJoin(path.join(rootDir, 'media'), pathname.slice('/media/'.length));
        if (!filePath) {
            send(response, 403, 'Forbidden', { 'Content-Type': 'text/plain; charset=utf-8' });
            return;
        }
        await serveFile(response, filePath);
        return;
    }

    if (/^\/[A-Za-z0-9_-]+\.json$/.test(pathname)) {
        await serveFile(response, path.join(rootDir, pathname.slice(1)));
        return;
    }

    send(response, 404, 'Not found', { 'Content-Type': 'text/plain; charset=utf-8' });
}

const server = http.createServer((request, response) => {
    route(request, response).catch(error => {
        console.error(error);
        send(response, 500, 'Internal server error', { 'Content-Type': 'text/plain; charset=utf-8' });
    });
});

server.listen(port, () => {
    console.log(`Killer Mortal standalone running at http://localhost:${port}`);
});
