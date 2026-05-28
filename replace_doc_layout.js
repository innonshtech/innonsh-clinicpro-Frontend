const fs = require('fs');

const path = 'src/app/doctor-dashboard/layout.jsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /<div className="hidden lg:flex flex-col min-w-\[200px\]">[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/;

const replacement = `<div className="hidden lg:flex items-center max-w-md w-full ml-4 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3" />
                <input 
                  type="text" 
                  placeholder="Global Search..." 
                  className="w-full bg-slate-50 border border-slate-200 text-sm rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>
            </div>`;

if (regex.test(content)) {
  fs.writeFileSync(path, content.replace(regex, replacement));
  console.log("Successfully replaced the doctor header layout left part!");
} else {
  console.error("Regex did not match anything in doctor layout.");
}
