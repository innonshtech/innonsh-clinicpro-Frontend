const fs = require('fs');

const path = 'src/app/admin/page.js';
let content = fs.readFileSync(path, 'utf8');

const regex = /\{\/\*\s*Header\s*\*\/\}[\s\S]*?<div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">[\s\S]*?<\/div>\s*<\/div>/;

const replacement = `{/* Page Header */}
      <div className="flex flex-col gap-2 mb-2">
        <div className="flex items-center text-sm text-slate-500 font-medium">
          <span className="hover:text-blue-600 cursor-pointer transition-colors">Home</span>
          <span className="mx-2">/</span>
          <span className="text-slate-800">Dashboard</span>
        </div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
            <p className="text-slate-500 mt-1 text-sm">Welcome back! Here's what's happening today.</p>
          </div>
          <div className="flex items-center space-x-2 text-sm text-slate-500 bg-white border border-slate-200 shadow-sm px-4 py-2 rounded-xl">
            <Calendar className="h-4 w-4 text-blue-500" />
            <span className="font-medium">Last updated: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>
      </div>`;

if (regex.test(content)) {
  fs.writeFileSync(path, content.replace(regex, replacement));
  console.log("Successfully replaced the header!");
} else {
  console.error("Regex did not match anything.");
}
