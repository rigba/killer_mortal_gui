const form = document.querySelector('#review-form');
const input = document.querySelector('#review-url');
const message = document.querySelector('#form-message');

function normalizeReportUrl(value) {
    let sourceUrl;
    try {
        sourceUrl = new URL(value.trim());
    } catch {
        throw new Error('Enter a full mjai.ekyu.moe URL.');
    }

    if (sourceUrl.hostname !== 'mjai.ekyu.moe') {
        throw new Error('Only mjai.ekyu.moe review URLs are supported.');
    }

    let reportUrl = sourceUrl;
    const dataParam = sourceUrl.searchParams.get('data');
    if (dataParam) {
        reportUrl = new URL(dataParam, sourceUrl.origin);
    }

    if (
        reportUrl.protocol !== 'https:'
        || reportUrl.hostname !== 'mjai.ekyu.moe'
        || !/^\/report\/[A-Za-z0-9_-]+\.json$/.test(reportUrl.pathname)
    ) {
        throw new Error('The URL must point to an mjai report JSON.');
    }

    return reportUrl.href;
}

form.addEventListener('submit', event => {
    event.preventDefault();
    message.textContent = '';

    try {
        const reportUrl = normalizeReportUrl(input.value);
        window.location.assign(`/new/?data=${encodeURIComponent(reportUrl)}`);
    } catch (error) {
        message.textContent = error.message;
        input.focus();
    }
});

const urlParam = new URLSearchParams(location.search).get('url');
if (urlParam) {
    input.value = urlParam;
}
