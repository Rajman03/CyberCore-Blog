const fs = require('fs');
const path = require('path');

const cssDir = path.join(__dirname, 'public', 'css');
const styleCssPath = path.join(cssDir, 'style.css');
const mainCssPath = path.join(cssDir, 'main.css');
const adminCssPath = path.join(cssDir, 'admin.css');
const paywallCssPath = path.join(cssDir, 'paywall.css');

const indexHtmlPath = path.join(__dirname, 'public', 'index.html');

if (!fs.existsSync(styleCssPath)) {
    console.log('style.css not found, maybe already split?');
    process.exit(0);
}

const css = fs.readFileSync(styleCssPath, 'utf8');

const rules = css.split('}').map(r => r + '}');

let mainCss = '';
let adminCss = '';
let paywallCss = '';

rules.forEach(rule => {
    if (rule.trim() === '}') return;
    
    if (rule.includes('.admin-') || rule.includes('.dashboard-') || rule.includes('.stat-') || rule.includes('.role-')) {
        adminCss += rule + '\n';
    } else if (rule.includes('.premium-') || rule.includes('.plan-') || rule.includes('.modal') || rule.includes('.lock-')) {
        paywallCss += rule + '\n';
    } else {
        mainCss += rule + '\n';
    }
});

fs.writeFileSync(mainCssPath, mainCss);
fs.writeFileSync(adminCssPath, adminCss);
fs.writeFileSync(paywallCssPath, paywallCss);

// Remove the old style.css
fs.unlinkSync(styleCssPath);

// Update index.html
let html = fs.readFileSync(indexHtmlPath, 'utf8');
html = html.replace('<link rel="stylesheet" href="/css/style.css">', 
`<link rel="stylesheet" href="/css/main.css">
    <link rel="stylesheet" href="/css/admin.css">
    <link rel="stylesheet" href="/css/paywall.css">`);
fs.writeFileSync(indexHtmlPath, html);

console.log('CSS split successful.');
