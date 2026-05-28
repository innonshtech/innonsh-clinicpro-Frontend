const fs = require('fs');
const content = fs.readFileSync('src/app/doctor-dashboard/page.jsx', 'utf8');
let stack = [];
let inString = null;
let inComment = false;
for(let i=0; i<content.length; i++) {
    let c = content[i];
    if (inComment) {
        if (c === '*' && content[i+1] === '/') { inComment = false; i++; }
        continue;
    }
    if (inString) {
        if (c === inString && content[i-1] !== '\\') inString = null;
        continue;
    }
    if (c === '/' && content[i+1] === '*') { inComment = true; i++; continue; }
    if (c === '/' && content[i+1] === '/') { while(content[i] !== '\n' && i < content.length) i++; continue; }
    if (c === '"' || c === "'" || c === '`') { inString = c; continue; }
    if (c === '{') stack.push(i);
    if (c === '}') {
        if (stack.length === 0) console.log('Extra closing brace at', i);
        else stack.pop();
    }
}
if (stack.length > 0) console.log('Unclosed braces at:', stack);
else console.log('Braces are balanced');
