const fs = require('fs');
const content = fs.readFileSync('src/app/receptionist-dashboard/appointments/page.jsx', 'utf8');
let tags = [];
let re = /<(\/?)([a-zA-Z0-9]+)([^>]*?)(\/?)>/g;
let match;
while ((match = re.exec(content)) !== null) {
    let [full, slash, name, attrs, selfClose] = match;
    if (selfClose === '/' || ['input', 'img', 'br', 'hr', 'link', 'meta'].includes(name.toLowerCase())) {
        // Self-closing
    } else if (slash === '/') {
        if (tags.length === 0) {
            console.log('Extra closing tag:', name, 'at', match.index);
        } else {
            let last = tags.pop();
            if (last !== name) {
                console.log('Mismatched tags:', last, 'and', name, 'at', match.index);
            }
        }
    } else {
        tags.push(name);
    }
}
if (tags.length > 0) console.log('Unclosed tags:', tags);
else console.log('Tags are balanced');
