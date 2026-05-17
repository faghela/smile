const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const cssDir = path.join(publicDir, 'css');
const jsDir = path.join(publicDir, 'js');

// Create directories
if (!fs.existsSync(cssDir)) fs.mkdirSync(cssDir, { recursive: true });
if (!fs.existsSync(jsDir)) fs.mkdirSync(jsDir, { recursive: true });

function refactorFile(htmlFilename, cssFilename, jsFilename) {
    const htmlPath = path.join(publicDir, htmlFilename);
    const cssPath = path.join(cssDir, cssFilename);
    const jsPath = path.join(jsDir, jsFilename);

    let html = fs.readFileSync(htmlPath, 'utf8');

    // Extract and replace CSS
    const styleRegex = /<style>([\s\S]*?)<\/style>/;
    const styleMatch = html.match(styleRegex);
    if (styleMatch) {
        fs.writeFileSync(cssPath, styleMatch[1].trim());
        html = html.replace(styleRegex, `<link rel="stylesheet" href="/css/${cssFilename}">`);
        console.log(`Extracted CSS from ${htmlFilename} to ${cssFilename}`);
    }

    // Extract and replace JS
    // We want the <script> block that actually contains code, not external links.
    const scriptRegex = /<script>([\s\S]*?)<\/script>/g;
    let match;
    let jsContent = '';
    while ((match = scriptRegex.exec(html)) !== null) {
        if (match[1].trim().length > 0) {
            jsContent = match[1].trim();
            html = html.replace(match[0], `<script src="/js/${jsFilename}"></script>`);
            console.log(`Extracted JS from ${htmlFilename} to ${jsFilename}`);
            break; // Only extract the first non-empty inline script block
        }
    }

    if (jsContent) {
        fs.writeFileSync(jsPath, jsContent);
    }

    // Write back HTML
    fs.writeFileSync(htmlPath, html);
    console.log(`Updated ${htmlFilename}`);
}

try {
    refactorFile('index.html', 'style.css', 'main.js');
    refactorFile('admin.html', 'admin.css', 'admin.js');
    console.log('Refactoring completed successfully.');
} catch (e) {
    console.error('Error during refactoring:', e);
}
