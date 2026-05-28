const fs = require('fs');

const path = 'src/app/receptionist-dashboard/Header.jsx';
let content = fs.readFileSync(path, 'utf8');

const regex = /\{\/\*\s*Dashboard Title & Date \(Desktop\)\s*\*\/\}[\s\S]*?\{\/\*\s*Right side\s*\*\/\}/;

const replacement = `<div className="hidden lg:flex flex-1 max-w-lg ml-4 group">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const term = e.target.search.value;
                if (term.trim()) {
                  router.push(\`/receptionist-dashboard/patients?search=\${encodeURIComponent(term)}\`);
                }
              }}
              className="w-full relative"
            >
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              </div>
              <input
                name="search"
                type="text"
                className="block w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all shadow-sm"
                placeholder="Global Search..."
              />
            </form>
          </div>
        </div>

        {/* Right side */}`;

if (regex.test(content)) {
  fs.writeFileSync(path, content.replace(regex, replacement));
  console.log("Successfully replaced the receptionist header layout left part!");
} else {
  console.error("Regex did not match anything in receptionist layout header.");
}
