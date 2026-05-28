const fs = require('fs');
const file = 'C:/Users/pc/Desktop/1905 DOC/Doctor_ERP/src/app/page.js';
let content = fs.readFileSync(file, 'utf8');

const linkRegex = /<a href=\"#([^\"]+)\"/g;
content = content.replace(linkRegex, (match, p1) => {
    if (p1 === 'signin-modal') return match;
    return `<a href="#${p1}" onClick={(e) => handleSmoothScroll(e, '#${p1}')}`;
});

fs.writeFileSync(file, content);
console.log('Fixed anchor routing!');
