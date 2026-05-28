const fs = require('fs');
const file = 'C:/Users/pc/Desktop/1905 DOC/Doctor_ERP/src/app/page.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/href=\"#\"/g, 'href=\"#!\" onClick={(e) => e.preventDefault()}');

fs.writeFileSync(file, content);
console.log('Fixed # anchors!');
