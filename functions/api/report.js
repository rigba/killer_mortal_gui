function jsonResponse(status, payload) {
    return new Response(JSON.stringify(payload), {
        status,
        headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Cache-Control': 'no-store',
        },
    });
}

function validateReportUrl(value) {
    if (!value) throw new Error('Missing url parameter.');

    const reportUrl = new URL(value);
    if (
        reportUrl.origin !== 'https://mjai.ekyu.moe'
        || reportUrl.username
        || reportUrl.password
        || !/^\/report\/[A-Za-z0-9_-]+\.json$/.test(reportUrl.pathname)
    ) {
        throw new Error('Only https://mjai.ekyu.moe/report/*.json is allowed.');
    }

    return reportUrl;
}

export async function onRequestGet({ request }) {
    let reportUrl;
    try {
        const requestUrl = new URL(request.url);
        reportUrl = validateReportUrl(requestUrl.searchParams.get('url'));
    } catch (error) {
        return jsonResponse(400, { error: error.message });
    }

    try {
        const upstream = await fetch(reportUrl, {
            headers: { Accept: 'application/json' },
            redirect: 'error',
        });

        return new Response(upstream.body, {
            status: upstream.status,
            headers: {
                'Content-Type': upstream.headers.get('content-type') || 'application/json; charset=utf-8',
                'Cache-Control': 'no-store',
            },
        });
    } catch (error) {
        return jsonResponse(502, { error: 'Could not fetch mjai report.' });
    }
}
