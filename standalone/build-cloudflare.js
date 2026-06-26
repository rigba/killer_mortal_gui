const fs = require('node:fs/promises');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

async function copyDirectory(source, target) {
    await fs.cp(source, target, {
        recursive: true,
        force: true,
        filter: sourcePath => !sourcePath.includes(`${path.sep}server.js`),
    });
}

async function main() {
    await fs.rm(distDir, { recursive: true, force: true });
    await fs.mkdir(distDir, { recursive: true });

    await copyDirectory(path.join(rootDir, 'media'), path.join(distDir, 'media'));
    await copyDirectory(path.join(rootDir, 'new'), path.join(distDir, 'new'));
    await copyDirectory(path.join(rootDir, 'standalone'), path.join(distDir, 'standalone'));
    await fs.copyFile(path.join(rootDir, 'standalone', 'index.html'), path.join(distDir, 'index.html'));

    console.log(`Cloudflare Pages build written to ${distDir}`);
}

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
