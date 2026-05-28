const fs = require('fs');
const file = 'C:/Users/pc/Desktop/1905 DOC/Doctor_ERP/src/app/page.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/<label for=/g, '<label htmlFor=');
content = content.replace(/onsubmit="handleDemoSubmit\(event\)"/g, 'onSubmit={handleDemoSubmit}');
content = content.replace(/onsubmit="handleSignIn\(event\)"/g, 'onSubmit={handleSignIn}');

fs.writeFileSync(file, content);
console.log('Fixed for and onsubmit!');
