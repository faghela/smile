const fs = require('fs');
const path = require('path');

const mainJsPath = path.join(__dirname, 'public/js/main.js');
const featuresDir = path.join(__dirname, 'public/js/features');

if (!fs.existsSync(featuresDir)) {
    fs.mkdirSync(featuresDir, { recursive: true });
}

const content = fs.readFileSync(mainJsPath, 'utf8');

const uiIdx1 = content.indexOf('// --- Micro-Interactions: Magnetic Button ---');
const searchIdx = content.indexOf('// --- Smart Search ---');
const productsIdx = content.indexOf('// --- Data Fetching (Products & Categories) ---');
const cartIdx = content.indexOf('// --- Cart & Upselling ---');
const checkoutIdx = content.indexOf('// --- Multi-step Checkout & Cities ---');
const toastsIdx = content.indexOf('// --- Toasts ---');
const initIdx = content.indexOf('// --- Init ---');

const globals = content.substring(0, uiIdx1).trim();
const uiSection1 = content.substring(uiIdx1, searchIdx).trim();
const searchContent = content.substring(searchIdx, productsIdx).trim();
const productsContent = content.substring(productsIdx, cartIdx).trim();
const cartContent = content.substring(cartIdx, checkoutIdx).trim();
const checkoutContent = content.substring(checkoutIdx, toastsIdx).trim();
const uiSection2 = content.substring(toastsIdx, initIdx).trim();
const initContent = content.substring(initIdx).trim();

const uiContent = uiSection1 + '\n\n' + uiSection2;

fs.writeFileSync(path.join(featuresDir, 'globals.js'), globals);
fs.writeFileSync(path.join(featuresDir, 'ui.js'), uiContent);
fs.writeFileSync(path.join(featuresDir, 'search.js'), searchContent);
fs.writeFileSync(path.join(featuresDir, 'products.js'), productsContent);
fs.writeFileSync(path.join(featuresDir, 'cart.js'), cartContent);
fs.writeFileSync(path.join(featuresDir, 'checkout.js'), checkoutContent);
fs.writeFileSync(path.join(__dirname, 'public/js/main.js'), initContent);

console.log('Frontend feature extraction completed.');
