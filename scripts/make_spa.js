const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, 'public');
const viewsDir = path.join(publicDir, 'views');

if (!fs.existsSync(viewsDir)) {
    fs.mkdirSync(viewsDir);
}

const filesToExtract = [
    { src: 'index.html', dest: 'home.html' },
    { src: 'login.html', dest: 'login.html' },
    { src: 'register.html', dest: 'register.html' },
    { src: 'admin.html', dest: 'admin.html' },
    { src: 'profile.html', dest: 'profile.html' },
    { src: 'paywall.html', dest: 'paywall.html' }
];

filesToExtract.forEach(file => {
    const filePath = path.join(publicDir, file.src);
    if (!fs.existsSync(filePath)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Prosta metoda wyciągnięcia zawartości div class="container" (i ewentualnie tagów obok kontenera dla modali w paywallu)
    let viewContent = '';
    
    if (file.src === 'paywall.html') {
        const startIdx = content.indexOf('<div class="container');
        const endIdx = content.indexOf('<script src="js/core.js">');
        if (startIdx !== -1 && endIdx !== -1) {
            viewContent = content.substring(startIdx, endIdx).trim();
        }
    } else {
        const startIdx = content.indexOf('<div class="container');
        const endIdx = content.lastIndexOf('</div>\n\n    <script');
        if (startIdx !== -1 && endIdx !== -1) {
            // Find the matching closing div for container? Actually, just taking until the script tags is easier.
            const scriptIdx = content.indexOf('<script src="js/core.js">');
            if (scriptIdx !== -1) {
                viewContent = content.substring(startIdx, scriptIdx).trim();
            }
        }
    }
    
    if (viewContent) {
        fs.writeFileSync(path.join(viewsDir, file.dest), viewContent);
        console.log(`Created view: ${file.dest}`);
    } else {
        console.log(`Failed to extract view from: ${file.src}`);
    }
});

// Zastąpienie index.html nową ramką SPA
const shellHtml = `<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="/css/style.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800&display=swap" rel="stylesheet">
    <title>SECURE.BLOG</title>
</head>
<body>
    <nav>
        <div class="logo" onclick="App.navigate('/')" style="cursor: pointer;">SECURE.BLOG</div>
        <div id="nav-links" style="display: flex; align-items: center; gap: 20px;">
            <!-- Renderowane przez app.js -->
        </div>
    </nav>

    <div id="app-root">
        <!-- Renderowane przez app.js -->
    </div>

    <script src="/js/core.js"></script>
    <script src="/js/app.js"></script>
</body>
</html>`;

fs.writeFileSync(path.join(publicDir, 'index.html'), shellHtml);
console.log('index.html replaced with SPA shell.');
